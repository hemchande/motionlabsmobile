/**
 * Athlete Coach FastAPI Client — frontend client for the FastAPI Athlete Coach server.
 *
 * Uses REST endpoints only (no MCP/session). Point at the FastAPI server, e.g. http://localhost:8004.
 * Contract aligned with ATHLETE_COACH_BACKEND_REQUIREMENTS.md.
 *
 * Usage:
 *   import { createAthleteCoachClient } from './athleteCoachFastApiClient';
 *   const client = createAthleteCoachClient('http://localhost:8004');
 *   const athletes = await client.getAllAthletes({ limit: 20 });
 *   const alerts = await client.getAthleteAlerts('athlete_001', { include_stream_urls: true });
 */

const DEFAULT_TIMEOUT_MS = 60000;

/** Backend user object returned by create-user and login (see ATHLETE_COACH_BACKEND_REQUIREMENTS.md) */
export interface AthleteCoachApiUser {
  id?: string;
  athlete_id?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

/** POST /api/create-user success response – backend must return user.athlete_id for athletes */
export interface CreateUserResponse {
  status: string;
  user?: AthleteCoachApiUser;
  message?: string;
}

/** POST /api/login success response – backend must return user.athlete_id for athletes */
export interface LoginResponse {
  status: string;
  message?: string;
  user?: AthleteCoachApiUser;
  token?: string;
}

/** Session summary issues_summary (from _session_to_summary) */
export interface SessionSummaryIssuesSummary {
  form_issues?: string[];
  form_issue_count?: number;
  acl_risk_level?: string;
  has_high_risk_acl?: boolean;
  acl_high_risk_count?: number;
  acl_moderate_risk_count?: number;
  acl_total_risk_count?: number;
  insight_count?: number;
  insight_previews?: string[];
}

/** Session summary metrics_summary subset */
export interface SessionSummaryMetricsSummary {
  acl_risk_score?: number;
  height_off_floor_meters?: number;
  body_alignment_degrees?: number;
  knee_valgus?: number;
  flight_phase?: boolean;
  in_landing_phase?: boolean;
  [key: string]: unknown;
}

/** Segment info in session summary */
export interface SessionSummarySegment {
  segment_number?: number;
  segment_start_frame?: number;
  segment_end_frame?: number;
  video_clip_count?: number;
}

/** Single session summary for client display (GET session-summaries / athlete session-summaries) */
export interface SessionSummary {
  session_id?: string;
  athlete_id?: string;
  athlete_name?: string;
  timestamp?: string;
  activity?: string;
  technique?: string;
  issues_summary?: SessionSummaryIssuesSummary;
  metrics_summary?: SessionSummaryMetricsSummary;
  cloudflare_stream_url?: string;
  segment?: SessionSummarySegment;
}

/** GET /api/session-summaries response */
export interface SessionSummariesResponse {
  status: string;
  count?: number;
  summaries?: SessionSummary[];
}

/** GET /api/athlete/{athlete_id}/session-summaries response */
export interface AthleteSessionSummariesResponse {
  status: string;
  athlete_id?: string;
  count?: number;
  summaries?: SessionSummary[];
}

/** Condensed trend item (GET /api/athlete/{id}/trends, default response) */
export interface TrendItemStats {
  first_mean?: number;
  second_mean?: number;
  change?: number;
}

export interface TrendItem {
  id?: string;
  metric_type?: string;
  metric_label?: string;
  technique?: string | null;
  observation?: string;
  status?: 'improving' | 'declining' | 'unchanged' | 'stable';
  direction?: 'increasing' | 'decreasing' | 'stable';
  change_percent?: number;
  session_count?: number;
  coaching_highlights?: string[];
  stats?: TrendItemStats;
}

/** GET /api/athlete/{athlete_id}/trends response (condensed) */
export interface AthleteTrendsResponse {
  status: string;
  athlete_id?: string;
  athlete_name?: string | null;
  count?: number;
  trends?: TrendItem[];
  message?: string;
}

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

  // Network debug: confirm in Safari Web Inspector → Network whether the request is sent
  if (typeof window !== 'undefined' && (window as unknown as { __CAPACITOR_NETWORK_DEBUG?: boolean }).__CAPACITOR_NETWORK_DEBUG) {
    console.log('[AthleteCoachAPI] fetch START', method, url);
  }
  try {
    const response = await fetch(url, init);
    clearTimeout(id);
    if (typeof window !== 'undefined' && (window as unknown as { __CAPACITOR_NETWORK_DEBUG?: boolean }).__CAPACITOR_NETWORK_DEBUG) {
      console.log('[AthleteCoachAPI] fetch DONE', method, url, response.status);
    }
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
    if (typeof window !== 'undefined') {
      console.warn('[AthleteCoachAPI] fetch FAILED', method, url, e);
    }
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

  // ——— Auth (contract: ATHLETE_COACH_BACKEND_REQUIREMENTS.md) ———
  /** Create user; backend returns user.athlete_id for athletes – store and use for roster/details/embeddings. */
  async createUser(params: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    institution?: string;
    firebase_uid?: string;
  }): Promise<CreateUserResponse> {
    return this._post('/api/create-user', {
      email: params.email,
      password: params.password,
      full_name: params.full_name,
      role: params.role ?? 'athlete',
      institution: params.institution,
      firebase_uid: params.firebase_uid,
    }) as unknown as Promise<CreateUserResponse>;
  }

  /** Login; backend returns user.athlete_id for athletes – persist to Firestore so profile/details/add-photo work. */
  async login(params: { email: string; password: string; role?: string }): Promise<LoginResponse> {
    return this._post('/api/login', {
      email: params.email,
      password: params.password,
      role: params.role ?? 'athlete',
    }) as unknown as Promise<LoginResponse>;
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

  /** GET /api/athlete/{athlete_id}/trends — condensed trends for UI. Use full=1 for raw payload. */
  async getAthleteTrends(
    athleteId: string,
    params: { activity?: string; technique?: string; limit?: number; full?: boolean } = {}
  ) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/trends`, {
      activity: params.activity,
      technique: params.technique,
      limit: params.limit ?? 20,
      full: params.full,
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

  /** Upload a photo file to complete athlete profile (multipart). Use when user has no photo yet. */
  async addPhotoUpload(params: {
    athlete_id: string;
    photo: File;
    athlete_name?: string;
  }): Promise<Record<string, unknown>> {
    const fd = new FormData();
    fd.append('athlete_id', params.athlete_id);
    fd.append('photo', params.photo);
    if (params.athlete_name) fd.append('athlete_name', params.athlete_name);
    return this._post('/api/athlete/add-photo-upload', fd);
  }

  /**
   * Coach-driven manual athlete creation (no invite/signup flow).
   * POST /api/manual-athlete — creates user, updates profile, and optionally adds a photo URL.
   *
   * Returns backend JSON:
   * {
   *   status: "success",
   *   message: "Manual athlete created and profile updated",
   *   athlete_id: "athlete_00X",
   *   user_create: { ... },
   *   profile_update: { ... },
   *   photo: { ... } // if photo_url provided
   * }
   */
  async manualCreateAthlete(params: {
    full_name: string;
    email: string;
    password: string;
    institution?: string;
    height?: number;
    weight?: number;
    previous_injuries?: string;
    photo_url?: string;
  }): Promise<Record<string, unknown>> {
    return this._post('/api/manual-athlete', {
      full_name: params.full_name,
      email: params.email,
      password: params.password,
      institution: params.institution,
      height: params.height,
      weight: params.weight,
      previous_injuries: params.previous_injuries,
      photo_url: params.photo_url,
    }) as unknown as Promise<Record<string, unknown>>;
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

  /**
   * GET /api/session-summaries — high-level session summaries with issues_summary, metrics_summary, cloudflare_stream_url.
   * Query: limit (default 50), optional activity, optional athlete_id.
   */
  async getSessionSummaries(params: { limit?: number; activity?: string; athlete_id?: string } = {}) {
    return this._get('/api/session-summaries', {
      limit: params.limit ?? 50,
      activity: params.activity,
      athlete_id: params.athlete_id,
    });
  }

  /**
   * GET /api/athlete/{athlete_id}/session-summaries — session summaries for one athlete.
   * Query: limit (default 50), optional activity, optional technique.
   */
  async getAthleteSessionSummaries(
    athleteId: string,
    params: { limit?: number; activity?: string; technique?: string } = {}
  ) {
    return this._get(`/api/athlete/${encodeURIComponent(athleteId)}/session-summaries`, {
      limit: params.limit ?? 50,
      activity: params.activity,
      technique: params.technique,
    });
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
