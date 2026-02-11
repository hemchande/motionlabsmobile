/**
 * Alert Dashboard — displays alerts using Athlete Coach MCP service.
 * Implements ALERT_SPEC.md: insight labels, session count, stream URLs, sessions/clips.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  ChevronDown,
  ChevronRight,
  Video,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import {
  getAthleteAlerts,
  getAllAlerts,
  getAllAthletes,
  getBaselinesForAlert,
  getSessionsForAlert,
  getClipsForAlert,
  getSessionInsightsMetricsRecommendations,
  extractSessionMetrics,
  sortSessionMetrics,
  formatMetricLabel,
  safeRenderValue,
  getInsightDisplayLabel,
  getAlertSessionCount,
  getAlertPrimaryVideoUrl,
  type AlertPayload,
  type SessionsForAlertResponse,
  type ClipsForAlertResponse,
  type SessionInsightsMetricsRecommendationsResponse,
  type BaselinesForAlertResponse,
} from '../services/athleteCoachService';
import { StreamVideoPlayer } from './StreamVideoPlayer';
import { AlertBaselinesDisplay } from './AlertBaselinesDisplay';
import { useUser } from '../contexts/UserContext';

interface AthleteOption {
  athlete_id: string;
  athlete_name: string;
}

interface AlertDashboardProps {
  /** When set, fetches alerts for this athlete only. Otherwise fetches all alerts. */
  athleteId?: string;
  /** Initial athlete ID for input (when no athleteId prop) */
  defaultAthleteId?: string;
  /** Max alerts to fetch */
  limit?: number;
}

export function AlertDashboard({
  athleteId: propAthleteId,
  defaultAthleteId = 'athlete_001',
  limit = 50,
}: AlertDashboardProps) {
  const { athleteId: contextAthleteId } = useUser();
  const [athleteId, setAthleteId] = useState(
    propAthleteId ?? contextAthleteId ?? defaultAthleteId
  );
  const [mode, setMode] = useState<'athlete' | 'all'>(
    propAthleteId ? 'athlete' : 'athlete'
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: string;
    athlete_id?: string;
    count?: number;
    alerts?: AlertPayload[];
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [sessionsData, setSessionsData] = useState<
    Record<string, SessionsForAlertResponse>
  >({});
  const [clipsData, setClipsData] = useState<Record<string, ClipsForAlertResponse>>(
    {}
  );
  const [sessionDetailData, setSessionDetailData] = useState<
    Record<string, Record<string, SessionInsightsMetricsRecommendationsResponse>>
  >({}); // alertId -> sessionId -> full detail (insights, recommendations, full_metrics, correlated_metrics)
  const [baselinesData, setBaselinesData] = useState<Record<string, BaselinesForAlertResponse | null>>({});
  const [loadingSessions, setLoadingSessions] = useState<Record<string, boolean>>(
    {}
  );
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const dataRef = useRef({ sessionsData: {} as typeof sessionsData, clipsData: {} as typeof clipsData, sessionDetailData: {} as typeof sessionDetailData });
  dataRef.current = { sessionsData, clipsData, sessionDetailData };
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);

  const fetchAthletes = useCallback(async () => {
    try {
      const res = (await getAllAthletes({ limit: 100 })) as
        | { athletes?: Array<{ athlete_id?: string; athlete_name?: string }> }
        | Array<{ athlete_id?: string; athlete_name?: string }>;
      const raw =
        Array.isArray((res as { athletes?: unknown[] })?.athletes)
          ? (res as { athletes: Array<{ athlete_id?: string; athlete_name?: string }> }).athletes
          : Array.isArray(res)
            ? (res as Array<{ athlete_id?: string; athlete_name?: string }>)
            : [];
      setAthletes(
        raw.map((a) => ({
          athlete_id: a.athlete_id ?? '',
          athlete_name: a.athlete_name ?? a.athlete_id ?? 'Unknown',
        }))
      );
    } catch {
      setAthletes([]);
    }
  }, []);

  useEffect(() => {
    if (!propAthleteId) fetchAthletes();
  }, [propAthleteId, fetchAthletes]);

  useEffect(() => {
    if (
      !propAthleteId &&
      mode === 'athlete' &&
      athletes.length > 0 &&
      (!athleteId || !athletes.some((a) => a.athlete_id === athleteId))
    ) {
      setAthleteId(athletes[0].athlete_id);
    }
  }, [propAthleteId, mode, athletes, athleteId]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setExpandedAlert(null);
    setSessionsData({});
    setClipsData({});
    setSessionDetailData({});
    setBaselinesData({});

    try {
      if (mode === 'athlete' && athleteId) {
        const data = await getAthleteAlerts(athleteId, {
          include_stream_urls: true,
          include_insights: true,
          include_metrics: true,
          limit,
        });
        setResponse(data);
      } else {
        const data = await getAllAlerts({ limit });
        const normalized = Array.isArray((data as { alerts?: AlertPayload[] }).alerts)
          ? (data as { status: string; alerts?: AlertPayload[]; count?: number })
          : { status: (data as { status?: string }).status ?? 'success', alerts: [], count: 0 };
        setResponse(normalized);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg ||
          'Failed to fetch alerts. Make sure the Athlete Coach API is running on port 8004.'
      );
    } finally {
      setLoading(false);
    }
  }, [mode, athleteId, limit]);

  useEffect(() => {
    if (propAthleteId) {
      setAthleteId(propAthleteId);
      setMode('athlete');
    } else if (contextAthleteId) {
      setAthleteId(contextAthleteId);
      setMode('athlete');
    }
  }, [propAthleteId, contextAthleteId]);

  const loadSessionsAndClips = useCallback(async (alert: AlertPayload) => {
    const id = String(alert.alert_id ?? alert._id ?? '');
    if (!id) return;
    const { sessionsData: sd, clipsData: cd, sessionDetailData: sdd } = dataRef.current;
    const existingSessions = sd[id]?.sessions;
    const existingClips = cd[id]?.clips;
    const existingDetails = sdd[id];
    const hasSessionsOrClips = Array.isArray(existingSessions) && existingSessions.length > 0 || Array.isArray(existingClips) && existingClips.length > 0;
    const hasDetails = existingDetails && Object.keys(existingDetails).length > 0;
    if (hasSessionsOrClips || hasDetails) return;

    setLoadingSessions((prev) => ({ ...prev, [id]: true }));
    try {
      const [sessionsResp, clipsResp, baselinesResp] = await Promise.all([
        getSessionsForAlert(id),
        getClipsForAlert(id),
        getBaselinesForAlert(id),
      ]);
      const sessions = Array.isArray(sessionsResp?.sessions) ? sessionsResp.sessions : [];
      const clips = Array.isArray(clipsResp?.clips) ? clipsResp.clips : [];
      setSessionsData((prev) => ({ ...prev, [id]: { ...sessionsResp, sessions } }));
      setClipsData((prev) => ({ ...prev, [id]: { ...clipsResp, clips } }));

      // Fetch insights, metrics, and recommendations for each session via unified endpoint
      const sessionIds = new Set<string>();
      const getSessionId = (s: { session_id?: string; _id?: unknown; original_filename?: string }) => {
        const v = s.session_id ?? s._id ?? (s as { original_filename?: string }).original_filename;
        return v ? String(v) : '';
      };
      sessions.forEach((s) => {
        const sid = getSessionId(s);
        if (sid) sessionIds.add(sid);
      });
      // Also use session IDs from alert payload when getSessionsForAlert returns none
      (alert.session_ids ?? []).forEach((sid) => { if (sid) sessionIds.add(String(sid)); });
      (alert.sessions_affected ?? []).forEach((sid) => { if (sid) sessionIds.add(String(sid)); });
      if (alert.session_id) sessionIds.add(String(alert.session_id));

      const detailBySession: Record<string, SessionInsightsMetricsRecommendationsResponse> = {};
      await Promise.all(
        [...sessionIds].map(async (sid) => {
          try {
            const data = await getSessionInsightsMetricsRecommendations(sid);
            if (data?.status === 'success') {
              detailBySession[sid] = data;
            }
          } catch (_) {}
        })
      );
      if (Object.keys(detailBySession).length > 0) {
        setSessionDetailData((prev) => ({ ...prev, [id]: detailBySession }));
      }

      // API returns { status, alert, baseline_id, baseline, related_baselines }
      const baselinesRespTyped = baselinesResp as BaselinesForAlertResponse | undefined;
      setBaselinesData((prev) => ({ ...prev, [id]: baselinesRespTyped ?? null }));
    } catch (e) {
      console.error('Failed to load sessions/clips for alert', id, e);
    } finally {
      setLoadingSessions((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const toggleExpand = useCallback(
    (index: number, alert: AlertPayload) => {
      if (expandedAlert === index) {
        setExpandedAlert(null);
      } else {
        setExpandedAlert(index);
        loadSessionsAndClips(alert);
      }
    },
    [expandedAlert, loadSessionsAndClips]
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const alerts = response?.alerts ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Alert Dashboard
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Athlete Coach API:</strong> FastAPI server on port 8004 (ensure it
              is running)
            </p>
            <p className="text-xs text-blue-700">
              Uses REST endpoints. See ALERT_SPEC.md for display format.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            {!propAthleteId && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Athlete (coach view)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAthleteDropdown(!showAthleteDropdown)}
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-left"
                      disabled={mode === 'all'}
                    >
                      <span className="truncate">
                        {mode === 'all'
                          ? 'All Athletes'
                          : (athletes.find((a) => a.athlete_id === athleteId)
                              ?.athlete_name ?? athleteId) || 'Select athlete'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform ${
                          showAthleteDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {showAthleteDropdown && mode === 'athlete' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {athletes.map((a) => (
                          <button
                            key={a.athlete_id}
                            type="button"
                            onClick={() => {
                              setAthleteId(a.athlete_id);
                              setShowAthleteDropdown(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${
                              athleteId === a.athlete_id
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {a.athlete_name || a.athlete_id}
                          </button>
                        ))}
                        {athletes.length === 0 && (
                          <p className="px-4 py-2.5 text-gray-500 text-sm">
                            No athletes found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setMode('athlete');
                      if (athletes.length > 0 && !athleteId) setAthleteId(athletes[0].athlete_id);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      mode === 'athlete'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Athlete Alerts
                  </button>
                  <button
                    onClick={() => setMode('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      mode === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All Alerts
                  </button>
                </div>
              </>
            )}
            <div className="flex items-end">
              <button
                onClick={fetchAlerts}
                disabled={loading || (mode === 'athlete' && !athleteId)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Fetch Alerts
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium mb-1">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {response.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900">
                      Status: {response.status}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(response, null, 2))
                    }
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy JSON
                  </button>
                </div>
                {response.status === 'success' && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {response.athlete_id && (
                      <div>
                        <p className="text-sm text-gray-600">Athlete ID</p>
                        <p className="text-lg font-medium text-gray-900">
                          {response.athlete_id}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Alert Count</p>
                      <p className="text-lg font-medium text-gray-900">
                        {response.count ?? alerts.length}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {response.status === 'success' && alerts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Alerts ({alerts.length})
                  </h2>

                  {alerts.map((alert, index) => {
                    const displayLabel = getInsightDisplayLabel(
                      alert.insight_id ?? ''
                    );
                    const sessionCount = getAlertSessionCount(alert);
                    const primaryUrl = getAlertPrimaryVideoUrl(alert);
                    const alertId = alert.alert_id ?? alert._id ?? `alert-${index}`;
                    const sessions = sessionsData[alertId]?.sessions ?? [];
                    const clips = clipsData[alertId]?.clips ?? [];
                    const loadingDetail = loadingSessions[alertId];

                    return (
                      <div
                        key={alertId}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExpand(index, alert)}
                          className="w-full p-4 bg-white hover:bg-gray-50 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {displayLabel}
                              </p>
                              <p className="text-sm text-gray-500">
                                {alert.severity && `Severity: ${alert.severity} • `}
                                Status: {alert.status ?? 'unknown'} •{' '}
                                {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.alert_confidence != null && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {Math.round(alert.alert_confidence * 100)}%
                                confidence
                              </span>
                            )}
                            {expandedAlert === index ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </button>

                        {expandedAlert === index && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                            {loadingDetail ? (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading sessions and clips...
                              </div>
                            ) : (
                              <>
                                {/* Alert-level insights (from get_athlete_alerts enrichment) */}
                                {(alert.session_insights?.length ?? 0) > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4" />
                                      Session Insights
                                    </h3>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
                                      {alert.session_insights?.map((item: unknown, i: number) => (
                                        <div key={i} className="text-sm text-gray-700 border-l-2 border-blue-200 pl-3">
                                          {typeof item === 'string' ? item : JSON.stringify(item)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {alert.insights_with_urls && alert.insights_with_urls.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      Insights with URLs
                                    </h3>
                                    <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                      {alert.insights_with_urls.map((mapped: { insight_id?: string; cloudflare_url?: string; insights?: unknown[] }, idx: number) => (
                                        <div key={idx} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                          <p className="font-medium text-gray-900 text-sm">
                                            {getInsightDisplayLabel(mapped.insight_id ?? '')}
                                          </p>
                                          {mapped.cloudflare_url && (
                                            <a
                                              href={mapped.cloudflare_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 text-xs break-all hover:underline"
                                            >
                                              Video
                                            </a>
                                          )}
                                          {mapped.insights?.map((msg: unknown, j: number) => (
                                            <p key={j} className="text-xs text-gray-600 mt-1 pl-2 border-l border-gray-200">
                                              {typeof msg === 'string' ? msg : JSON.stringify(msg)}
                                            </p>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mb-4">
                                  <AlertBaselinesDisplay data={baselinesData[alertId]} />
                                </div>

                                {(() => {
                                  const details = sessionDetailData[alertId] ?? {};
                                  const displaySessions: Array<Record<string, unknown>> =
                                    sessions.length > 0
                                      ? (sessions as Array<Record<string, unknown>>)
                                      : Object.entries(details).map(([sid, d]) => {
                                          const sess = (d as { session?: Record<string, unknown> })?.session;
                                          return {
                                            ...(sess || {}),
                                            session_id: sid,
                                            _id: sid,
                                          };
                                        });
                                  if (displaySessions.length === 0) return null;
                                  return (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      Contributing Sessions ({displaySessions.length})
                                    </h3>
                                    <div className="space-y-4">
                                      {displaySessions.map((s, i) => {
                                        const sid = String(s.session_id ?? s._id ?? (s as { original_filename?: string }).original_filename ?? `s-${i}`);
                                        const streamUrl = s.cloudflare_stream_url as string | undefined;
                                        const detailsForAlert = sessionDetailData[alertId] ?? {};
                                        const detail = detailsForAlert[sid] ?? detailsForAlert[String(s.session_id)] ?? detailsForAlert[String(s._id)];
                                        const metrics = detail?.full_metrics
                                          ? extractSessionMetrics(detail.full_metrics as Record<string, unknown>)
                                          : extractSessionMetrics(s as Record<string, unknown>);
                                        const insightsList = Array.isArray(detail?.insights)
                                          ? detail.insights
                                          : Array.isArray((s as { insights?: unknown[] }).insights)
                                            ? (s as { insights: unknown[] }).insights
                                            : [];
                                        return (
                                          <div
                                            key={i}
                                            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                                          >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                                              <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                <span>
                                                  {s.timestamp
                                                    ? new Date(String(s.timestamp)).toLocaleString()
                                                    : 'N/A'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">Activity:</span>{' '}
                                                <span className="font-medium">{typeof s.activity === 'string' || typeof s.activity === 'number' ? String(s.activity) : 'N/A'}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">Technique:</span>{' '}
                                                <span className="font-medium">{typeof s.technique === 'string' || typeof s.technique === 'number' ? String(s.technique) : 'N/A'}</span>
                                              </div>
                                              <div>
                                                <span className="text-gray-600">Athlete:</span>{' '}
                                                <span className="font-medium">
                                                  {(s as { athlete_name?: string }).athlete_name ??
                                                    athletes.find((a) => a.athlete_id === ((s as { athlete_id?: string }).athlete_id ?? alert.athlete_id))?.athlete_name ??
                                                    (s as { athlete_id?: string }).athlete_id ??
                                                    alert.athlete_id ??
                                                    'N/A'}
                                                </span>
                                              </div>
                                            </div>

                                            {streamUrl && (
                                              <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-600 mb-1">Session Video</p>
                                                <StreamVideoPlayer url={streamUrl} title={`Session ${i + 1}`} className="rounded-lg" />
                                              </div>
                                            )}

                                            {detail?.recommendations && detail.recommendations.length > 0 && (
                                              <div className="mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <p className="text-xs font-medium text-emerald-800 mb-2 flex items-center gap-1">
                                                  <Lightbulb className="w-3 h-3" />
                                                  Recommendations
                                                </p>
                                                <div className="space-y-2">
                                                  {detail.recommendations.map((rec, j) => (
                                                    <div key={j} className="text-sm">
                                                      {rec.observation != null && rec.observation !== '' && (
                                                        <p className="text-gray-700 font-medium">{safeRenderValue(rec.observation)}</p>
                                                      )}
                                                      {rec.coaching_options?.length ? (
                                                        <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                                                          {rec.coaching_options.map((opt, k) => (
                                                            <li key={k}>{safeRenderValue(opt)}</li>
                                                          ))}
                                                        </ul>
                                                      ) : null}
                                                      {rec.how != null && rec.how !== '' && (
                                                        <p className="text-gray-500 text-xs mt-1 italic">How: {safeRenderValue(rec.how)}</p>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {metrics && Object.keys(metrics).length > 0 && (
                                              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                  <BarChart3 className="w-3 h-3" />
                                                  Metrics
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                                  {sortSessionMetrics(metrics)
                                                    .filter(([, v]) => v != null)
                                                    .map(([k, v]) => {
                                                      const displayVal = typeof v === 'object' && v && 'value' in v
                                                        ? (v as { value?: unknown }).value
                                                        : v;
                                                      if (displayVal == null || typeof displayVal === 'object') return null;
                                                      return (
                                                        <div key={k} className="flex justify-between gap-2">
                                                          <span className="text-gray-600 truncate" title={k}>
                                                            {formatMetricLabel(k)}:
                                                          </span>
                                                          <span className="font-medium truncate">{String(displayVal)}</span>
                                                        </div>
                                                      );
                                                    })
                                                    .filter(Boolean)
                                                    .slice(0, 24)}
                                                </div>
                                              </div>
                                            )}

                                            {detail?.correlated_metrics && detail.correlated_metrics.length > 0 && (
                                              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                                                  <BarChart3 className="w-3 h-3" />
                                                  Metrics by Insight
                                                </p>
                                                <div className="space-y-2">
                                                  {detail.correlated_metrics.map((corr, j) => (
                                                    <div key={j} className="text-sm">
                                                      {corr.description != null && corr.description !== '' && (
                                                        <p className="text-gray-700 font-medium">{safeRenderValue(corr.description)}</p>
                                                      )}
                                                      {corr.metric_values && Object.keys(corr.metric_values).length > 0 && (
                                                        <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                                                          {Object.entries(corr.metric_values)
                                                            .slice(0, 8)
                                                            .flatMap(([mk, mv]) => {
                                                              const displayVal = typeof mv === 'object' && mv && 'value' in mv
                                                                ? (mv as { value?: unknown }).value
                                                                : mv;
                                                              if (displayVal == null || typeof displayVal === 'object') return [];
                                                              return [(
                                                                <div key={mk} className="flex justify-between gap-2">
                                                                  <span className="text-gray-600">
                                                                    {typeof mv === 'object' && mv && 'display_name' in mv
                                                                      ? String((mv as { display_name?: unknown }).display_name ?? mk)
                                                                      : formatMetricLabel(mk)}:
                                                                  </span>
                                                                  <span className="font-medium">{String(displayVal)}</span>
                                                                </div>
                                                              )];
                                                            })}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {(insightsList.length > 0 || detail?.insights?.some((i) => i.summary || i.insights?.summary)) && (
                                              <div className="pt-3 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                  <MessageSquare className="w-3 h-3" />
                                                  Insights
                                                </p>
                                                <div className="space-y-3">
                                                  {detail?.insights && detail.insights.length > 0
                                                    ? detail.insights.map((ins, j) => {
                                                        const summary = ins.insights?.summary ?? ins.summary;
                                                        const keyFindings = ins.insights?.key_findings ?? ins.key_findings ?? [];
                                                        const rootCauses = ins.insights?.root_causes ?? ins.root_causes ?? [];
                                                        const recs = ins.insights?.recommendations ?? ins.recommendations ?? [];
                                                        return (
                                                          <div key={j} className="text-sm text-gray-700 pl-3 py-2 border-l-2 border-amber-300 bg-amber-50/50 rounded-r space-y-1">
                                                            {summary != null && summary !== '' && <p className="font-medium">{safeRenderValue(summary)}</p>}
                                                            {keyFindings.length > 0 && (
                                                              <div>
                                                                <span className="text-xs font-medium text-gray-600">Key findings:</span>
                                                                <ul className="list-disc list-inside text-xs">{keyFindings.map((f, k) => <li key={k}>{safeRenderValue(f)}</li>)}</ul>
                                                              </div>
                                                            )}
                                                            {rootCauses.length > 0 && (
                                                              <div>
                                                                <span className="text-xs font-medium text-gray-600">Root causes:</span>
                                                                <ul className="list-disc list-inside text-xs">{rootCauses.map((r, k) => <li key={k}>{safeRenderValue(r)}</li>)}</ul>
                                                              </div>
                                                            )}
                                                            {recs.length > 0 && (
                                                              <div>
                                                                <span className="text-xs font-medium text-gray-600">Recommendations:</span>
                                                                <ul className="list-disc list-inside text-xs">{recs.map((r, k) => <li key={k}>{safeRenderValue(r)}</li>)}</ul>
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })
                                                    : insightsList.map((ins: unknown, j: number) => (
                                                        <div key={j} className="text-sm text-gray-700 pl-3 py-1 border-l-2 border-amber-300 bg-amber-50/50 rounded-r">
                                                          {safeRenderValue(ins)}
                                                        </div>
                                                      ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  );
                                })()}

                                {clips.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <Video className="w-4 h-4" />
                                      Clips ({clips.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {clips.map((clip, i) => {
                                        const url =
                                          clip.cloudflare_stream_url ??
                                          clip.preview_url ??
                                          clip.stream_url;
                                        return (
                                          <div
                                            key={i}
                                            className="bg-white rounded-lg p-3 border border-gray-200"
                                          >
                                            {url ? (
                                              <>
                                                <p className="text-xs font-medium text-gray-600 mb-2">
                                                  Clip {i + 1}
                                                  {(clip.session_id || clip.clip_id) && (
                                                    <span className="text-gray-400 font-normal ml-2">
                                                      {clip.session_id && `Session: ${clip.session_id}`}
                                                      {clip.session_id && clip.clip_id && ' • '}
                                                      {clip.clip_id && `Clip: ${clip.clip_id}`}
                                                    </span>
                                                  )}
                                                </p>
                                                <StreamVideoPlayer url={String(url)} title={`Clip ${i + 1}`} className="rounded-lg" />
                                              </>
                                            ) : (
                                              <span className="text-gray-500 text-sm">
                                                Clip {i + 1} (no URL)
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {primaryUrl && sessions.length === 0 && clips.length === 0 && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                      Video
                                    </h3>
                                    <a
                                      href={primaryUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 text-sm"
                                    >
                                      {primaryUrl}
                                    </a>
                                  </div>
                                )}

                                {alert.session_metadata && (
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                      Session Metadata
                                    </h3>
                                    <div className="bg-white rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-gray-600">
                                          Athlete:
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {alert.session_metadata.athlete_name ??
                                            athletes.find((a) => a.athlete_id === alert.athlete_id)?.athlete_name ??
                                            alert.athlete_id ??
                                            'N/A'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Activity:
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {alert.session_metadata.activity ??
                                            'N/A'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Technique:
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {alert.session_metadata.technique ??
                                            'N/A'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">
                                          Session ID:
                                        </span>
                                        <span className="ml-2 font-mono text-xs">
                                          {alert.session_metadata.session_id ??
                                            'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {alert.cloudflare_stream_urls &&
                                  alert.cloudflare_stream_urls.length > 0 && (
                                    <div>
                                      <h3 className="font-semibold text-gray-900 mb-2">
                                        Stream URLs (
                                        {alert.cloudflare_stream_urls.length})
                                      </h3>
                                      <div className="bg-white rounded-lg p-3 space-y-2">
                                        {alert.cloudflare_stream_urls.map(
                                          (urlInfo, urlIndex) => (
                                            <div
                                              key={urlIndex}
                                              className="text-sm"
                                            >
                                              <p className="text-gray-600 mb-1">
                                                Source:{' '}
                                                <span className="font-medium">
                                                  {urlInfo.source}
                                                </span>{' '}
                                                • Type:{' '}
                                                <span className="font-medium">
                                                  {urlInfo.type}
                                                </span>
                                              </p>
                                              <a
                                                href={urlInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-xs text-blue-600 break-all hover:underline"
                                              >
                                                {urlInfo.url}
                                              </a>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {response.status === 'success' &&
                (!alerts || alerts.length === 0) && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No alerts found.</p>
                  </div>
                )}

              {response.status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{response.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
