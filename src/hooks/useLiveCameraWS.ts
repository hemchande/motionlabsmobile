/**
 * Shared hook for live camera WebSocket: connect, stream, receive annotated frames + metrics.
 * Use in LiveCameraWSFeed or custom UI (e.g. coach web app Live Recording screen).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { LiveCameraWSClient, type FrameData, type MetricsData, type AthleteData, type PoseOnlyData } from '../services/liveCameraWSClient';

/** Build final WebSocket URL: override > env (base or full URL) > default. Env can be base (e.g. http://localhost:8010) or full ws/wss URL. */
function resolveLiveCameraWsUrl(
  wsUrlOverride?: string,
  athleteContext?: { athlete_id?: string; athlete_name?: string }
): string {
  if (wsUrlOverride) {
    return athleteContext?.athlete_id || athleteContext?.athlete_name
      ? wsUrlOverride + (wsUrlOverride.includes('?') ? '&' : '?') + new URLSearchParams({
          ...(athleteContext.athlete_id && { athlete_id: athleteContext.athlete_id }),
          ...(athleteContext.athlete_name && { athlete_name: athleteContext.athlete_name }),
        } as Record<string, string>).toString()
      : wsUrlOverride;
  }
  const env = (import.meta as unknown as { env?: { VITE_LIVE_CAMERA_WS_URL?: string } }).env?.VITE_LIVE_CAMERA_WS_URL;
  const trimmed = env?.trim();
  if (trimmed) {
    if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed;
    return LiveCameraWSClient.getWebSocketUrl(trimmed, athleteContext);
  }
  const defaultBase = window.location.protocol === 'https:'
    ? 'https://live-camera-gpu-630016859450.europe-west1.run.app'
    : 'http://localhost:8010';
  return LiveCameraWSClient.getWebSocketUrl(defaultBase, athleteContext);
}

export function useLiveCameraWS(wsUrlOverride?: string, athleteContext?: { athlete_id?: string; athlete_name?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<LiveCameraWSClient | null>(null);
  const previousBlobUrlRef = useRef<string | null>(null);
  const receivedSeqRef = useRef<number>(0);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [currentAthlete, setCurrentAthlete] = useState<AthleteData | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<MetricsData | null>(null);
  const [annotatedFrameUrl, setAnnotatedFrameUrl] = useState<string | null>(null);
  const [poseOnlyImageUrl, setPoseOnlyImageUrl] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  const getWSUrl = useCallback(
    () => resolveLiveCameraWsUrl(wsUrlOverride, athleteContext),
    [wsUrlOverride, athleteContext?.athlete_id, athleteContext?.athlete_name]
  );

  const getWebcamStream = useCallback(async (facing: 'user' | 'environment') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const secureContext = typeof window !== 'undefined' && window.isSecureContext;
      throw new Error(
        secureContext
          ? 'getUserMedia is not supported by this browser.'
          : 'Camera requires a secure context (HTTPS or localhost). Use https://localhost:3000 or the HTTPS network URL (e.g. https://192.168.1.77:3000).'
      );
    }
    return navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: facing },
      audio: false,
    });
  }, []);

  const startWebcam = useCallback(async (facing?: 'user' | 'environment') => {
    const mode = facing ?? cameraFacing;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const secureContext = typeof window !== 'undefined' && window.isSecureContext;
        throw new Error(
          secureContext
            ? 'getUserMedia is not supported by this browser.'
            : 'Camera requires a secure context (HTTPS or localhost). Use https://localhost:3000 or the HTTPS network URL (e.g. https://192.168.1.77:3000).'
        );
      }
      const stream = await getWebcamStream(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied.');
    }
  }, [cameraFacing, getWebcamStream]);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStreaming = useCallback(async () => {
    try {
      setError(null);
      await startWebcam();
      const wsUrlForClient = getWSUrl();
      const client = new LiveCameraWSClient(wsUrlForClient);
      clientRef.current = client;
      client
        .on('open', () => setIsConnected(true))
        .on('close', () => { setIsConnected(false); setIsStreaming(false); })
        .on('error', () => setError('WebSocket error. Check that the server is running.'))
        .on<FrameData>('frame', (data) => {
          receivedSeqRef.current += 1;
          const seq = receivedSeqRef.current;
          const blobUrl = data.image;
          requestAnimationFrame(() => {
            if (seq !== receivedSeqRef.current) {
              if (blobUrl?.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
              return;
            }
            if (previousBlobUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(previousBlobUrlRef.current);
            setAnnotatedFrameUrl(blobUrl);
            previousBlobUrlRef.current = blobUrl;
            setFrameCount(data.frameNumber);
          });
        })
        .on<MetricsData>('metrics', (data) => setLatestMetrics(data))
        .on<AthleteData>('athlete', (data) => setCurrentAthlete(data))
        .on<PoseOnlyData>('pose_only', (data) => {
          if (data.poseOnlyImageBase64) {
            setPoseOnlyImageUrl('data:image/jpeg;base64,' + data.poseOnlyImageBase64);
          }
        });
      await client.connect();
      if (videoRef.current) {
        client.startStreaming(videoRef.current);
        setIsStreaming(true);
      }
      setSessionId(client.getStatus().sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect.');
      stopWebcam();
    }
  }, [startWebcam, getWSUrl, stopWebcam]);

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
    if (previousBlobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(previousBlobUrlRef.current);
      previousBlobUrlRef.current = null;
    }
    setAnnotatedFrameUrl(null);
    setLatestMetrics(null);
    setCurrentAthlete(null);
    setPoseOnlyImageUrl(null);
  }, [stopWebcam]);

  const switchCamera = useCallback(async () => {
    const nextFacing: 'user' | 'environment' = cameraFacing === 'user' ? 'environment' : 'user';
    try {
      setError(null);
      const stream = await getWebcamStream(nextFacing);
      if (videoRef.current) {
        const oldStream = videoRef.current.srcObject as MediaStream | null;
        if (oldStream) oldStream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraFacing(nextFacing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch camera.');
    }
  }, [cameraFacing, getWebcamStream]);

  useEffect(() => {
    return () => {
      if (clientRef.current) clientRef.current.disconnect();
      stopWebcam();
      if (previousBlobUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(previousBlobUrlRef.current);
    };
  }, [stopWebcam]);

  return {
    videoRef,
    isStreaming,
    isConnected,
    error,
    setError,
    frameCount,
    sessionId,
    currentAthlete,
    latestMetrics,
    annotatedFrameUrl,
    poseOnlyImageUrl,
    cameraFacing,
    setCameraFacing,
    switchCamera,
    startStreaming,
    stopStreaming,
  };
}
