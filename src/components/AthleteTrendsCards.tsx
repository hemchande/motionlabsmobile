/**
 * Stylized display for athlete trends (condensed GET /api/athlete/{id}/trends).
 * Uses metric_label, observation, status badge, direction arrow, change_percent,
 * session_count, expandable coaching_highlights, and optional stats.
 */

import { useState } from 'react';
import type { TrendItem } from '../services/athleteCoachFastApiClient';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface AthleteTrendsCardsProps {
  trends: TrendItem[];
  athleteName?: string | null;
  title?: string;
  maxCards?: number;
}

function statusVariant(status?: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'improving':
      return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Improving' };
    case 'declining':
      return { bg: 'bg-red-100', text: 'text-red-800', label: 'Declining' };
    case 'unchanged':
    case 'stable':
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: status === 'stable' ? 'Stable' : 'Unchanged' };
  }
}

function DirectionIcon({ direction }: { direction?: string }) {
  if (direction === 'increasing')
    return <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />;
  if (direction === 'decreasing')
    return <TrendingDown className="w-4 h-4 text-red-600 shrink-0" aria-hidden />;
  return <Minus className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />;
}

export function AthleteTrendsCards({
  trends,
  athleteName,
  title = 'Trends',
  maxCards = 20,
}: AthleteTrendsCardsProps) {
  const list = trends.slice(0, maxCards);
  if (list.length === 0) return null;

  return (
    <div className="mb-6">
      <h4 className="text-gray-900 mb-4">
        {title}
        {athleteName && (
          <span className="text-gray-500 font-normal ml-2">{athleteName}</span>
        )}
        <span className="text-gray-500 font-normal text-sm ml-2">({list.length})</span>
      </h4>
      <div className="space-y-4">
        {list.map((trend) => (
          <TrendCard key={trend.id ?? trend.metric_type ?? Math.random()} trend={trend} />
        ))}
      </div>
    </div>
  );
}

function TrendCard({ trend }: { trend: TrendItem }) {
  const [expanded, setExpanded] = useState(false);
  const variant = statusVariant(trend.status);
  const hasHighlights = trend.coaching_highlights && trend.coaching_highlights.length > 0;
  const hasStats = trend.stats && (trend.stats.first_mean != null || trend.stats.second_mean != null);

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h5 className="text-gray-900 font-semibold text-sm">
              {trend.metric_label ?? trend.metric_type ?? 'Metric'}
            </h5>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
              {variant.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <DirectionIcon direction={trend.direction} />
              {trend.change_percent != null && (
                <span className={trend.status === 'declining' ? 'text-red-600' : trend.status === 'improving' ? 'text-emerald-600' : ''}>
                  {trend.change_percent > 0 ? '+' : ''}{Number(trend.change_percent).toFixed(1)}%
                </span>
              )}
            </span>
          </div>
          {trend.observation && (
            <p className="text-gray-600 text-sm mb-2">{trend.observation}</p>
          )}
          {trend.session_count != null && (
            <p className="text-gray-500 text-xs">Across {trend.session_count} sessions</p>
          )}
        </div>
      </div>

      {hasStats && trend.stats && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-600">
          {trend.stats.first_mean != null && (
            <span>First half mean: <strong>{Number(trend.stats.first_mean).toFixed(3)}</strong></span>
          )}
          {trend.stats.second_mean != null && (
            <span>Second half mean: <strong>{Number(trend.stats.second_mean).toFixed(3)}</strong></span>
          )}
          {trend.stats.change != null && (
            <span>Change: <strong>{Number(trend.stats.change).toFixed(3)}</strong></span>
          )}
        </div>
      )}

      {hasHighlights && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide coaching notes' : 'Coaching highlights'}
          </button>
          {expanded && trend.coaching_highlights && (
            <ul className="mt-2 pl-4 list-disc text-sm text-gray-700 space-y-1">
              {trend.coaching_highlights.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
