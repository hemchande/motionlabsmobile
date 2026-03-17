/**
 * Live Camera WebSocket Client
 *
 * Connects to the live camera metrics service and streams video frames
 * for real-time pose estimation, athlete tracking, and metrics calculation.
 *
 * How the client listens to metrics and the annotated frame:
 *
 * 1. JSON message type "live_camera_frame" (recommended server format):
 *    - message.annotated_image: base64-encoded JPEG string.
 *    - message.display: object with frame_count, phase, athlete_id, athlete_name,
 *      metrics (object), form_issues (array), movement_msg, visibility_msg,
 *      is_moving, is_full_body, segments_count, acl_summary, turn_detected, timestamp.
 *    The client decodes annotated_image to a blob URL, then:
 *    - Emits "frame" with { image: blobUrl, frameNumber, timestamp, athlete, athleteName, display }.
 *    - If display has metrics/phase/form_issues, emits "metrics" with MetricsData built from display.
 *    - If display.athlete_id is set, emits "athlete" with { athleteId, athleteName }.
 *
 * 2. Binary message: raw JPEG bytes. Client creates a blob URL and emits "frame" only
 *    (no metrics from that message).
 *
 * 3. Other JSON types: "init", "metrics", "athlete_detected", "segment_saved", "session_end", "error"
 *    are handled and emitted as appropriate.
 *
 * Usage:
 *   const client = new LiveCameraWSClient('ws://localhost:8010/api/live-camera/ws');
 *   client.on('frame', (data) => { ... });  // data.image = blob URL; data.display = server display payload
 *   client.on('metrics', (data) => { ... }); // feed into LiveCameraMetricsCards
 *   await client.connect();
 *   client.sendFrame(videoElement);
 */

/** Display payload for styled UI (parity with live_camera_service / test_live_camera_metrics.py) */
export interface LiveCameraDisplay {
  frame_count?: number;
  phase?: string;
  athlete_id?: string;
  athlete_name?: string;
  metrics?: Record<string, unknown>;
  form_issues?: string[];
  movement_msg?: string;
  visibility_msg?: string;
  is_moving?: boolean;
  is_full_body?: boolean;
  segments_count?: number;
  acl_summary?: string;
  turn_detected?: boolean;
  timestamp?: number;
}

export interface FrameData {
  image: string;
  frameNumber: number;
  timestamp: number;
  athlete?: string;
  athleteName?: string;
  /** When server sends type "live_camera_frame" with display object */
  display?: LiveCameraDisplay;
}

export interface MetricsData {
  frameNumber: number;
  timestamp: number;
  metrics: Record<string, unknown>;
  phase?: string;
  athlete?: string;
  formIssues?: string[];
  aclRisk?: number;
  /** From live_camera_frame display */
  movementMsg?: string;
  visibilityMsg?: string;
  isMoving?: boolean;
  isFullBody?: boolean;
  segmentsCount?: number;
  aclSummary?: string;
  turnDetected?: boolean;
}

export interface AthleteData {
  athleteId: string;
  athleteName?: string;
  confidence?: number;
}

export interface SegmentData {
  sessionId: string;
  segmentNumber: number;
  athleteId: string;
  athleteName?: string;
  frameCount: number;
  mongoId?: string;
  gcsPath?: string;
}

export interface SessionEndData {
  sessionId: string;
  totalFrames: number;
  segments: number;
  clips?: number;
  metricsFile?: string;
}

/** Pose-only stream: skeleton overlay only, no metrics/panels (live_camera_pose_only). */
export interface PoseOnlyData {
  poseOnlyImageBase64: string;
  frameNumber?: number;
  timestamp?: number;
}

type EventType = 'open' | 'close' | 'error' | 'frame' | 'metrics' | 'athlete' | 'segment' | 'sessionEnd' | 'pose_only';
type EventCallback<T = unknown> = (data: T) => void;

/** Optional config for LiveCameraWSClient. Lower sendInterval = higher FPS (e.g. 33 = ~30 FPS); higher = smoother on slow backends (e.g. 100 = 10 FPS). */
export interface LiveCameraWSClientConfig {
  sendInterval?: number;
  frameWidth?: number;
  frameQuality?: number;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WSConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  frameQuality: number;
  frameWidth: number;
  sendInterval: number;
}

export class LiveCameraWSClient {
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private sessionId: string | null = null;
  private frameCount = 0;
  private callbacks: Record<EventType, EventCallback[]> = {
    open: [],
    close: [],
    error: [],
    frame: [],
    metrics: [],
    athlete: [],
    segment: [],
    sessionEnd: [],
    pose_only: [],
  };
  private config: WSConfig = {
    maxReconnectAttempts: 3,
    reconnectDelay: 2000,
    frameQuality: 0.75,
    frameWidth: 480,
    sendInterval: 66, // ~15 FPS default – keeps playback responsive; increase to 33 for ~30 FPS if backend is fast
  };
  private reconnectAttempts = 0;
  private sendTimer: number | null = null;
  /** Backpressure: don't send next frame until current one has been sent (avoids queue buildup and slow playback). */
  private sendPending = false;

  constructor(wsUrl = 'ws://localhost:8010/api/live-camera/ws', config?: LiveCameraWSClientConfig) {
    this.wsUrl = wsUrl;
    if (config) this.config = { ...this.config, ...config };
  }

  /**
   * Build WebSocket URL from a base URL (e.g. http://localhost:8010 or https://live-camera-xxx.run.app).
   * Uses wss:// for https base, ws:// for http. Path is always /api/live-camera/ws.
   * Optional: append ?athlete_id=...&athlete_name=... for segment labelling when face is unknown.
   */
  static getWebSocketUrl(
    baseUrl: string,
    params?: { athlete_id?: string; athlete_name?: string }
  ): string {
    const u = (baseUrl || '').trim().replace(/\/$/, '');
    if (!u) return 'ws://localhost:8010/api/live-camera/ws';
    const url = u.startsWith('http') ? u : 'https://' + u;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return 'ws://localhost:8010/api/live-camera/ws';
    }
    const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsPath = `${protocol}//${parsed.host}/api/live-camera/ws`;
    if (params?.athlete_id || params?.athlete_name) {
      const q = new URLSearchParams();
      if (params.athlete_id) q.set('athlete_id', params.athlete_id);
      if (params.athlete_name) q.set('athlete_name', params.athlete_name);
      wsPath += '?' + q.toString();
    }
    return wsPath;
  }

  /**
   * Register event callback
   */
  on<T = unknown>(event: EventType, callback: EventCallback<T>): this {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback as EventCallback);
    } else {
      console.warn(`Unknown event: ${event}`);
    }
    return this;
  }

  /**
   * Emit event to all registered callbacks
   */
  private emit(event: EventType, data: unknown): void {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in ${event} callback:`, err);
        }
      });
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔌 Connecting to ${this.wsUrl}...`);
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('open', { url: this.wsUrl });
          resolve();
        };

        this.ws.onclose = (event) => {
          const closeReasons: Record<number, string> = {
            1000: 'Normal closure',
            1001: 'Going away',
            1002: 'Protocol error',
            1003: 'Unsupported data',
            1006: 'Abnormal closure (no close frame)',
            1007: 'Invalid data',
            1008: 'Policy violation',
            1009: 'Message too big',
            1010: 'Missing extension',
            1011: 'Internal server error',
            1015: 'TLS handshake failed'
          };
          
          const meaning = closeReasons[event.code] || 'Unknown error';
          console.log(`🔌 WebSocket closed: Code ${event.code} - ${meaning}${event.reason ? ` (${event.reason})` : ''}`);
          
          if (event.code === 1011) {
            console.error('⚠️  Backend server error - check Cloud Run logs for details');
          }
          
          this.isConnected = false;
          this.emit('close', { code: event.code, reason: event.reason });

          // Auto-reconnect if not clean close
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.config.reconnectDelay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.error('🔗 URL:', this.wsUrl);
          console.error('📡 Check that the backend service is deployed and WebSocket endpoint is configured');
          this.emit('error', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        console.error('❌ Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket message (binary or JSON)
   */
  private handleMessage(event: MessageEvent): void {
    // Binary message = annotated frame from server (matches HTML test clients)
    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
      const blob = event.data instanceof Blob 
        ? event.data 
        : new Blob([event.data], { type: 'image/jpeg' });
      
      const blobUrl = URL.createObjectURL(blob);
      
      this.emit('frame', {
        image: blobUrl,  // Blob URL for display in <img>
        frameNumber: this.frameCount,
        timestamp: Date.now() / 1000,
      } as FrameData);
      return;
    }

    // JSON message = metadata (init, live_camera_frame, metrics, athlete, etc.)
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'live_camera_frame': {
          // Single-message format: annotated_image + display (parity with test_live_camera_metrics.py)
          const base64 = message.annotated_image;
          const display = message.display as LiveCameraDisplay | undefined;
          if (base64) {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const blobUrl = URL.createObjectURL(blob);
            const frameNum = display?.frame_count ?? this.frameCount;
            this.emit('frame', {
              image: blobUrl,
              frameNumber: frameNum,
              timestamp: display?.timestamp ?? Date.now() / 1000,
              athlete: display?.athlete_id,
              athleteName: display?.athlete_name,
              display,
            } as FrameData);
          }
          // Emit metrics whenever display exists so UI gets metrics, phase, form_issues, movement_msg, visibility_msg, etc.
          if (display != null) {
            this.emit('metrics', {
              frameNumber: display.frame_count ?? this.frameCount,
              timestamp: display.timestamp ?? Date.now() / 1000,
              metrics: display.metrics ?? {},
              phase: display.phase,
              athlete: display.athlete_id,
              formIssues: display.form_issues,
              movementMsg: display.movement_msg,
              visibilityMsg: display.visibility_msg,
              isMoving: display.is_moving,
              isFullBody: display.is_full_body,
              segmentsCount: display.segments_count,
              aclSummary: display.acl_summary,
              turnDetected: display.turn_detected,
            } as MetricsData);
          }
          if (display?.athlete_id != null) {
            this.emit('athlete', {
              athleteId: display.athlete_id,
              athleteName: display.athlete_name,
            } as AthleteData);
          }
          break;
        }

        case 'init':
          this.sessionId = message.session_id;
          console.log(`📋 Session started: ${this.sessionId}`);
          break;

        case 'frame':
          // JSON frame (if server sends base64) - convert to blob URL
          const base64 = message.frame;
          if (base64) {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'image/jpeg' });
            const blobUrl = URL.createObjectURL(blob);
            
            this.emit('frame', {
              image: blobUrl,
              frameNumber: message.frame_number,
              timestamp: message.timestamp,
              athlete: message.athlete_id,
              athleteName: message.athlete_name,
            } as FrameData);
          }
          break;

        case 'metrics':
        case 'live_camera_metrics': {
          this.emit('metrics', {
            frameNumber: message.frame_number,
            timestamp: message.timestamp,
            metrics: message.metrics,
            phase: message.phase,
            athlete: message.athlete_id,
            formIssues: message.form_issues,
            aclRisk: message.acl_risk,
            movementMsg: message.movement_msg,
            visibilityMsg: message.visibility_msg,
            segmentsCount: message.segments_count,
            aclSummary: message.acl_summary,
            turnDetected: message.turn_detected,
          } as MetricsData);
          break;
        }

        case 'athlete_detected':
          console.log(`👤 Athlete: ${message.athlete_name || message.athlete_id}`);
          this.emit('athlete', {
            athleteId: message.athlete_id,
            athleteName: message.athlete_name,
            confidence: message.confidence,
          } as AthleteData);
          break;

        case 'segment_saved':
          console.log(`💾 Segment ${message.segment_number} saved (${message.athlete_id})`);
          this.emit('segment', {
            sessionId: message.session_id,
            segmentNumber: message.segment_number,
            athleteId: message.athlete_id,
            athleteName: message.athlete_name,
            frameCount: message.frame_count,
            mongoId: message.mongo_id,
            gcsPath: message.gcs_path,
          } as SegmentData);
          break;

        case 'session_end':
          console.log(`🏁 Session ended: ${this.sessionId}`);
          this.emit('sessionEnd', {
            sessionId: message.session_id,
            totalFrames: message.total_frames,
            segments: message.segments,
            clips: message.clips,
            metricsFile: message.metrics_file,
          } as SessionEndData);
          break;

        case 'live_camera_pose_only': {
          const poseOnlyBase64 = message.pose_only_image;
          if (poseOnlyBase64) {
            this.emit('pose_only', {
              poseOnlyImageBase64: poseOnlyBase64,
              frameNumber: message.frame_number,
              timestamp: message.timestamp,
            } as PoseOnlyData);
          }
          break;
        }

        case 'error':
          console.error('❌ Server error:', message.error);
          this.emit('error', { message: message.error });
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  }

  /**
   * Send video frame to server. Default: binary JPEG (efficient).
   * Uses backpressure: sets sendPending until blob is sent so we don't queue frames (smoother playback).
   */
  sendFrame(source: HTMLVideoElement | HTMLCanvasElement, asJson = false): boolean {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️  WebSocket not connected');
      return false;
    }
    if (this.sendPending) return false; // backpressure: skip this tick if previous frame still encoding/sending

    try {
      const canvas = document.createElement('canvas');
      const isVideo = 'videoWidth' in source;
      const aspectRatio = isVideo
        ? source.videoHeight / source.videoWidth
        : source.height / source.width;
      canvas.width = this.config.frameWidth;
      canvas.height = Math.round(this.config.frameWidth * aspectRatio);

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      this.sendPending = true;
      const onSent = () => {
        this.sendPending = false;
        this.frameCount++;
      };

      if (asJson) {
        canvas.toBlob(
          (blob) => {
            if (!blob || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
              this.sendPending = false;
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1] ?? '';
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ frame: base64 }));
                onSent();
              } else {
                this.sendPending = false;
              }
            };
            reader.readAsDataURL(blob);
          },
          'image/jpeg',
          this.config.frameQuality
        );
      } else {
        canvas.toBlob(
          (blob) => {
            if (blob && this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(blob);
              onSent();
            } else {
              this.sendPending = false;
            }
          },
          'image/jpeg',
          this.config.frameQuality
        );
      }
      return true;
    } catch (error) {
      this.sendPending = false;
      console.error('❌ Error sending frame:', error);
      return false;
    }
  }

  /**
   * Start continuous frame streaming from video element.
   * Uses sendInterval as max rate; backpressure ensures we only have one frame in flight for responsive playback.
   */
  startStreaming(videoElement: HTMLVideoElement): void {
    if (this.sendTimer) {
      console.warn('⚠️  Already streaming');
      return;
    }

    const targetFps = Math.round(1000 / this.config.sendInterval);
    console.log(`📹 Starting stream (target ${targetFps} FPS, ${this.config.frameWidth}px, backpressure on)`);

    this.sendTimer = window.setInterval(() => {
      if (videoElement.readyState >= 2 && !this.sendPending) {
        this.sendFrame(videoElement);
      }
    }, this.config.sendInterval);
  }

  /**
   * Stop continuous frame streaming
   */
  stopStreaming(): void {
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
    this.sendPending = false;
    console.log('🛑 Streaming stopped');
  }

  /**
   * End session and disconnect
   */
  async disconnect(): Promise<void> {
    this.stopStreaming();

    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify({ type: 'end_session' }));
      } catch (error) {
        console.warn('Failed to send end_session:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.sessionId = null;
      this.frameCount = 0;
    }
  }

  /**
   * Update configuration
   */
  configure(options: Partial<WSConfig>): void {
    Object.assign(this.config, options);
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; sessionId: string | null; frameCount: number } {
    return {
      connected: this.isConnected,
      sessionId: this.sessionId,
      frameCount: this.frameCount,
    };
  }
}
