/**
 * Athlete Coach Service — alert-focused adapter using athleteCoachFastApiClient.
 * Implements ALERT_SPEC.md display requirements: insight labels, session/clip flows.
 */

import { getAthleteCoachApiUrl } from '../lib/athleteCoachApiUrl';
import {
  createAthleteCoachClient,
  AthleteCoachFastApiClient,
  type SessionSummary,
  type SessionSummariesResponse,
  type AthleteSessionSummariesResponse,
  type AthleteTrendsResponse,
  type TrendItem,
} from './athleteCoachFastApiClient';

/** ALERT_SPEC §2: insight_id → display label mapping */
export const INSIGHT_LABELS: Record<string, string> = {
  insufficient_height: 'Insufficient height',
  landing_knee_bend: 'Landing knee bend',
  knee_valgus_collapse: 'Knee valgus collapse',
  insufficient_hip_flexion: 'Insufficient hip flexion',
  bent_knees_in_flight: 'Bent knees in flight',
  poor_alignment: 'Poor alignment',
  insufficient_split_angle: 'Insufficient split angle',
  poor_landing_quality: 'Poor landing quality',
};

export function getInsightDisplayLabel(insightId: string): string {
  return INSIGHT_LABELS[insightId] ?? insightId;
}

/** Cloudflare stream URL entry (ALERT_SPEC §3.2) */
export interface CloudflareStreamUrl {
  url: string;
  source: 'session' | 'insight' | 'clip';
  type: 'session_video' | 'insight_video' | 'clip_video';
  insight_id?: string;
  clip_id?: string;
}

/** Alert payload (ALERT_SPEC §3) */
export interface AlertPayload {
  _id?: string;
  alert_id?: string;
  athlete_id: string;
  insight_id: string;
  alert_type?: string;
  severity?: string;
  status?: string;
  session_ids?: string[];
  sessions_affected?: string[];
  session_id?: string;
  post_baseline_session_count?: number;
  created_at?: string;
  updated_at?: string;
  cloudflare_stream_url?: string;
  cloudflare_stream_urls?: CloudflareStreamUrl[];
  session_metadata?: {
    activity?: string;
    technique?: string;
    timestamp?: string;
    athlete_name?: string;
    session_id?: string;
  };
  session_metrics?: Record<string, unknown>;
  session_insights?: unknown[];
  insights_with_urls?: Array<{ insight_id?: string; cloudflare_url?: string; insights?: unknown[] }>;
  drift_metrics?: Record<string, unknown>;
  alert_confidence?: number;
}

/** get_athlete_alerts response */
export interface AthleteAlertsResponse {
  status: string;
  athlete_id?: string;
  count?: number;
  alerts?: AlertPayload[];
  message?: string;
}

/** get_sessions_for_alert response */
export interface SessionsForAlertResponse {
  status: string;
  alert_id?: string;
  count?: number;
  sessions?: Array<{
    _id?: string;
    session_id?: string;
    athlete_id?: string;
    athlete_name?: string;
    activity?: string;
    technique?: string;
    timestamp?: string;
    cloudflare_stream_url?: string;
    clips?: unknown[];
    insights?: unknown[];
  }>;
}

/** get_insights_for_session response */
export interface SessionInsightsResponse {
  status?: string;
  insights?: unknown[];
  session_id?: string;
}

/** get_clips_for_alert response */
export interface ClipsForAlertResponse {
  status: string;
  alert_id?: string;
  count?: number;
  clips?: Array<{
    cloudflare_stream_url?: string;
    preview_url?: string;
    stream_url?: string;
    clip_id?: string;
    session_id?: string;
    [key: string]: unknown;
  }>;
}

/** getSessionInsightsMetricsRecommendations response */
export interface SessionInsightsMetricsRecommendationsResponse {
  status?: 'success' | 'not_found' | 'error';
  session?: {
    session_id?: string;
    athlete_id?: string;
    athlete_name?: string;
    activity?: string;
    technique?: string;
    timestamp?: string;
  };
  insights?: Array<{
    summary?: string;
    insights?: { summary?: string; key_findings?: string[]; root_causes?: string[]; recommendations?: string[] };
    key_findings?: string[];
    root_causes?: string[];
    recommendations?: string[];
  }>;
  recommendations?: Array<{
    insight_id?: string;
    observation?: string;
    coaching_options?: string[];
    how?: string;
    priority?: string | number;
    source?: string;
  }>;
  full_metrics?: Record<string, unknown>;
  correlated_metrics?: Array<{
    insight_id?: string;
    metric_values?: Record<string, unknown>;
    description?: string;
  }>;
}

let _client: AthleteCoachFastApiClient | null = null;

function getClient(): AthleteCoachFastApiClient {
  if (!_client) {
    _client = createAthleteCoachClient(getAthleteCoachApiUrl());
  }
  return _client;
}

/**
 * List all athletes from the API.
 */
export async function getAllAthletes(params: { limit?: number; include_stats?: boolean } = {}) {
  const client = getClient();
  return client.getAllAthletes({
    limit: params.limit ?? 100,
    include_stats: params.include_stats,
  });
}

/**
 * Coach-driven manual athlete creation (no invite/signup flow).
 * Wraps POST /api/manual-athlete via AthleteCoachFastApiClient.manualCreateAthlete.
 */
export async function manualCreateAthlete(params: {
  full_name: string;
  email: string;
  password: string;
  institution?: string;
  height?: number;
  weight?: number;
  previous_injuries?: string;
  photo_url?: string;
}): Promise<Record<string, unknown>> {
  const client = getClient();
  return (await client.manualCreateAthlete(params)) as Record<string, unknown>;
}

/**
 * Get athlete details (profile). Returns 403 if profile incomplete (no photo).
 */
export async function getAthleteDetails(athleteId: string): Promise<Record<string, unknown>> {
  const client = getClient();
  return (await client.getAthleteDetails(athleteId)) as Record<string, unknown>;
}

/**
 * Get sessions for an athlete.
 */
export async function getAthleteSessions(
  athleteId: string,
  params: { limit?: number; activity?: string; technique?: string } = {}
): Promise<{ status?: string; sessions?: unknown[]; [key: string]: unknown }> {
  const client = getClient();
  return (await client.getAthleteSessions(athleteId, params)) as { status?: string; sessions?: unknown[]; [key: string]: unknown };
}

/**
 * Get insights for an athlete.
 */
export async function getAthleteInsights(
  athleteId: string,
  params: { limit?: number } = {}
): Promise<{ status?: string; insights?: unknown[]; [key: string]: unknown }> {
  const client = getClient();
  return (await client.getAthleteInsights(athleteId, params)) as { status?: string; insights?: unknown[]; [key: string]: unknown };
}

/**
 * GET /api/athlete/{athlete_id}/trends — condensed trends for UI (metric_label, observation, status, coaching_highlights).
 */
export async function getAthleteTrends(
  athleteId: string,
  params: { activity?: string; technique?: string; limit?: number; full?: boolean } = {}
): Promise<AthleteTrendsResponse> {
  const client = getClient();
  return (await client.getAthleteTrends(athleteId, params)) as AthleteTrendsResponse;
}

export type { TrendItem };

/**
 * List all sessions from the API.
 */
export async function getAllSessions(params: {
  limit?: number;
  activity?: string;
  athlete_id?: string;
} = {}): Promise<{ status?: string; sessions?: unknown[]; [key: string]: unknown }> {
  const client = getClient();
  return (await client.getAllSessions(params)) as { status?: string; sessions?: unknown[]; [key: string]: unknown };
}

/**
 * GET /api/session-summaries — high-level summaries with issues_summary, metrics_summary, cloudflare_stream_url.
 */
export async function getSessionSummaries(params: {
  limit?: number;
  activity?: string;
  athlete_id?: string;
} = {}): Promise<SessionSummariesResponse> {
  const client = getClient();
  return (await client.getSessionSummaries(params)) as SessionSummariesResponse;
}

/**
 * GET /api/athlete/{athlete_id}/session-summaries — session summaries for one athlete (for profile).
 */
export async function getAthleteSessionSummaries(
  athleteId: string,
  params: { limit?: number; activity?: string; technique?: string } = {}
): Promise<AthleteSessionSummariesResponse> {
  const client = getClient();
  return (await client.getAthleteSessionSummaries(athleteId, params)) as AthleteSessionSummariesResponse;
}

export type { SessionSummary };

/**
 * List alerts for an athlete (ALERT_SPEC §4.1).
 * Uses get_athlete_alerts with include_stream_urls and include_insights.
 */
export async function getAthleteAlerts(
  athleteId: string,
  params: {
    include_stream_urls?: boolean;
    include_insights?: boolean;
    include_metrics?: boolean;
    limit?: number;
  } = {}
): Promise<AthleteAlertsResponse> {
  const client = getClient();
  const result = (await client.getAthleteAlerts(athleteId, {
    include_stream_urls: params.include_stream_urls ?? true,
    include_insights: params.include_insights ?? true,
    include_metrics: params.include_metrics ?? true,
    limit: params.limit ?? 50,
  })) as AthleteAlertsResponse;
  return result;
}

/**
 * List all alerts (ALERT_SPEC §7).
 */
export async function getAllAlerts(params: { limit?: number } = {}): Promise<AthleteAlertsResponse | { status: string; alerts?: AlertPayload[]; count?: number }> {
  const client = getClient();
  const result = (await client.getAllAlerts({ limit: params.limit ?? 50 })) as
    | AthleteAlertsResponse
    | { status: string; alerts?: AlertPayload[]; count?: number };
  return result;
}

/**
 * Get single alert detail (ALERT_SPEC §4.4).
 */
export async function getAlert(alertId: string): Promise<{ status: string; alert?: AlertPayload }> {
  const client = getClient();
  return (await client.getAlert(alertId)) as { status: string; alert?: AlertPayload };
}

/**
 * Get all sessions for an alert (ALERT_SPEC §4.2).
 * Use for "Contributing sessions" with metadata and stream URLs.
 */
export async function getSessionsForAlert(
  alertId: string
): Promise<SessionsForAlertResponse> {
  const client = getClient();
  return (await client.getSessionsForAlert(alertId)) as SessionsForAlertResponse;
}

/**
 * Get all clips for an alert (ALERT_SPEC §4.3).
 * Use for clips grid with video URLs.
 */
export async function getClipsForAlert(
  alertId: string
): Promise<ClipsForAlertResponse> {
  const client = getClient();
  return (await client.getClipsForAlert(alertId)) as ClipsForAlertResponse;
}

/**
 * Get insights for a session (chat messages, form feedback, etc.).
 */
export async function getInsightsForSession(
  sessionId: string
): Promise<SessionInsightsResponse> {
  const client = getClient();
  return (await client.getInsightsForSession(sessionId)) as SessionInsightsResponse;
}

/**
 * Get full session (includes metrics, insights, etc.).
 */
export async function getSession(sessionId: string): Promise<Record<string, unknown>> {
  const client = getClient();
  const res = (await client.getSession(sessionId)) as Record<string, unknown>;
  const session = (res.session ?? res) as Record<string, unknown>;
  return session || res;
}

/**
 * Get metrics for a session. Uses getSession (full session with metrics);
 * get_metrics endpoint may only return status/session_id. Returns flat metrics object.
 */
export async function getMetricsForSession(
  sessionId: string
): Promise<Record<string, unknown>> {
  try {
    const session = await getSession(sessionId);
    const extracted = extractSessionMetrics(session);
    if (Object.keys(extracted).length > 0) return extracted;
  } catch (_) {}
  try {
    const metricsRes = (await getClient().getMetricsForSession(sessionId)) as Record<string, unknown>;
    return extractSessionMetrics(metricsRes);
  } catch (_) {}
  return {};
}

/**
 * Get insights, metrics, and recommendations for a session in one call.
 * Falls back to getInsightsForSession + getSession when endpoint fails or returns not_found.
 */
export async function getSessionInsightsMetricsRecommendations(
  sessionId: string
): Promise<SessionInsightsMetricsRecommendationsResponse> {
  try {
    const client = getClient();
    const data = (await client.getSessionInsightsMetricsRecommendations(sessionId)) as SessionInsightsMetricsRecommendationsResponse;
    if (data?.status === 'success') return data;
  } catch (e) {
    console.warn(`[getSessionInsightsMetricsRecommendations] ${sessionId} failed:`, e);
  }
  // Fallback: use separate endpoints (getInsightsForSession + getSession for metrics)
  try {
    const [insightsRes, session] = await Promise.all([
      getInsightsForSession(sessionId),
      getSession(sessionId),
    ]);
    const rawInsights = Array.isArray(insightsRes?.insights) ? insightsRes.insights : [];
    const insights = rawInsights.map((ins: unknown) =>
      typeof ins === 'string'
        ? { summary: ins }
        : (ins as { summary?: string; insights?: { summary?: string } })
    );
    const fullMetrics = extractSessionMetrics(session);
    const sess = session as Record<string, unknown>;
    return {
      status: 'success',
      session: {
        session_id: String(sess?.session_id ?? sessionId),
        athlete_id: sess?.athlete_id,
        athlete_name: sess?.athlete_name,
        activity: sess?.activity,
        technique: sess?.technique,
        timestamp: sess?.timestamp,
      },
      insights: insights.length > 0 ? insights as SessionInsightsMetricsRecommendationsResponse['insights'] : undefined,
      full_metrics: Object.keys(fullMetrics).length > 0 ? fullMetrics : undefined,
      recommendations: undefined,
      correlated_metrics: undefined,
    };
  } catch (e) {
    console.warn(`[getSessionInsightsMetricsRecommendations] fallback failed for ${sessionId}:`, e);
    return { status: 'error' };
  }
}

/**
 * Get session count for an alert (ALERT_SPEC §4.1).
 */
export function getAlertSessionCount(alert: AlertPayload): number {
  return (
    alert.session_ids?.length ??
    alert.sessions_affected?.length ??
    (alert.post_baseline_session_count ?? 0)
  );
}

/** Keys to exclude when displaying session metrics (metadata, not biomechanical) */
const METRIC_EXCLUDE_KEYS = new Set([
  'status', 'session_id', 'message', '_id', 'sessionId',
]);

/** Priority metrics to show first (ACL, landing, key angles) */
const METRIC_PRIORITY = [
  'acl_tear_risk_score', 'acl_risk_score', 'acl_risk_level', 'acl_max_valgus_angle',
  'landing_knee_bend', 'landing_knee_bend_min', 'landing_knee_bend_left', 'landing_knee_bend_right',
  'knee_valgus', 'knee_valgus_angle', 'knee_angle_left', 'knee_angle_right',
  'impact_force_N', 'impact_force', 'landing_velocity_ms',
  'height_off_floor', 'has_high_risk_acl', 'has_risk_acl',
];

/**
 * Extract relevant biomechanical/performance metrics from API response.
 * Handles: { metrics: { knee_valgus: 12, ... } } or { knee_valgus: 12, status: '...' }
 */
export function extractSessionMetrics(data: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const inner = (data.metrics as Record<string, unknown>) ?? data;
  if (!inner || typeof inner !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(inner)) {
    if (METRIC_EXCLUDE_KEYS.has(k)) continue;
    if (v == null) continue;
    if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') {
      out[k] = typeof v === 'number' && !Number.isInteger(v) ? Number(v.toFixed(2)) : v;
    } else if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0) {
      const nested = v as Record<string, unknown>;
      const val = nested.value;
      if (val != null && (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean')) {
        out[k] = typeof val === 'number' && !Number.isInteger(val) ? Number((val as number).toFixed(2)) : val;
      }
    }
  }
  return out;
}

/** Sort metrics so priority/relevant ones appear first */
export function sortSessionMetrics(metrics: Record<string, unknown>): [string, unknown][] {
  const entries = Object.entries(metrics);
  return entries.sort(([a], [b]) => {
    const ia = METRIC_PRIORITY.indexOf(a);
    const ib = METRIC_PRIORITY.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b);
  });
}

/** Safely convert API value to string for React rendering (handles {metric, display_name, value, status} objects) */
export function safeRenderValue(x: unknown): string {
  if (x == null) return '';
  if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') return String(x);
  if (typeof x === 'object' && x && 'value' in x) return String((x as { value?: unknown }).value ?? '');
  if (typeof x === 'object' && x && 'display_name' in x) return String((x as { display_name?: unknown }).display_name ?? '');
  return JSON.stringify(x);
}

/** Human-readable metric label */
export function formatMetricLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Baseline metric key → user-friendly display label (per baselines spec §5) */
export const BASELINE_METRIC_LABELS: Record<string, string> = {
  height_off_floor_meters: 'Jump height',
  knee_valgus_angle: 'Knee valgus angle',
  hip_angle_left: 'Left hip angle',
  hip_angle_right: 'Right hip angle',
  landing_knee_bend_min: 'Landing knee bend (min)',
  landing_knee_bend_avg: 'Landing knee bend (avg)',
  knee_angle_left: 'Left knee angle',
  knee_angle_right: 'Right knee angle',
  body_alignment_angle: 'Body alignment',
  body_alignment_degrees: 'Body alignment',
  split_angle_degrees: 'Split angle',
};

export function getBaselineMetricDisplayLabel(key: string): string {
  return BASELINE_METRIC_LABELS[key] ?? formatMetricLabel(key);
}

/** GET /api/alert/{alert_id}/baselines response (per baselines spec §2) */
export interface BaselinesForAlertResponse {
  status: 'success' | 'not_found' | 'error';
  alert?: {
    alert_id: string;
    athlete_id: string;
    insight_id: string;
    alert_type?: string;
    baseline_id?: string;
    severity?: string;
    status?: string;
    post_baseline_session_count?: number;
    session_ids?: string[];
  };
  baseline_id?: string;
  baseline?: {
    _id: string;
    athlete_id: string;
    insight_id: string;
    baseline_vector?: Record<string, { mean?: number; sd?: number; min?: number; max?: number; percentile_rank?: number }>;
    baseline_window?: {
      start_date?: string;
      end_date?: string;
      session_count?: number;
      session_ids?: string[];
    };
    status?: string;
    established_at?: string;
    established_by?: string;
    created_at?: string;
    updated_at?: string;
  } | null;
  related_baselines?: unknown[];
  message?: string;
}

/**
 * Get baselines for an alert (relevant baseline metrics for that alert).
 * Response: status, alert, baseline_id, baseline, related_baselines.
 */
export async function getBaselinesForAlert(
  alertId: string
): Promise<BaselinesForAlertResponse> {
  const client = getClient();
  return (await client.getBaselinesForAlert(alertId)) as BaselinesForAlertResponse;
}

/**
 * Get baselines for an athlete.
 */
export async function getBaselinesForAthlete(
  athleteId: string
): Promise<{ status: string; baselines?: Record<string, unknown> | unknown[]; message?: string }> {
  const client = getClient();
  return (await client.getBaselinesForAthlete(athleteId)) as {
    status: string;
    baselines?: Record<string, unknown> | unknown[];
    message?: string;
  };
}

/**
 * Get primary video URL for an alert (ALERT_SPEC §4.1).
 */
export function getAlertPrimaryVideoUrl(alert: AlertPayload): string | undefined {
  if (alert.cloudflare_stream_url) return alert.cloudflare_stream_url;
  const urls = alert.cloudflare_stream_urls;
  if (urls?.length) return urls[0].url;
  return undefined;
}

/**
 * Send event to orchestrator event queue (e.g. start live recording session).
 */
export async function sendToOrchestratorEventQueue(params: {
  call_id: string;
  athlete_id: string;
  activity?: string;
  technique?: string;
  user_requests?: string[];
  call_type?: string;
  max_retries?: number;
}): Promise<Record<string, unknown>> {
  const client = getClient();
  return (await client.sendToOrchestratorEventQueue(params)) as Record<string, unknown>;
}

/**
 * Stop the live camera feed and metrics (POST /api/live-camera/stop).
 */
export async function stopLiveCamera(): Promise<Record<string, unknown>> {
  const client = getClient();
  return (await client.stopLiveCamera()) as Record<string, unknown>;
}

/**
 * Start the ML agent for a live video call (POST /api/agent/start).
 */
export async function startAgent(params: {
  call_id: string;
  athlete_id?: string;
  activity?: string;
  technique?: string;
  user_requests?: string[];
}): Promise<Record<string, unknown>> {
  const client = getClient();
  return (await client.startAgent(params)) as Record<string, unknown>;
}

/**
 * Upload a photo file for an athlete (POST /api/athlete/add-photo-upload). Use after manual create to attach a profile photo.
 */
export async function addPhotoUploadToAthlete(params: {
  athlete_id: string;
  photo: File;
  athlete_name?: string;
}): Promise<Record<string, unknown>> {
  const client = getClient();
  return (await client.addPhotoUpload(params)) as Record<string, unknown>;
}

export { createAthleteCoachClient, AthleteCoachFastApiClient, createAthleteWithPhotoFormData } from './athleteCoachFastApiClient';
