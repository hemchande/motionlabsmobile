/**
 * AlertBaselinesDisplay — displays baseline data for an alert per baselines spec.
 * AthleteBaselinesDisplay — displays an array of baseline documents (from getBaselinesForAthlete).
 * Both show only user-relevant info: established context, window, session count,
 * and per-metric stats table (Metric, Mean, SD, Range).
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getBaselineMetricDisplayLabel, getInsightDisplayLabel, type BaselinesForAlertResponse } from '../services/athleteCoachService';

/** Single baseline document (from API array or alert baselines response) */
export interface BaselineDocument {
  _id?: string;
  athlete_id?: string;
  insight_id?: string;
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
}

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '—';
  try {
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (!s && !e) return '—';
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (s && e) return `${fmt(s)} – ${fmt(e)}`;
    return s ? fmt(s) : e ? fmt(e) : '—';
  } catch {
    return start ?? end ?? '—';
  }
}

function formatEstablishedAt(established_at?: string): string {
  if (!established_at) return '—';
  try {
    return new Date(established_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return established_at;
  }
}

/** Renders a single baseline document as a card */
function BaselineDocumentCard({
  baseline,
  title,
  subtitle,
  compact = false,
  showInsightLabel = false,
}: {
  baseline: BaselineDocument;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  showInsightLabel?: boolean;
}) {
  const vector = baseline.baseline_vector ?? {};
  const window = baseline.baseline_window ?? {};
  const metricEntries = Object.entries(vector).filter(
    ([, v]) => v && typeof v === 'object' && (v.mean != null || v.min != null)
  );
  const hasMetrics = metricEntries.length > 0;
  const insightLabel = showInsightLabel && baseline.insight_id ? getInsightDisplayLabel(baseline.insight_id) : null;

  if (!hasMetrics && !baseline.established_at && !window.start_date) return null;

  return (
    <Card>
      <CardHeader className={compact ? 'px-4 pt-4 pb-2' : 'px-6 pt-6 pb-4'}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className={compact ? 'text-sm font-semibold' : 'text-base'}>
              {insightLabel ?? title ?? 'Baseline Reference'}
            </CardTitle>
            <CardDescription className={compact ? 'text-xs mt-0.5' : 'text-sm mt-0.5'}>
              {subtitle ?? 'Reference values used for drift detection'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'px-4 pb-4 pt-0' : 'px-6 pb-6 pt-0'}>
        {(baseline.established_at || baseline.established_by || window.start_date || window.session_count) && (
          <div
            className={
              compact
                ? 'mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600'
                : 'mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600'
            }
          >
            {baseline.established_at && (
              <span><strong>Established:</strong> {formatEstablishedAt(baseline.established_at)}</span>
            )}
            {baseline.established_by && (
              <span><strong>By:</strong> {baseline.established_by}</span>
            )}
            {(window.start_date || window.end_date) && (
              <span><strong>Window:</strong> {formatDateRange(window.start_date, window.end_date)}</span>
            )}
            {window.session_count != null && (
              <span><strong>Sessions used:</strong> {window.session_count}</span>
            )}
          </div>
        )}
        {hasMetrics && (
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className={compact ? 'px-3 py-2 text-xs font-medium text-slate-600' : 'px-4 py-2.5 text-sm font-medium text-slate-600'}>Metric</th>
                  <th className={compact ? 'px-3 py-2 text-xs font-medium text-slate-600' : 'px-4 py-2.5 text-sm font-medium text-slate-600'}>Mean</th>
                  <th className={compact ? 'px-3 py-2 text-xs font-medium text-slate-600' : 'px-4 py-2.5 text-sm font-medium text-slate-600'}>SD</th>
                  <th className={compact ? 'px-3 py-2 text-xs font-medium text-slate-600' : 'px-4 py-2.5 text-sm font-medium text-slate-600'}>Range</th>
                </tr>
              </thead>
              <tbody>
                {metricEntries.map(([key, stats]) => {
                  const s = stats as { mean?: number; sd?: number; min?: number; max?: number };
                  const range = s.min != null && s.max != null ? `${formatValue(s.min)} – ${formatValue(s.max)}` : '—';
                  return (
                    <tr key={key} className={compact ? 'border-b border-slate-100' : 'border-b border-slate-100 hover:bg-slate-50/80'}>
                      <td className={compact ? 'px-3 py-2 text-xs text-slate-700' : 'px-4 py-3 text-sm text-slate-700'}>{getBaselineMetricDisplayLabel(key)}</td>
                      <td className={compact ? 'px-3 py-2 text-xs font-semibold tabular-nums text-slate-900' : 'px-4 py-3 text-sm font-semibold tabular-nums text-slate-900'}>{formatValue(s.mean)}</td>
                      <td className={compact ? 'px-3 py-2 text-xs tabular-nums text-slate-700' : 'px-4 py-3 text-sm tabular-nums text-slate-700'}>{formatValue(s.sd)}</td>
                      <td className={compact ? 'px-3 py-2 text-xs tabular-nums text-slate-700' : 'px-4 py-3 text-sm tabular-nums text-slate-700'}>{range}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface AlertBaselinesDisplayProps {
  /** GET /api/alert/{alert_id}/baselines response */
  data: BaselinesForAlertResponse | null | undefined;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

export function AlertBaselinesDisplay({ data, compact = false, className }: AlertBaselinesDisplayProps) {
  if (!data || data.status !== 'success') return null;
  const baseline = data.baseline;
  if (!baseline) return null;

  const relatedBaselines = data.related_baselines ?? [];
  const hasRelated = Array.isArray(relatedBaselines) && relatedBaselines.length > 0;

  return (
    <div className={className}>
      <BaselineDocumentCard
        baseline={baseline as BaselineDocument}
        title="Baseline Reference"
        subtitle="Reference values used for drift detection"
        compact={compact}
      />
      {hasRelated && (
        <p className="mt-3 text-xs text-slate-500">
          {relatedBaselines.length} previous baseline{relatedBaselines.length !== 1 ? 's' : ''} (superseded)
        </p>
      )}
    </div>
  );
}

/** Props for AthleteBaselinesDisplay */
export interface AthleteBaselinesDisplayProps {
  /** Array of baseline documents from getBaselinesForAthlete */
  baselines: BaselineDocument[] | null | undefined;
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/** Displays an array of baseline documents (e.g. from getBaselinesForAthlete) */
export function AthleteBaselinesDisplay({ baselines, compact = false, className }: AthleteBaselinesDisplayProps) {
  const list = Array.isArray(baselines) ? baselines : [];
  if (list.length === 0) return null;

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {list.map((doc, i) => (
        <BaselineDocumentCard
          key={doc._id ?? i}
          baseline={doc}
          showInsightLabel
          subtitle="Reference values used for drift detection"
          compact={compact}
        />
      ))}
    </div>
  );
}
