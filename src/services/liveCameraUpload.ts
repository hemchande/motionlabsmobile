/**
 * Live Camera upload-video / upload-frames — multipart POST + SSE stream.
 * Endpoints: POST /api/live-camera/upload-video (one video), POST /api/live-camera/upload-frames (multiple images).
 * Response: text/event-stream; parse data: {...} and handle frame events + done.
 */

export interface LiveCameraSSEEvent {
  done?: boolean;
  frame_index?: number;
  total_frames?: number;
  session_id?: string;
  metrics?: Record<string, unknown>;
  form_issues?: string[];
  recommendations?: string[];
  athlete_id?: string;
  athlete_name?: string;
  phase?: string;
  movement_msg?: string;
  visibility_msg?: string;
  acl_summary?: string;
  [key: string]: unknown;
}

/** Get HTTP base URL for live camera service (same host as WebSocket, http/https). */
export function getLiveCameraBaseUrl(): string {
  const env = (import.meta as unknown as { env?: { VITE_LIVE_CAMERA_WS_URL?: string } }).env?.VITE_LIVE_CAMERA_WS_URL;
  const trimmed = env?.trim();
  if (trimmed) {
    if (trimmed.startsWith('ws://')) return trimmed.replace(/^ws:\/\//, 'http://').replace(/\/api\/live-camera\/ws.*$/, '');
    if (trimmed.startsWith('wss://')) return trimmed.replace(/^wss:\/\//, 'https://').replace(/\/api\/live-camera\/ws.*$/, '');
    if (trimmed.startsWith('http')) return trimmed.replace(/\/$/, '');
    return trimmed.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https://live-camera-gpu-630016859450.europe-west1.run.app';
  }
  return 'http://localhost:8010';
}

/**
 * Parse SSE stream from response body; yield each parsed JSON event.
 */
async function* parseSSE(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<LiveCameraSSEEvent> {
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';
      for (const chunk of lines) {
        const idx = chunk.indexOf('data:');
        if (idx === -1) continue;
        const jsonStr = chunk.slice(idx + 5).trim();
        if (!jsonStr) continue;
        try {
          yield JSON.parse(jsonStr) as LiveCameraSSEEvent;
        } catch {
          // skip malformed
        }
      }
    }
    if (buffer.trim()) {
      const idx = buffer.indexOf('data:');
      if (idx !== -1) {
        try {
          yield JSON.parse(buffer.slice(idx + 5).trim()) as LiveCameraSSEEvent;
        } catch {
          /**/
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface UploadVideoOptions {
  video: File;
  session_id?: string;
  use_cloud_face?: boolean;
  athlete_id?: string;
  athlete_name?: string;
}

/**
 * POST /api/live-camera/upload-video with one video file; response is SSE.
 * Calls onEvent for each SSE event; returns when done or on error.
 */
export async function uploadVideoWithSSE(
  options: UploadVideoOptions,
  onEvent: (event: LiveCameraSSEEvent) => void
): Promise<{ session_id?: string; total_frames?: number; error?: string }> {
  const baseUrl = getLiveCameraBaseUrl().replace(/\/$/, '');
  const url = `${baseUrl}/api/live-camera/upload-video`;
  const formData = new FormData();
  formData.append('video', options.video);
  if (options.session_id) formData.append('session_id', options.session_id);
  if (options.use_cloud_face != null) formData.append('use_cloud_face', String(options.use_cloud_face));
  if (options.athlete_id) formData.append('athlete_id', options.athlete_id);
  if (options.athlete_name) formData.append('athlete_name', options.athlete_name);

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const text = await res.text();
    return { error: text || `Upload failed (${res.status})` };
  }
  const reader = res.body?.getReader();
  if (!reader) return { error: 'No response body' };

  let result: { session_id?: string; total_frames?: number } = {};
  try {
    for await (const event of parseSSE(reader)) {
      onEvent(event);
      if (event.done) {
        result = { session_id: event.session_id, total_frames: event.total_frames };
        break;
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Stream read failed' };
  }
  return result;
}

export interface UploadFramesOptions {
  files: File[];
  session_id?: string;
  use_cloud_face?: boolean;
  athlete_id?: string;
  athlete_name?: string;
}

/**
 * POST /api/live-camera/upload-frames with multiple image files; response is SSE.
 */
export async function uploadFramesWithSSE(
  options: UploadFramesOptions,
  onEvent: (event: LiveCameraSSEEvent) => void
): Promise<{ session_id?: string; total_frames?: number; error?: string }> {
  const baseUrl = getLiveCameraBaseUrl().replace(/\/$/, '');
  const url = `${baseUrl}/api/live-camera/upload-frames`;
  const formData = new FormData();
  options.files.forEach((f) => formData.append('files', f, f.name));
  if (options.session_id) formData.append('session_id', options.session_id);
  if (options.use_cloud_face != null) formData.append('use_cloud_face', String(options.use_cloud_face));
  if (options.athlete_id) formData.append('athlete_id', options.athlete_id);
  if (options.athlete_name) formData.append('athlete_name', options.athlete_name);

  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const text = await res.text();
    return { error: text || `Upload failed (${res.status})` };
  }
  const reader = res.body?.getReader();
  if (!reader) return { error: 'No response body' };

  let result: { session_id?: string; total_frames?: number } = {};
  try {
    for await (const event of parseSSE(reader)) {
      onEvent(event);
      if (event.done) {
        result = { session_id: event.session_id, total_frames: event.total_frames };
        break;
      }
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Stream read failed' };
  }
  return result;
}
