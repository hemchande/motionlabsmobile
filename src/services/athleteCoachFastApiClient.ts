/**
 * Athlete Coach FastAPI Client — frontend client for the FastAPI Athlete Coach server.
 *
 * Uses REST endpoints only (no MCP/session). Point at the FastAPI server, e.g. http://localhost:8004.
 *
 * Usage:
 *   import { createAthleteCoachClient } from './athleteCoachFastApiClient';
 *   const client = createAthleteCoachClient('http://localhost:8004');
 *   const athletes = await client.getAllAthletes({ limit: 20 });
 *   const alerts = await client.getAthleteAlerts('athlete_001', { include_stream_urls: true });
 */

const DEFAULT_TIMEOUT_MS = 60000;

type RequestOptions = {
  method?: string;
  body?: object | string | FormData;
  timeout?: number;
};

async function request(
  baseUrl: string,
  path: string,
  options: RequestOptions = {}
): Promise<Record<string, unknown>> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const method = options.method || 'GET';
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const init: RequestInit = {
    method,
    signal: controller.signal,
    headers: {} as Record<string, string>,
  };

  if (options.body !== undefined) {
    if (typeof options.body === 'string') {
      init.body = options.body;
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    } else if (options.body instanceof FormData) {
      init.body = options.body;
      // no Content-Type; browser sets multipart boundary
    } else {
      init.body = JSON.stringify(options.body);
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  try {
    const response = await fetch(url, init);
    clearTimeout(id);
    const text = await response.text();
    if (!response.ok) {
      let errData: Record<string, unknown>;
      try {
        errData = JSON.parse(text) as Record<string, unknown>;
      } catch {
        errData = { message: text };
      }
      const err = new Error((errData.message as string) || `HTTP ${response.status}`) as Error & {
        status?: number;
        data?: Record<string, unknown>;
      };
      err.status = response.status;
      err.data = errData;
      throw err;
    }
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { _raw: text };
    }
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Create client for the FastAPI Athlete Coach server. No async init.
 */
export function createAthleteCoachClient(
  baseUrl: string,
  options: { timeout?: number } = {}
): AthleteCoachFastApiClient {
  return new AthleteCoachFastApiClient(baseUrl, options);
}

export class AthleteCoachFastApiClient {
  baseUrl: string;
  options: { timeout?: number };

  constructor(baseUrl: string, options: { timeout?: number } = {}) {
    this.baseUrl = (baseUrl || '').replace(/\/$/, '');
    this.options = options;
  }

  async _get(path: string, params: Record<string, string | number | boolean | undefined | null> = {}) {
    const query = qs(params);
    return request(this.baseUrl, path + query, { ...this.options });
  }

  async _post(path: string, body: unknown) {
    return request(this.baseUrl, path, { method: 'POST', body: body as object, ...this.options });
  }

  // ——— Auth ———
  async createUser(params: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    institution?: string;
    firebase_uid?: string;
  }) {
    return this._post('/api/create-user', {
      email: params.email,
      password: params.password,
      full_name: params.full_name,
      role: params.role ?? 'athlete',
      institution: params.institution,
      firebase_uid: params.firebase_uid,
    });
  }

  async login(params: { email: string; password: string; role?: string }) {
    return this._post('/api/login', {
      email: params.email,
      password: params.password,
      role: params.role ?? 'athlete',
    });
  }

  // ——— Athletes ———
  async getAllAthletes(params: { limit?: number; include_stats?: boolean } = {}) {
    return this._get('/api/athletes', {
      limit: params.limit,
      include_stats: params.include_stats,
    });
  }

  async getAthleteDetails(athleteId: string) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/details`);
  }

  async getAthleteSessions(
    athleteId: string,
    params: { limit?: number; activity?: string; technique?: string } = {}
  ) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/sessions`, {
      limit: params.limit,
      activity: params.activity,
      technique: params.technique,
    });
  }

  async getAthleteAlerts(
    athleteId: string,
    params: {
      include_stream_urls?: boolean;
      include_insights?: boolean;
      include_metrics?: boolean;
      limit?: number;
    } = {}
  ) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/alerts`, {
      include_stream_urls: params.include_stream_urls,
      include_insights: params.include_insights,
      include_metrics: params.include_metrics,
      limit: params.limit,
    });
  }

  async getAthleteInsights(athleteId: string, params: { limit?: number } = {}) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/insights`, {
      limit: params.limit,
    });
  }

  async getAthleteTrends(athleteId: string, params: { activity?: string } = {}) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/trends`, {
      activity: params.activity,
    });
  }

  async getBaselinesForAthlete(athleteId: string) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/baselines`);
  }

  async getFacialEmbeddings(athleteId: string) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/facial-embeddings`);
  }

  async addUserPhoto(params: {
    athlete_id: string;
    photo_url?: string;
    athlete_name?: string;
  }) {
    return this._post('/api/athlete/add-photo', {
      athlete_id: params.athlete_id,
      photo_url: params.photo_url,
      athlete_name: params.athlete_name,
    });
  }

  // ——— Sessions ———
  async getAllSessions(
    params: { limit?: number; activity?: string; athlete_id?: string } = {}
  ) {
    return this._get('/api/sessions', {
      limit: params.limit,
      activity: params.activity,
      athlete_id: params.athlete_id,
    });
  }

  async getSession(sessionId: string) {
    return this._get(`/api/session/${encodeURIComponent(sessionId)}`);
  }

  async getInsightsForSession(sessionId: string) {
    return this._get(`/api/session/${encodeURIComponent(sessionId)}/insights`);
  }

  async getMetricsForSession(sessionId: string) {
    return this._get(`/api/session/${encodeURIComponent(sessionId)}/metrics`);
  }

  /**
   * Get session insights, metrics, and recommendations in one call.
   * Returns: { status, session, insights, recommendations, full_metrics, correlated_metrics }
   */
  async getSessionInsightsMetricsRecommendations(sessionId: string) {
    return this._get(`/api/session/${encodeURIComponent(sessionId)}/insights-metrics-recommendations`);
  }

  // ——— Alerts ———
  async getAllAlerts(params: { limit?: number; status?: string } = {}) {
    return this._get('/api/alerts', {
      limit: params.limit,
      status: params.status,
    });
  }

  async getAlert(alertId: string) {
    return this._get(`/api/alert/${encodeURIComponent(alertId)}`);
  }

  async getSessionsForAlert(alertId: string) {
    return this._get(`/api/alert/${encodeURIComponent(alertId)}/sessions`);
  }

  async getClipsForAlert(alertId: string) {
    return this._get(`/api/alert/${encodeURIComponent(alertId)}/clips`);
  }

  async getBaselinesForAlert(alertId: string) {
    return this._get(`/api/alert/${encodeURIComponent(alertId)}/baselines`);
  }

  // ——— Queues ———
  async getAlertQueueMessages(params: { max_messages?: number; queue_name?: string } = {}) {
    return this._get('/api/alert-queue/messages', {
      max_messages: params.max_messages,
      queue_name: params.queue_name,
    });
  }

  async listenToAlertQueue(params: { timeout?: number; max_messages?: number } = {}) {
    return this._post('/api/alert-queue/listen', {
      timeout: params.timeout ?? 5,
      max_messages: params.max_messages,
    });
  }

  // ——— Agent ———
  /** Stop the live camera feed and metrics (POST /api/live-camera/stop). */
  async stopLiveCamera() {
    return this._post('/api/live-camera/stop', {});
  }

  /** Start the ML agent for a live video call (POST /api/agent/start). */
  async startAgent(params: {
    call_id: string;
    athlete_id?: string;
    activity?: string;
    technique?: string;
    user_requests?: string[];
  }) {
    return this._post('/api/agent/start', {
      call_id: params.call_id,
      athlete_id: params.athlete_id,
      activity: params.activity ?? 'gymnastics',
      technique: params.technique,
      user_requests: params.user_requests,
    });
  }

  // ——— Orchestrator ———
  async sendToOrchestratorEventQueue(params: {
    call_id: string;
    athlete_id: string;
    activity?: string;
    technique?: string;
    user_requests?: string[];
    call_type?: string;
    max_retries?: number;
  }) {
    return this._post('/api/orchestrator/send', {
      call_id: params.call_id,
      athlete_id: params.athlete_id,
      activity: params.activity ?? 'gymnastics',
      technique: params.technique,
      user_requests: params.user_requests,
      call_type: params.call_type ?? 'default',
      max_retries: params.max_retries ?? 3,
    });
  }

  async health() {
    return this._get('/health');
  }
}

/**
 * Create athlete with photo via multipart form (browser file upload).
 */
export async function createAthleteWithPhotoFormData(
  baseUrl: string,
  formData: FormData,
  options: { timeout?: number } = {}
): Promise<Record<string, unknown>> {
  const url = `${(baseUrl || '').replace(/\/$/, '')}/api/create-athlete-with-photo`;
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(id);
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const err = new Error(
        (data.message as string) || (data.detail as string) || `HTTP ${response.status}`
      ) as Error & { status?: number; data?: Record<string, unknown> };
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export default {
  createAthleteCoachClient,
  AthleteCoachFastApiClient,
  createAthleteWithPhotoFormData,
};
