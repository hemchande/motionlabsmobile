import { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Wireframe Screen (screen notes / annotations removed)
export function WireframeScreen({
  children,
}: {
  children: ReactNode;
  annotations?: {
    purpose: string;
    kpis: string[];
    dependencies: string[];
  };
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-300 rounded-lg min-h-[600px]">
        {children}
      </div>
    </div>
  );
}

// Top Navigation with Role Switcher
export function TopNavEnhanced({ 
  title, 
  role,
  orgName,
  actions 
}: { 
  title: string; 
  role?: string;
  orgName?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b-2 border-gray-300 p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center text-white text-xs">
            ML
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{title}</span>
              {role && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                  {role}
                </span>
              )}
            </div>
            {orgName && <p className="text-gray-500 text-xs mt-0.5">{orgName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <div className="w-8 h-8 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Athlete Card with Status Dot
export function AthleteCardEnhanced({
  name,
  age,
  school,
  status,
  injuryFlag,
  quickMetric,
  onClick,
}: {
  name: string;
  age: string;
  school: string;
  status: 'alert' | 'monitor' | 'green';
  injuryFlag?: boolean;
  quickMetric?: string;
  onClick?: () => void;
}) {
  const statusColors = {
    alert: 'bg-red-500',
    monitor: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div 
      className="border-2 border-gray-300 rounded-lg p-4 hover:border-gray-500 cursor-pointer transition-colors bg-white"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
          <div>
            <p className="text-gray-900 mb-0.5">{name}</p>
            <p className="text-gray-500 text-xs">
              {age} • {school}
              {injuryFlag && <span className="ml-2 text-red-600">⚠ Injury flag</span>}
            </p>
            {quickMetric && (
              <p className="text-gray-600 text-xs mt-1">{quickMetric}</p>
            )}
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} flex-shrink-0`} />
      </div>
    </div>
  );
}

// Alert Banner Component
export function AlertBannerEnhanced({
  athleteName,
  deviation,
  onClick,
}: {
  athleteName: string;
  deviation: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0" />
        <div>
          <p className="text-gray-900">
            <strong>{athleteName}</strong> is showing strong deviations from baseline in <strong>{deviation}</strong> movement
          </p>
          <p className="text-gray-600 text-sm mt-1">Click to view evidence and take action</p>
        </div>
      </div>
      <div className="text-gray-500 text-sm flex-shrink-0">→</div>
    </div>
  );
}

// Metrics Row with Live Updates
export function MetricsRowLive({ 
  metrics,
  live = false 
}: { 
  metrics: { 
    label: string; 
    value: string; 
    baseline?: string;
    trend?: 'up' | 'down' | 'stable';
  }[]; 
  live?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map((metric, index) => (
        <div key={index} className="border-2 border-gray-300 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs">{metric.label}</p>
            {live && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </div>
          <div className="flex items-end gap-2">
            <p className="text-gray-900 text-2xl">{metric.value}</p>
            {metric.trend && (
              <div className="mb-1">
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                {metric.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
              </div>
            )}
          </div>
          {metric.baseline && (
            <p className="text-gray-400 text-xs mt-1">Baseline: {metric.baseline}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Clip Card with Evidence
export function ClipCardEvidence({
  athleteName,
  timestamp,
  metric,
  deviation,
  thumbnail,
  isSelected = false,
}: {
  athleteName: string;
  timestamp: string;
  metric: string;
  deviation: string;
  thumbnail?: string;
  isSelected?: boolean;
}) {
  return (
    <div className={`border-2 rounded-lg overflow-hidden ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
    }`}>
      <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
        <div className="w-16 h-16 border-4 border-gray-400 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-400 border-b-8 border-b-transparent ml-1" />
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          0:08
        </div>
      </div>
      <div className="p-3">
        <p className="text-gray-900 text-sm mb-1">{athleteName}</p>
        <p className="text-gray-500 text-xs mb-2">{timestamp}</p>
        <div className="bg-gray-100 rounded px-2 py-1 text-xs text-gray-700 mb-1">
          {metric}
        </div>
        <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-xs text-red-700">
          {deviation}
        </div>
      </div>
    </div>
  );
}

// One-Tap Action Bar
export function OneTapActionBar({
  onMonitor,
  onAdjust,
  onEscalate,
  onDismiss,
}: {
  onMonitor?: () => void;
  onAdjust?: () => void;
  onEscalate?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="bg-white border-2 border-gray-900 rounded-lg p-4">
      <p className="text-gray-900 text-sm mb-3">Take Action (≤2s)</p>
      <div className="grid grid-cols-4 gap-3">
        <button 
          onClick={onMonitor}
          className="px-4 py-3 border-2 border-blue-400 bg-blue-50 rounded-lg text-blue-900 hover:bg-blue-100 transition-colors"
        >
          <p className="text-sm">Monitor</p>
        </button>
        <button 
          onClick={onAdjust}
          className="px-4 py-3 border-2 border-yellow-400 bg-yellow-50 rounded-lg text-yellow-900 hover:bg-yellow-100 transition-colors"
        >
          <p className="text-sm">Make a Change</p>
        </button>
        <button 
          onClick={onEscalate}
          className="px-4 py-3 border-2 border-red-400 bg-red-50 rounded-lg text-red-900 hover:bg-red-100 transition-colors"
        >
          <p className="text-sm">Escalate</p>
        </button>
        <button 
          onClick={onDismiss}
          className="px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <p className="text-sm">Dismiss</p>
        </button>
      </div>
    </div>
  );
}

// Confidence Chip
export function ConfidenceChip({ 
  level 
}: { 
  level: 'high' | 'medium' | 'low' 
}) {
  const styles = {
    high: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <span className={`px-2 py-1 border text-xs rounded ${styles[level]}`}>
      {level === 'high' ? 'High Confidence' : level === 'medium' ? 'Medium Confidence' : 'Low Confidence'}
    </span>
  );
}

// Validation Loop Status
export function ValidationStatus({ 
  status 
}: { 
  status: 'improving' | 'unchanged' | 'worsening' | 'insufficient' 
}) {
  const styles = {
    improving: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', icon: '↗', label: 'Improving' },
    unchanged: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: '→', label: 'Unchanged' },
    worsening: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: '↘', label: 'Worsening' },
    insufficient: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', icon: '?', label: 'Insufficient Data' },
  };

  const style = styles[status];

  return (
    <div className={`${style.bg} border-2 ${style.border} rounded-lg p-3 flex items-center gap-2`}>
      <span className="text-xl">{style.icon}</span>
      <div>
        <p className={`text-sm ${style.text}`}><strong>Follow-up Status:</strong></p>
        <p className={`text-xs ${style.text}`}>{style.label}</p>
      </div>
    </div>
  );
}

// Mandatory Footer
export function MandatoryFooter() {
  return (
    <div className="bg-gray-100 border-t-2 border-gray-300 p-4 text-center">
      <p className="text-xs text-gray-600 italic max-w-4xl mx-auto">
        MotionLabs measures movement patterns and supports coaching decisions. It does not diagnose injuries or provide medical advice. If pain or symptoms are present, consult your AT/PT.
      </p>
    </div>
  );
}

// Trend Chart
export function TrendChartEnhanced({ 
  title,
  data,
  baseline 
}: { 
  title: string;
  data?: number[];
  baseline?: number;
}) {
  const chartData = data || [40, 60, 45, 70, 55, 80, 65];
  const baselinePercent = baseline || 50;

  return (
    <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
      <p className="text-gray-900 text-sm mb-3">{title}</p>
      <div className="h-32 bg-gray-50 rounded flex items-end justify-around p-2 gap-1 relative">
        {/* Baseline line */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-dashed border-blue-400"
          style={{ bottom: `${baselinePercent}%` }}
        />
        {chartData.map((height, index) => (
          <div
            key={index}
            className={`w-full rounded-t ${
              height > baselinePercent + 10 ? 'bg-red-400' : 
              height < baselinePercent - 10 ? 'bg-green-400' : 
              'bg-gray-300'
            }`}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>Week 1</span>
        <span className="text-blue-600">--- Baseline</span>
        <span>Week 7</span>
      </div>
    </div>
  );
}

// Evidence Bundle Header
export function EvidenceBundleHeader({
  clipCount,
  sessionCount,
  dateRange,
  confidence,
}: {
  clipCount: number;
  sessionCount: number;
  dateRange: string;
  confidence: 'high' | 'medium' | 'low';
}) {
  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-900"><strong>Evidence Bundle</strong></p>
        <ConfidenceChip level={confidence} />
      </div>
      <div className="flex gap-6 text-sm text-gray-700">
        <div>
          <span className="text-gray-500">Clips:</span> <strong>{clipCount}</strong>
        </div>
        <div>
          <span className="text-gray-500">Sessions:</span> <strong>{sessionCount}</strong>
        </div>
        <div>
          <span className="text-gray-500">Date Range:</span> <strong>{dateRange}</strong>
        </div>
      </div>
    </div>
  );
}

// Button Component
export function ButtonEnhanced({
  children,
  variant = 'primary',
  size = 'medium',
  onClick,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}) {
  const variants = {
    primary: 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800',
    secondary: 'bg-gray-200 text-gray-900 border-gray-200 hover:bg-gray-300',
    outline: 'bg-white text-gray-900 border-gray-300 hover:border-gray-400',
    danger: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3',
  };

  return (
    <button 
      onClick={onClick}
      className={`border-2 rounded-lg transition-colors ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

// Form Field
export function FormFieldEnhanced({
  label,
  type = 'text',
  placeholder,
  required = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm mb-2">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <div className="w-full h-24 border-2 border-gray-300 rounded-lg bg-white" />
      ) : type === 'select' ? (
        <div className="w-full h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center justify-between px-3">
          {placeholder && <span className="text-gray-400 text-sm">{placeholder}</span>}
          <span className="text-gray-400">▼</span>
        </div>
      ) : (
        <div className="w-full h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center px-3">
          {placeholder && <span className="text-gray-400 text-sm">{placeholder}</span>}
        </div>
      )}
    </div>
  );
}
