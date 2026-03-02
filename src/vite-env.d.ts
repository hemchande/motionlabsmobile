/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_STREAM_API_KEY?: string;
  readonly VITE_STREAM_API_SECRET?: string;
  readonly VITE_STREAM_CALL_ID?: string;
  readonly VITE_AGENT_SERVICE_URL?: string;
  readonly VITE_MCP_SERVICE_URL?: string;
  readonly VITE_BREVO_API_KEY?: string;
  readonly VITE_ATHLETE_COACH_API_URL?: string;
  readonly VITE_LIVE_CAMERA_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

