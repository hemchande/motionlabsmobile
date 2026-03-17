import React, { useState } from 'react';
import {
  AlertTriangle,
  Activity,
  CheckCircle2,
  Info,
  Zap,
  Target,
  ArrowLeftRight,
  ShieldAlert,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MetricsData } from '../services/liveCameraWSClient';

/** Severity for styling: risk = red, form = amber, info = blue, good = green */
type MetricSeverity = 'risk' | 'form' | 'info' | 'good';

/** Map metric/insight keys to display label and severity — all form-relevant metrics shown in cards */
const METRIC_CONFIG: Record<string, { label: string; severity: MetricSeverity }> = {
  acl_risk: { label: 'ACL risk', severity: 'risk' },
  knee_valgus_collapse: { label: 'Knee valgus collapse', severity: 'form' },
  knee_valgus: { label: 'Knee valgus', severity: 'form' },
  knee_valgus_angle: { label: 'Knee valgus angle', severity: 'form' },
  insufficient_height: { label: 'Insufficient height', severity: 'form' },
  height_off_surface: { label: 'Height off surface', severity: 'form' },
  landing_knee_bend: { label: 'Landing knee bend', severity: 'form' },
  landing_knee_bend_in_landing: { label: 'Landing knee bend (landing)', severity: 'form' },
  landing_force: { label: 'Landing force', severity: 'form' },
  landing_quality: { label: 'Landing quality', severity: 'form' },
  asymmetry: { label: 'Asymmetry', severity: 'form' },
  insufficient_hip_flexion: { label: 'Insufficient hip flexion', severity: 'form' },
  hip_flexion: { label: 'Hip flexion', severity: 'form' },
  bent_knees_in_flight: { label: 'Bent knees in flight', severity: 'form' },
  poor_alignment: { label: 'Poor alignment', severity: 'form' },
  insufficient_split_angle: { label: 'Insufficient split angle', severity: 'form' },
  poor_landing_quality: { label: 'Poor landing quality', severity: 'form' },
  trunk_lean: { label: 'Trunk lean', severity: 'form' },
  arm_position: { label: 'Arm position', severity: 'form' },
  knee_flexion: { label: 'Knee flexion', severity: 'form' },
  ankle_dorsiflexion: { label: 'Ankle dorsiflexion', severity: 'form' },
  pelvic_tilt: { label: 'Pelvic tilt', severity: 'form' },
  core_stability: { label: 'Core stability', severity: 'form' },
  velocity: { label: 'Velocity', severity: 'info' },
  phase: { label: 'Phase', severity: 'info' },
  segments_count: { label: 'Segments', severity: 'info' },
  is_moving: { label: 'Moving', severity: 'info' },
  is_full_body: { label: 'Full body', severity: 'info' },
};

/** Only these keys are shown in the metrics grid (form/risk); excludes info-only metrics. */
const FORM_ERROR_RELEVANT_KEYS = new Set([
  'acl_risk',
  'knee_valgus_collapse',
  'knee_valgus',
  'knee_valgus_angle',
  'insufficient_height',
  'height_off_surface',
  'landing_knee_bend',
  'landing_knee_bend_in_landing',
  'landing_force',
  'landing_quality',
  'asymmetry',
  'insufficient_hip_flexion',
  'hip_flexion',
  'bent_knees_in_flight',
  'poor_alignment',
  'insufficient_split_angle',
  'poor_landing_quality',
  'trunk_lean',
  'arm_position',
  'knee_flexion',
  'ankle_dorsiflexion',
  'pelvic_tilt',
  'core_stability',
]);

const SEVERITY_STYLES: Record<
  MetricSeverity,
  { card: string; icon: string; label: string; value: string; border: string }
> = {
  risk: {
    card: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    label: 'text-red-800',
    value: 'text-red-900 font-semibold',
    border: 'border-l-red-500',
  },
  form: {
    card: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    label: 'text-amber-800',
    value: 'text-amber-900 font-semibold',
    border: 'border-l-amber-500',
  },
  info: {
    card: 'bg-slate-50 border-slate-200',
    icon: 'text-slate-600',
    label: 'text-slate-600',
    value: 'text-slate-900 font-medium',
    border: 'border-l-blue-400',
  },
  good: {
    card: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    label: 'text-emerald-800',
    value: 'text-emerald-900 font-semibold',
    border: 'border-l-emerald-500',
  },
};

function getConfigForKey(key: string): { label: string; severity: MetricSeverity } {
  const normalized = key.toLowerCase().replace(/\s+/g, '_');
  return (
    METRIC_CONFIG[normalized] ||
    METRIC_CONFIG[key] || {
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      severity: 'info' as MetricSeverity,
    }
  );
}

function SeverityIcon({ severity }: { severity: MetricSeverity }) {
  const iconClass = 'w-4 h-4 shrink-0 ' + SEVERITY_STYLES[severity].icon;
  switch (severity) {
    case 'risk':
      return <ShieldAlert className={iconClass} aria-hidden />;
    case 'form':
      return <AlertTriangle className={iconClass} aria-hidden />;
    case 'good':
      return <CheckCircle2 className={iconClass} aria-hidden />;
    default:
      return <Activity className={iconClass} aria-hidden />;
  }
}

/** Single metric card for numeric/string metrics */
function MetricCard({
  label,
  value,
  severity,
}: {
  label: string;
  value: string | number;
  severity: MetricSeverity;
}) {
  const s = SEVERITY_STYLES[severity];
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 min-h-[44px] ${s.card} ${s.border} border-l-4`}
    >
      <SeverityIcon severity={severity} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium ${s.label}`}>{label}</p>
        <p className={`text-sm truncate ${s.value}`}>{String(value)}</p>
      </div>
    </div>
  );
}

/** ACL summary block (risk-focused) */
function ACLRiskBlock({ summary }: { summary: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 flex items-start gap-3 border-l-4 border-l-red-500 min-h-[44px]">
      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">ACL</p>
        <p className="text-sm text-red-900 mt-0.5">{summary}</p>
      </div>
    </div>
  );
}

/** Movement / visibility message (info) */
function MessageBlock({
  message,
  variant = 'visibility',
}: {
  message: string;
  variant?: 'movement' | 'visibility';
}) {
  const isMovement = variant === 'movement';
  return (
    <div
      className={`rounded-xl border px-3 py-2 flex items-center gap-2 min-h-[40px] ${
        isMovement ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}
    >
      {isMovement ? (
        <Zap className="w-4 h-4 text-blue-600 shrink-0" />
      ) : (
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
      )}
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}

/** Phase + segments + turn row */
function PhaseRow({
  phase,
  segmentsCount,
  turnDetected,
}: {
  phase?: string;
  segmentsCount?: number;
  turnDetected?: boolean;
}) {
  if (phase == null && segmentsCount == null && !turnDetected) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {phase != null && phase !== '' && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          <Target className="w-3.5 h-3.5 text-slate-500" />
          {phase}
        </span>
      )}
      {segmentsCount != null && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          <Activity className="w-3.5 h-3.5" />
          {segmentsCount} segments
        </span>
      )}
      {turnDetected && (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Turn detected
        </span>
      )}
    </div>
  );
}

/** Recommendations section (form issues as styled list) */
function RecommendationsBlock({ issues }: { issues: string[] }) {
  if (!issues?.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5">
      <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5 mb-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
        Form & recommendations
      </p>
      <ul className="space-y-1.5">
        {issues.map((issue, i) => (
          <li
            key={i}
            className="text-xs text-amber-800 flex items-start gap-2 border-l-2 border-amber-400 pl-2 py-0.5"
          >
            <span className="shrink-0 w-1 h-1 rounded-full bg-amber-500 mt-1.5" />
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Collapsible "Extra metrics" — all remaining metrics not shown in main/ACL blocks */
function ExtraMetricsBlock({
  entries,
  defaultExpanded = false,
}: {
  entries: [string, unknown][];
  defaultExpanded?: boolean;
}) {
  const [open, setOpen] = useState(defaultExpanded);
  if (!entries.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-100/80 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Activity className="w-4 h-4 text-slate-500 shrink-0" />
          Extra metrics
          <span className="text-xs font-normal text-slate-500">({entries.length})</span>
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
        )}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-200/80">
          {entries.map(([key, value]) => {
            const { label, severity } = getConfigForKey(key);
            const displayValue =
              value === null || value === undefined
                ? '—'
                : typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value);
            return (
              <MetricCard
                key={key}
                label={label}
                value={displayValue}
                severity={key.toLowerCase().includes('acl') || key.toLowerCase().includes('risk') ? 'risk' : severity}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** ACL-specific checklist row (knee valgus, landing knee bend, hip flexion, landing force, insufficient height, asymmetry) */
function ACLChecklistBlock({
  metrics,
}: {
  metrics: Record<string, unknown>;
}) {
  const importantKeys: string[] = [
    'knee_valgus_collapse',
    'knee_valgus',
    'landing_knee_bend',
    'landing_knee_bend_in_landing',
    'insufficient_hip_flexion',
    'hip_flexion',
    'landing_force',
    'insufficient_height',
    'asymmetry',
  ];
  const entries = importantKeys
    .map((key) => {
      const value = metrics[key];
      if (value == null || String(value).trim() === '') return null;
      const { label, severity } = getConfigForKey(key);
      return { key, label, value, severity };
    })
    .filter(Boolean) as { key: string; label: string; value: unknown; severity: MetricSeverity }[];

  if (!entries.length) return null;

  return (
    <div className="rounded-xl border border-red-100 bg-white px-3 py-2.5 space-y-2">
      <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
        ACL landing checklist
      </p>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(({ key, label, value, severity }) => (
          <MetricCard
            key={key}
            label={label}
            value={value as string | number}
            severity={severity === 'info' ? 'form' : severity}
          />
        ))}
      </div>
    </div>
  );
}

export interface LiveCameraMetricsCardsProps {
  metrics: MetricsData | null;
  /** Max number of metric cards to show (default 6) */
  maxMetricCards?: number;
  /** Whether the panel starts expanded (default true) */
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Stylistic rendering of live camera metrics: ACL risk, knee valgus, insufficient height,
 * landing knee bend, asymmetry. Form-error-relevant metrics only; collapsible panel.
 */
export function LiveCameraMetricsCards({
  metrics,
  maxMetricCards = 6,
  defaultExpanded = true,
  className = '',
}: LiveCameraMetricsCardsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!metrics) return null;

  const { metrics: rawMetrics = {}, formIssues, aclSummary, movementMsg, visibilityMsg, phase, segmentsCount, turnDetected } = metrics;

  const allEntries = Object.entries(rawMetrics).filter(
    ([, v]) => v != null && String(v).trim() !== ''
  );
  const aclChecklistKeys = new Set([
    'knee_valgus_collapse',
    'knee_valgus',
    'landing_knee_bend',
    'landing_knee_bend_in_landing',
    'insufficient_hip_flexion',
    'hip_flexion',
    'landing_force',
    'insufficient_height',
    'asymmetry',
    'acl_risk',
  ]);
  // Only form-error-relevant metrics in the main grid (exclude ACL checklist duplicates and info-only keys)
  const displayEntries = allEntries.filter(
    ([key]) => !aclChecklistKeys.has(key) && FORM_ERROR_RELEVANT_KEYS.has(key)
  );
  const primaryShownKeys = new Set([
    ...aclChecklistKeys,
    ...displayEntries.slice(0, maxMetricCards).map(([k]) => k),
  ]);
  const extraEntries = allEntries.filter(([key]) => !primaryShownKeys.has(key));

  const formIssueCount = formIssues?.length ?? 0;
  const hasAcl = aclSummary != null && aclSummary !== '';
  const summaryLine = hasAcl
    ? `ACL: ${aclSummary}${formIssueCount > 0 ? ` · ${formIssueCount} form issue${formIssueCount !== 1 ? 's' : ''}` : ''}`
    : formIssueCount > 0
      ? `${formIssueCount} form issue${formIssueCount !== 1 ? 's' : ''}`
      : displayEntries.length > 0
        ? `${displayEntries.length} metric${displayEntries.length !== 1 ? 's' : ''}`
        : 'No form issues';

  return (
    <div className={`rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-slate-600 shrink-0" aria-hidden />
          <span className="font-semibold text-slate-900 text-sm">Form & metrics</span>
          {(hasAcl || formIssueCount > 0) && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {formIssueCount > 0 ? formIssueCount : 'ACL'}
            </span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" aria-hidden />
        )}
      </button>

      {!isExpanded && (
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-600 truncate" title={summaryLine}>{summaryLine}</p>
        </div>
      )}

      {isExpanded && (
        <div className="p-3 space-y-3 border-t border-slate-100 bg-slate-50/30">
          <PhaseRow phase={phase} segmentsCount={segmentsCount} turnDetected={turnDetected} />

          {hasAcl && <ACLRiskBlock summary={aclSummary!} />}

          <ACLChecklistBlock metrics={rawMetrics} />

          {movementMsg != null && movementMsg !== '' && (
            <MessageBlock message={movementMsg} variant="movement" />
          )}
          {visibilityMsg != null && visibilityMsg !== '' && (
            <MessageBlock message={visibilityMsg} variant="visibility" />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayEntries.slice(0, maxMetricCards).map(([key, value]) => {
              const { label, severity } = getConfigForKey(key);
              const displayValue = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
              return (
                <MetricCard
                  key={key}
                  label={label}
                  value={displayValue}
                  severity={key.toLowerCase().includes('acl') || key.toLowerCase().includes('risk') ? 'risk' : severity}
                />
              );
            })}
          </div>

          <RecommendationsBlock issues={formIssues ?? []} />

          <ExtraMetricsBlock entries={extraEntries} defaultExpanded={false} />
        </div>
      )}
    </div>
  );
}
