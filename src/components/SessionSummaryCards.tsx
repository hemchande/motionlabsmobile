/**
 * Stylized session summary cards for athlete profile.
 * Shows relevant metrics and full insight text; parses stringified insight objects
 * so "what" and "why" display clearly instead of raw dict strings.
 */

import { useState } from 'react';
import type { SessionSummary } from '../services/athleteCoachService';
import { Video, AlertTriangle, Activity, ChevronDown, ChevronUp, Copy } from 'lucide-react';

const MAX_FORM_ISSUES_SHOWN = 5;
const MAX_INSIGHT_PREVIEWS_SHOWN = 10;

export interface SessionSummaryCardsProps {
  summaries: SessionSummary[];
  title?: string;
  maxCards?: number;
  /** Optional class for the container */
  className?: string;
}

function formatTimestamp(ts: string | undefined): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
  } catch {
    return String(ts ?? '');
  }
}

/** Shorten long session ids for display (e.g. client_..._seg_14 → Seg 14 or last part) */
function shortSessionId(sessionId: string | undefined): string {
  if (!sessionId) return 'Session';
  const seg = sessionId.match(/_seg_(\d+)$/i);
  if (seg) return `Segment ${seg[1]}`;
  if (sessionId.length > 24) return sessionId.slice(-20);
  return sessionId;
}

/**
 * Try to parse insight_previews that may be stringified dicts (Python or JSON).
 * e.g. "{'priority': 'medium', 'what': 'Address: Knee valgus risk', 'why': 'Form issue...'}"
 * or {"what": "Address: Knee valgus risk", "why": "Form issue..."}
 * Returns { what, why, raw } so we can render readable lines instead of cut-off dict text.
 */
function parseInsightPreview(raw: string): { what?: string; why?: string; priority?: string; raw: string } {
  const result: { what?: string; why?: string; priority?: string; raw: string } = { raw };
  if (typeof raw !== 'string' || !raw.trim()) return result;
  const s = raw.trim();

  // Try JSON first when keys use double quotes (e.g. {"what": "...", "why": "..."})
  if (s.startsWith('{') && s.includes('"')) {
    try {
      const obj = JSON.parse(s) as Record<string, unknown>;
      if (typeof obj.what === 'string') result.what = obj.what;
      if (typeof obj.why === 'string') result.why = obj.why;
      if (typeof obj.priority === 'string') result.priority = obj.priority;
      if (result.what != null || result.why != null) return result;
    } catch {
      /* fall through to regex */
    }
  }

  // Python-style single-quoted dict
  const whatMatch = s.match(/'what':\s*'((?:[^'\\]|\\.)*)'/);
  const whyMatch = s.match(/'why':\s*'((?:[^'\\]|\\.)*)'/);
  const priorityMatch = s.match(/'priority':\s*'((?:[^'\\]|\\.)*)'/);
  if (whatMatch) result.what = whatMatch[1].replace(/\\'/g, "'");
  if (whyMatch) result.why = whyMatch[1].replace(/\\'/g, "'");
  if (priorityMatch) result.priority = priorityMatch[1];
  return result;
}

export function SessionSummaryCards({
  summaries,
  title = 'Session Summaries',
  maxCards = 10,
  className = '',
}: SessionSummaryCardsProps) {
  const list = summaries.slice(0, maxCards);
  if (list.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="text-gray-900 font-semibold mb-3">
        {title}
        <span className="text-gray-500 font-normal text-sm ml-2">({list.length})</span>
      </h4>
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1" aria-label="Session summaries list">
        {list.map((summary, i) => (
          <SessionSummaryCard key={summary.session_id ?? `session-${i}`} summary={summary} index={i} />
        ))}
      </div>
    </div>
  );
}

function SessionSummaryCard({ summary, index }: { summary: SessionSummary; index: number }) {
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const issues = summary.issues_summary;
  const metrics = summary.metrics_summary;
  const aclLevel = issues?.acl_risk_level;
  const isHighRisk = issues?.has_high_risk_acl ?? (aclLevel === 'HIGH');

  const formIssues = issues?.form_issues ?? [];
  const formIssuesShown = formIssues.slice(0, MAX_FORM_ISSUES_SHOWN);
  const formIssuesExtra = formIssues.length > MAX_FORM_ISSUES_SHOWN ? formIssues.length - MAX_FORM_ISSUES_SHOWN : 0;

  const insightPreviews = issues?.insight_previews ?? [];
  const insightsToShow = insightPreviews.slice(0, MAX_INSIGHT_PREVIEWS_SHOWN);
  const hasMoreInsights = insightPreviews.length > MAX_INSIGHT_PREVIEWS_SHOWN;

  const sessionId = summary.session_id ?? `session-${index + 1}`;
  const sessionLabel = shortSessionId(sessionId);
  const activityLine = [summary.activity, summary.technique].filter(Boolean).join(' • ') || null;

  const hasRelevantMetrics =
    metrics &&
    (metrics.acl_risk_score != null ||
      metrics.height_off_floor_meters != null ||
      metrics.body_alignment_degrees != null ||
      metrics.knee_valgus != null);

  return (
    <article className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors shadow-sm min-w-0">
      {/* Header: short session label + timestamp + video link */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-gray-900 font-medium text-sm" title={String(summary.session_id)}>
            {sessionLabel}
          </p>
          {summary.timestamp && (
            <p className="text-gray-500 text-xs mt-0.5">{formatTimestamp(summary.timestamp)}</p>
          )}
        </div>
        {summary.cloudflare_stream_url && (
          <div className="shrink-0 flex flex-col items-end gap-1">
            <a
              href={summary.cloudflare_stream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              <Video className="w-3.5 h-3.5" />
              Watch video
            </a>
            <div className="flex items-center gap-1.5 max-w-full">
              <span className="text-gray-500 text-xs truncate max-w-[200px] sm:max-w-[280px]" title={summary.cloudflare_stream_url}>
                {summary.cloudflare_stream_url}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(summary.cloudflare_stream_url ?? '');
                }}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Copy URL"
                aria-label="Copy stream URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity / technique */}
      {activityLine && (
        <div className="flex items-center gap-1.5 text-gray-600 text-xs mb-2">
          <Activity className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="break-words">{activityLine}</span>
        </div>
      )}

      {/* Issues: form issues, ACL badge */}
      {issues && (formIssues.length > 0 || aclLevel) && (
        <div className="space-y-1.5 mb-3">
          {formIssuesShown.length > 0 && (
            <div className="flex flex-wrap items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-amber-800 text-xs break-words">
                  <span className="font-medium">Form: </span>
                  {formIssuesShown.join(', ')}
                  {formIssuesExtra > 0 && (
                    <span className="text-amber-700"> +{formIssuesExtra} more</span>
                  )}
                </p>
              </div>
            </div>
          )}
          {aclLevel && (
            <p className={`text-xs font-medium ${isHighRisk ? 'text-red-700' : 'text-gray-700'}`}>
              ACL risk: <span className={isHighRisk ? 'text-red-800' : ''}>{aclLevel}</span>
              {issues.acl_high_risk_count != null && issues.acl_high_risk_count > 0 && (
                <span className="text-gray-600 font-normal"> ({issues.acl_high_risk_count} high)</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Insights: parsed what/why so full text shows (no dict string cut-off) */}
      {insightsToShow.length > 0 && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setInsightsExpanded(!insightsExpanded)}
            className="flex items-center gap-1 text-gray-700 font-medium text-xs mb-1.5 hover:text-gray-900"
          >
            {insightsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Insights {insightsToShow.length > 0 && `(${insightsToShow.length}${hasMoreInsights ? '+' : ''})`}
          </button>
          {insightsExpanded && (
            <ul className="space-y-2 pl-0 list-none">
              {insightsToShow.map((raw, idx) => {
                const parsed = parseInsightPreview(typeof raw === 'string' ? raw : JSON.stringify(raw));
                const hasParsed = parsed.what != null || parsed.why != null;
                return (
                  <li key={idx} className="text-xs border-l-2 border-gray-200 pl-2.5 py-1">
                    {hasParsed ? (
                      <div className="space-y-1 break-words">
                        {parsed.priority && (
                          <span className="text-gray-500 font-medium">Priority: {parsed.priority}</span>
                        )}
                        {parsed.what && (
                          <p className="text-gray-800"><span className="font-medium text-gray-700">What: </span>{parsed.what}</p>
                        )}
                        {parsed.why && (
                          <p className="text-gray-600"><span className="font-medium text-gray-500">Why: </span>{parsed.why}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600 break-words">{parsed.raw}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {hasMoreInsights && insightsExpanded && (
            <p className="text-gray-500 text-xs mt-1">+{insightPreviews.length - MAX_INSIGHT_PREVIEWS_SHOWN} more</p>
          )}
        </div>
      )}

      {/* Metrics: key chips */}
      {hasRelevantMetrics && metrics && (
        <div className="flex flex-wrap gap-2">
          {metrics.acl_risk_score != null && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              ACL score: {Number(metrics.acl_risk_score).toFixed(2)}
            </span>
          )}
          {metrics.height_off_floor_meters != null && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              Height: {Number(metrics.height_off_floor_meters).toFixed(2)} m
            </span>
          )}
          {metrics.body_alignment_degrees != null && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              Alignment: {Number(metrics.body_alignment_degrees).toFixed(0)}°
            </span>
          )}
          {metrics.knee_valgus != null && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              Knee valgus: {Number(metrics.knee_valgus).toFixed(0)}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
