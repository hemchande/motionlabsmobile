import { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

// Wireframe Container
export function WireframeScreen({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg min-h-[600px]">
      {children}
    </div>
  );
}

// Top Navigation Bar
export function TopNav({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="border-b-2 border-gray-300 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded" />
          <span className="text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Athlete Card
export function AthleteCard({
  name,
  age,
  school,
  status,
}: {
  name: string;
  age: string;
  school: string;
  status: 'alert' | 'monitor' | 'green';
}) {
  const statusColors = {
    alert: 'bg-red-500',
    monitor: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="border-2 border-gray-300 rounded p-4 hover:border-gray-400 cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div>
            <p className="text-gray-900">{name}</p>
            <p className="text-gray-500 text-sm">{age} • {school}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
      </div>
    </div>
  );
}

// Alert Banner
export function AlertBanner({
  type,
  message,
}: {
  type: 'warning' | 'info' | 'success';
  message: string;
}) {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
    success: 'bg-green-50 border-green-300 text-green-900',
  };

  const icons = {
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
  };

  return (
    <div className={`border-2 rounded p-4 flex items-center gap-3 ${styles[type]}`}>
      {icons[type]}
      <p>{message}</p>
    </div>
  );
}

// Metrics Row
export function MetricsRow({ metrics }: { metrics: { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="border-2 border-gray-300 rounded p-4 text-center">
          <p className="text-gray-500 text-sm mb-2">{metric.label}</p>
          <p className="text-gray-900 text-xl">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

// Trend Chart Card
export function TrendChart({ title }: { title: string }) {
  return (
    <div className="border-2 border-gray-300 rounded p-4">
      <p className="text-gray-900 mb-3">{title}</p>
      <div className="h-32 bg-gray-100 rounded flex items-end justify-around p-2 gap-1">
        {[40, 60, 45, 70, 55, 80, 65].map((height, index) => (
          <div
            key={index}
            className="bg-gray-300 w-full rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Week 1</span>
        <span>Week 7</span>
      </div>
    </div>
  );
}

// Clip Card
export function ClipCard({
  athleteName,
  timestamp,
  metric,
  actions,
}: {
  athleteName: string;
  timestamp: string;
  metric?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-2 border-gray-300 rounded overflow-hidden">
      <div className="aspect-video bg-gray-200 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-400 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-400 border-b-8 border-b-transparent ml-1" />
        </div>
      </div>
      <div className="p-3">
        <p className="text-gray-900 mb-1">{athleteName}</p>
        <p className="text-gray-500 text-sm mb-2">{timestamp}</p>
        {metric && (
          <div className="bg-gray-100 rounded px-2 py-1 text-sm text-gray-700 mb-3">
            {metric}
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}

// Action Button Group
export function ActionButtonGroup({ buttons }: { buttons: string[] }) {
  return (
    <div className="flex gap-2">
      {buttons.map((button, index) => (
        <button
          key={index}
          className="flex-1 px-3 py-2 border-2 border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
        >
          {button}
        </button>
      ))}
    </div>
  );
}

// Form Field
export function FormField({
  label,
  type = 'text',
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-2">{label}</label>
      {type === 'textarea' ? (
        <div className="w-full h-24 border-2 border-gray-300 rounded bg-gray-50" />
      ) : (
        <div className="w-full h-10 border-2 border-gray-300 rounded bg-gray-50 flex items-center px-3">
          {placeholder && <span className="text-gray-400 text-sm">{placeholder}</span>}
        </div>
      )}
    </div>
  );
}

// Summary Tile
export function SummaryTile({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: 'red' | 'yellow' | 'green';
}) {
  const colors = {
    red: 'border-red-300 bg-red-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    green: 'border-green-300 bg-green-50',
  };

  return (
    <div className={`border-2 rounded p-4 ${colors[color]}`}>
      <p className="text-gray-600 text-sm mb-2">{title}</p>
      <p className="text-3xl text-gray-900">{count}</p>
    </div>
  );
}

// Table Header
export function TableHeader({ columns }: { columns: string[] }) {
  return (
    <div className="border-b-2 border-gray-300 pb-2 mb-2">
      <div className={`grid grid-cols-${columns.length} gap-4`}>
        {columns.map((col, index) => (
          <p key={index} className="text-gray-600 text-sm">
            {col}
          </p>
        ))}
      </div>
    </div>
  );
}

// Button
export function Button({
  children,
  variant = 'primary',
  size = 'medium',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}) {
  const variants = {
    primary: 'bg-gray-900 text-white border-gray-900',
    secondary: 'bg-gray-200 text-gray-900 border-gray-200',
    outline: 'bg-white text-gray-900 border-gray-300',
  };

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3',
  };

  return (
    <button className={`border-2 rounded ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  );
}

// Scatter Plot Placeholder
export function ScatterPlot() {
  return (
    <div className="border-2 border-gray-300 rounded p-4 bg-white">
      <p className="text-gray-900 mb-3">Athlete Deviation Comparison</p>
      <div className="h-64 bg-gray-50 rounded flex items-center justify-center relative">
        {/* X and Y axes */}
        <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-300" />
        <div className="absolute top-4 bottom-4 left-4 w-px bg-gray-300" />
        {/* Scattered points */}
        {[
          { x: 20, y: 30 },
          { x: 40, y: 50 },
          { x: 60, y: 40 },
          { x: 30, y: 70 },
          { x: 70, y: 60 },
          { x: 50, y: 30 },
          { x: 80, y: 45 },
        ].map((point, index) => (
          <div
            key={index}
            className="absolute w-2 h-2 bg-gray-400 rounded-full"
            style={{
              left: `${point.x}%`,
              bottom: `${point.y}%`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>← Baseline</span>
        <span>Deviation →</span>
      </div>
    </div>
  );
}
