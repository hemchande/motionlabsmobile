import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Video, Square, Play, AlertCircle, Activity, Users, User } from 'lucide-react';
import { LiveCameraWSClient, type FrameData, type MetricsData, type AthleteData } from '../services/liveCameraWSClient';
import { LiveCameraMetricsCards } from './LiveCameraMetricsCards';
import { getAthleteCoachApiUrl } from '../lib/athleteCoachApiUrl';

interface LiveCameraWSFeedProps {
  /** Additional CSS classes for the container */
  className?: string;
  /** WebSocket URL override (defaults to athleteCoachApiUrl with port 8010) */
  wsUrl?: string;
  /** Show metrics panel */
  showMetrics?: boolean;
  /** Show athlete detection info */
  showAthleteInfo?: boolean;
  /** When set, appended to WS URL so backend tags session with this athlete (coach selected or logged-in athlete) */
  athleteId?: string | null;
  /** When set, appended to WS URL with athleteId for segment labelling */
  athleteName?: string | null;
}

/**
 * WebSocket-based live camera feed with real-time pose estimation and metrics.
 * Captures webcam, streams frames to backend, and displays annotated results.
 */
export function LiveCameraWSFeed({
  className = '',
  wsUrl,
  showMetrics = true,
  showAthleteInfo = true,
  athleteId,
  athleteName,
}: LiveCameraWSFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const annotatedImgRef = useRef<HTMLImageElement>(null);
  const clientRef = useRef<LiveCameraWSClient | null>(null);
  const previousBlobUrlRef = useRef<string | null>(null);
  /** Increments on each received frame; we only display if this frame is still the latest when we paint (skip stale) */
  const receivedSeqRef = useRef<number>(0);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [currentAthlete, setCurrentAthlete] = useState<AthleteData | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<MetricsData | null>(null);
  const [annotatedFrameUrl, setAnnotatedFrameUrl] = useState<string | null>(null);
  /** 'user' = front-facing, 'environment' = back-facing (phone) */
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // WebSocket URL: prop > env (VITE_LIVE_CAMERA_WS_URL) > default by protocol.
  // When athleteId/athleteName are set, append query params so backend tags session (same as coach web app).
  const getWSUrl = useCallback(() => {
    const baseUrl = (() => {
      if (wsUrl) return wsUrl;
      const env = (import.meta as unknown as { env?: { VITE_LIVE_CAMERA_WS_URL?: string } }).env?.VITE_LIVE_CAMERA_WS_URL;
      const trimmed = env?.trim();
      if (trimmed) {
        if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed;
        return trimmed;
      }
      if (window.location.protocol === 'https:') {
        return 'https://live-camera-gpu-630016859450.europe-west1.run.app';
      }
      return 'http://localhost:8010';
    })();
    const httpBase = baseUrl.startsWith('ws')
      ? baseUrl.replace(/^ws(s?):\/\//, 'http$1://').replace(/\/api\/live-camera\/ws.*$/, '').replace(/\/$/, '')
      : baseUrl;
    const athleteContext = (athleteId || athleteName) ? { athlete_id: athleteId ?? undefined, athlete_name: athleteName ?? undefined } : undefined;
    if (athleteContext?.athlete_id || athleteContext?.athlete_name) {
      return LiveCameraWSClient.getWebSocketUrl(httpBase, athleteContext);
    }
    if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) return baseUrl;
    return LiveCameraWSClient.getWebSocketUrl(httpBase);
  }, [wsUrl, athleteId, athleteName]);

  // Get a webcam stream with the given facing mode (for start or switch)
  const getWebcamStream = useCallback(async (facing: 'user' | 'environment') => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia is not supported.');
    return navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: facing },
      audio: false,
    });
  }, []);

  // Start webcam with current (or explicit) facing mode
  const startWebcam = useCallback(async (facing?: 'user' | 'environment') => {
    const mode = facing ?? cameraFacing;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        if (protocol === 'http:' && !isLocalhost) {
          throw new Error(
            `Camera access requires HTTPS or localhost. Current URL: ${protocol}//${hostname}\n\n` +
            `Solutions:\n` +
            `1. Access via http://localhost:3000 (if on same machine)\n` +
            `2. Enable HTTPS in vite.config.ts (requires WSS support on backend)`
          );
        }
        throw new Error('getUserMedia is not supported by this browser.');
      }
      const stream = await getWebcamStream(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Failed to start webcam:', err);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied or unavailable.';
      setError(errorMessage);
    }
  }, [cameraFacing, getWebcamStream]);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Switch between front and back camera (only while streaming; otherwise just set preference for next start)
  const switchCamera = useCallback(async () => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(next);
    if (!isStreaming || !videoRef.current) return;
    try {
      stopWebcam();
      const stream = await getWebcamStream(next);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Failed to switch camera:', err);
      setError(err instanceof Error ? err.message : 'Could not switch camera.');
    }
  }, [cameraFacing, isStreaming, stopWebcam, getWebcamStream]);

  // Connect to WebSocket and start streaming
  const startStreaming = useCallback(async () => {
    try {
      setError(null);

      // Start webcam first
      await startWebcam();

      const wsUrlForClient = getWSUrl();
      const client = new LiveCameraWSClient(wsUrlForClient);
      clientRef.current = client;

      const cloudRunWss = 'wss://live-camera-gpu-630016859450.europe-west1.run.app/api/live-camera/ws';
      // Register event handlers
      client
        .on('open', () => {
          setIsConnected(true);
          console.log('WebSocket connected');
          if (wsUrlForClient === cloudRunWss) {
            console.log('Connection has been made to', cloudRunWss);
          }
        })
        .on('close', () => {
          setIsConnected(false);
          setIsStreaming(false);
          console.log('WebSocket closed');
        })
        .on('error', (err) => {
          setError('WebSocket error. Check that the server is running.');
          console.error('WebSocket error:', err);
        })
        .on<FrameData>('frame', (data) => {
          receivedSeqRef.current += 1;
          const seq = receivedSeqRef.current;
          const blobUrl = data.image;
          // Defer display: only show this frame if no newer frame has arrived (skip stale)
          requestAnimationFrame(() => {
            if (seq !== receivedSeqRef.current) {
              if (blobUrl && blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
              }
              return;
            }
            if (previousBlobUrlRef.current && previousBlobUrlRef.current.startsWith('blob:')) {
              URL.revokeObjectURL(previousBlobUrlRef.current);
            }
            setAnnotatedFrameUrl(blobUrl);
            previousBlobUrlRef.current = blobUrl;
            setFrameCount(data.frameNumber);
          });
        })
        .on<MetricsData>('metrics', (data) => {
          // Update metrics display
          setLatestMetrics(data);
        })
        .on<AthleteData>('athlete', (data) => {
          // Update athlete info
          setCurrentAthlete(data);
        });

      // Connect
      await client.connect();

      // Start streaming frames from video element
      if (videoRef.current) {
        client.startStreaming(videoRef.current);
        setIsStreaming(true);
      }

      // Get session ID
      const status = client.getStatus();
      setSessionId(status.sessionId);
    } catch (err) {
      console.error('Failed to start streaming:', err);
      setError('Failed to connect. Ensure the WebSocket server is running on port 8010.');
      stopWebcam();
    }
  }, [startWebcam, getWSUrl, stopWebcam]);

  // Stop streaming and disconnect
  const stopStreaming = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.disconnect();
      clientRef.current = null;
    }
    stopWebcam();
    setIsStreaming(false);
    setIsConnected(false);
    setSessionId(null);
    receivedSeqRef.current = 0;
    // Revoke blob URL before clearing
    if (previousBlobUrlRef.current && previousBlobUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previousBlobUrlRef.current);
      previousBlobUrlRef.current = null;
    }
    setAnnotatedFrameUrl(null);
    setLatestMetrics(null);
    setCurrentAthlete(null);
  }, [stopWebcam]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      stopWebcam();
      // Revoke blob URL to prevent memory leak
      if (previousBlobUrlRef.current && previousBlobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrlRef.current);
      }
    };
  }, [stopWebcam]);


  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Live Camera (WebSocket)</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Front / Back camera (phone-friendly) */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-gray-100 min-h-[44px]">
            <button
              type="button"
              onClick={() => !isStreaming ? setCameraFacing('user') : (cameraFacing !== 'user' && switchCamera())}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 min-h-[44px] ${
                cameraFacing === 'user' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Front camera"
            >
              <User className="w-4 h-4" />
              Front
            </button>
            <button
              type="button"
              onClick={() => !isStreaming ? setCameraFacing('environment') : (cameraFacing !== 'environment' && switchCamera())}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 min-h-[44px] ${
                cameraFacing === 'environment' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Back camera"
            >
              <Camera className="w-4 h-4" />
              Back
            </button>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Connected
            </div>
          )}
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl border border-red-200 transition-colors min-h-[44px]"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startStreaming}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Start</span>
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Video/Annotated Frame Container - large player for WebSocket feed (min height + viewport-based max) */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video min-h-[520px] sm:min-h-[600px] max-h-[90vh] w-full">
        {/* Hidden video element (source for WebSocket stream) */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ display: annotatedFrameUrl ? 'none' : 'block' }}
          playsInline
          muted
        />

        {/* Annotated frame (blob URL from binary - matches HTML test clients) */}
        {annotatedFrameUrl && (
          <img
            ref={annotatedImgRef}
            src={annotatedFrameUrl}
            alt="Annotated frame"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* Overlays */}
        {isStreaming && (
          <>
            {/* Live indicator */}
            <div className="absolute top-3 right-3 px-2 py-1 bg-red-600 rounded text-white text-xs font-medium flex items-center gap-1.5">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>

            {/* Frame count */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-white text-xs font-mono">
              Frame {frameCount}
            </div>

            {/* Athlete info */}
            {showAthleteInfo && currentAthlete && (
              <div className="absolute top-12 left-3 px-3 py-2 bg-black/60 rounded-lg text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{currentAthlete.athleteName || currentAthlete.athleteId}</span>
                </div>
                {currentAthlete.confidence && (
                  <p className="text-xs opacity-80">Confidence: {Math.round(currentAthlete.confidence * 100)}%</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Placeholder when not streaming */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Camera className="w-16 h-16 mb-3 opacity-50" />
            <p className="text-sm">Click Start to begin streaming</p>
          </div>
        )}
      </div>

      {/* Real-time metrics from live camera service: WebSocket → client emits "metrics" → latestMetrics → LiveCameraMetricsCards (ACL risk, form issues, recommendations) */}
      {showMetrics && latestMetrics && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Real-Time Metrics</h4>
          <LiveCameraMetricsCards metrics={latestMetrics} maxMetricCards={6} />
        </div>
      )}

      {/* Session Info */}
      {sessionId && (
        <p className="mt-2 text-xs text-gray-500">
          Session: <span className="font-mono">{sessionId}</span>
        </p>
      )}
    </div>
  );
}
