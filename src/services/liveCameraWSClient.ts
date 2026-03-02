/**
 * Live Camera WebSocket Client
 *
 * Connects to the live camera metrics service and streams video frames
 * for real-time pose estimation, athlete tracking, and metrics calculation.
 *
 * Usage:
 *   const client = new LiveCameraWSClient('ws://localhost:8010/api/live-camera/ws');
 *   client.on('frame', (data) => { ... });
 *   client.on('metrics', (data) => { ... });
 *   await client.connect();
 *   client.sendFrame(videoElement);
 */

export interface FrameData {
  image: string;
  frameNumber: number;
  timestamp: number;
  athlete?: string;
  athleteName?: string;
}

export interface MetricsData {
  frameNumber: number;
  timestamp: number;
  metrics: Record<string, unknown>;
  phase?: string;
  athlete?: string;
  formIssues?: string[];
  aclRisk?: number;
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

type EventType = 'open' | 'close' | 'error' | 'frame' | 'metrics' | 'athlete' | 'segment' | 'sessionEnd';
type EventCallback<T = unknown> = (data: T) => void;

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
  };
  private config: WSConfig = {
    maxReconnectAttempts: 3,
    reconnectDelay: 2000,
    frameQuality: 0.8,
    frameWidth: 640,
    sendInterval: 33, // ~30 FPS
  };
  private reconnectAttempts = 0;
  private sendTimer: number | null = null;

  constructor(wsUrl = 'ws://localhost:8010/api/live-camera/ws') {
    this.wsUrl = wsUrl;
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

    // JSON message = metadata (init, metrics, athlete, etc.)
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
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
          this.emit('metrics', {
            frameNumber: message.frame_number,
            timestamp: message.timestamp,
            metrics: message.metrics,
            phase: message.phase,
            athlete: message.athlete_id,
            formIssues: message.form_issues,
            aclRisk: message.acl_risk,
          } as MetricsData);
          break;

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
   * Send video frame to server as binary JPEG (matches HTML test clients)
   */
  sendFrame(source: HTMLVideoElement | HTMLCanvasElement): boolean {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️  WebSocket not connected');
      return false;
    }

    try {
      const canvas = document.createElement('canvas');

      // Resize to target width while maintaining aspect ratio
      const isVideo = 'videoWidth' in source;
      const aspectRatio = isVideo
        ? source.videoHeight / source.videoWidth
        : source.height / source.width;
      canvas.width = this.config.frameWidth;
      canvas.height = Math.round(this.config.frameWidth * aspectRatio);

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      // Convert to binary JPEG blob and send (more efficient than base64 JSON)
      canvas.toBlob(
        (blob) => {
          if (blob && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(blob); // Send as binary WebSocket message
            this.frameCount++;
          }
        },
        'image/jpeg',
        this.config.frameQuality
      );

      return true;
    } catch (error) {
      console.error('❌ Error sending frame:', error);
      return false;
    }
  }

  /**
   * Start continuous frame streaming from video element
   */
  startStreaming(videoElement: HTMLVideoElement): void {
    if (this.sendTimer) {
      console.warn('⚠️  Already streaming');
      return;
    }

    console.log(`📹 Starting stream (${Math.round(1000 / this.config.sendInterval)} FPS)`);

    this.sendTimer = window.setInterval(() => {
      if (videoElement.readyState >= 2) {
        // HAVE_CURRENT_DATA
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
      console.log('🛑 Streaming stopped');
    }
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
