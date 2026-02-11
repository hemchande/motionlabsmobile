/**
 * BaselineMetricsCard — clean, reusable UI for displaying baseline metrics.
 * Used in AlertDashboard, MobileAlertDetail, and MobileAthleteDetail.
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatMetricLabel, sortSessionMetrics } from '../services/athleteCoachService';

function formatValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export interface BaselineMetricsCardProps {
  /** Metric entries: [labelKey, value][] */
  entries: [string, unknown][];
  /** Card title */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Compact mode for mobile (smaller text, tighter spacing) */
  compact?: boolean;
  /** Max entries to show (default: all) */
  maxEntries?: number;
  /** Additional className for the card */
  className?: string;
}

export function BaselineMetricsCard({
  entries,
  title = 'Baseline Metrics',
  subtitle = 'Reference values used for drift detection',
  compact = false,
  maxEntries,
  className,
}: BaselineMetricsCardProps) {
  const sorted = entries.length > 0
    ? sortSessionMetrics(Object.fromEntries(entries))
    : [];
  const displayEntries = maxEntries ? sorted.slice(0, maxEntries) : sorted;

  if (displayEntries.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'px-4 pt-4 pb-2' : 'px-6 pt-6 pb-4'}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className={compact ? 'text-sm font-semibold' : 'text-base'}>
              {title}
            </CardTitle>
            {subtitle && (
              <CardDescription className={compact ? 'text-xs mt-0.5' : 'text-sm mt-0.5'}>
                {subtitle}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? 'px-4 pb-4 pt-0' : 'px-6 pb-6 pt-0'}>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden">
          <div
            className={
              compact
                ? 'divide-y divide-slate-100'
                : 'grid gap-0 divide-y divide-slate-100'
            }
          >
            {displayEntries.map(([key, value]) => (
              <div
                key={key}
                className={
                  compact
                    ? 'flex justify-between items-center px-3 py-2.5'
                    : 'flex justify-between items-center px-4 py-3 hover:bg-slate-50/80 transition-colors'
                }
              >
                <span
                  className={
                    compact
                      ? 'text-xs text-slate-600 truncate pr-3'
                      : 'text-sm text-slate-600 truncate pr-4'
                  }
                  title={key}
                >
                  {formatMetricLabel(key)}
                </span>
                <span
                  className={
                    compact
                      ? 'text-xs font-semibold text-slate-900 tabular-nums shrink-0'
                      : 'text-sm font-semibold text-slate-900 tabular-nums shrink-0 rounded-md bg-white px-2.5 py-1 border border-slate-100 shadow-sm'
                  }
                >
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        {maxEntries != null && sorted.length > maxEntries && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            +{sorted.length - maxEntries} more metric{sorted.length - maxEntries !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
