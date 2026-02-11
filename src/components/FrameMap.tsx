import { ArrowRight } from 'lucide-react';

interface FrameMapProps {
  onNavigate: (view: 'coach' | 'athlete' | 'ptat' | 'admin') => void;
}

export function FrameMap({ onNavigate }: FrameMapProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-gray-900 mb-2">Frame Map & Information Architecture</h2>
        <p className="text-gray-600">Four-lane user flow: Coach App • Athlete App • PT/AT App • Admin App</p>
      </div>

      {/* Coach Swimlane */}
      <div className="bg-white border-2 border-blue-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <h3 className="text-gray-900">Coach App Flow</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">11 screens</span>
          </div>
          <button
            onClick={() => onNavigate('coach')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            View Details →
          </button>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[
            { num: '1', label: 'Login\n& Role', phase: 'Entry' },
            { num: '2', label: 'Roster\nSetup', phase: 'Onboarding' },
            { num: '3', label: 'Schedule\nUpload', phase: 'Onboarding' },
            { num: '4', label: 'Roster\nList', phase: 'Core' },
            { num: '5', label: 'Athlete\nProfile', phase: 'Core' },
            { num: '6', label: 'Upload\nVideo', phase: 'Phase 2' },
            { num: '7', label: 'Live\nRecording', phase: 'Phase 2' },
            { num: '8', label: 'Alert\nBanner', phase: 'Core' },
            { num: '9', label: 'Evidence\nCarousel', phase: 'Core' },
            { num: '10', label: 'Team\nDashboard', phase: 'Core' },
            { num: '11', label: 'Settings\n& Admin', phase: 'Core' }
          ].map((screen, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-20 h-24 border-2 border-blue-400 bg-blue-50 rounded flex items-center justify-center mb-2">
                  <span className="text-blue-600">{screen.num}</span>
                </div>
                <p className="text-xs text-gray-700 text-center whitespace-pre-line leading-tight mb-1">
                  {screen.label}
                </p>
                <span className="text-xs text-gray-500">{screen.phase}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-blue-400 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-blue-200">
          <p className="text-sm text-gray-700 mb-2"><strong>Key Interactions:</strong></p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Roster → Profile → Alert Detail (evidence-first bundles)</li>
            <li>• Live Recording → Alert Banner → One-Tap Action (≤2s framework)</li>
            <li>• Evidence Carousel → Escalate → PT/AT Inbox (cross-app handoff)</li>
          </ul>
        </div>
      </div>

      {/* Athlete Swimlane */}
      <div className="bg-white border-2 border-green-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-600 rounded-full" />
            <h3 className="text-gray-900">Athlete App Flow</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">3 screens</span>
          </div>
          <button
            onClick={() => onNavigate('athlete')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            View Details →
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {[
            { num: '1', label: 'Personal\nProfile', desc: 'Read-only trends' },
            { num: '2', label: 'Clip\nHistory', desc: 'Evidence library' },
            { num: '3', label: '"Is This\nMe?"', desc: 'QA validation' }
          ].map((screen, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="w-24 h-28 border-2 border-green-400 bg-green-50 rounded flex items-center justify-center mb-2">
                  <span className="text-green-600">{screen.num}</span>
                </div>
                <p className="text-xs text-gray-700 text-center whitespace-pre-line leading-tight mb-1">
                  {screen.label}
                </p>
                <span className="text-xs text-gray-500">{screen.desc}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-green-400 mx-2 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-green-200">
          <p className="text-sm text-gray-700 mb-2"><strong>Key Interactions:</strong></p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Profile → Clip History → "Is this me?" (validation loop)</li>
            <li>• Simple metrics view (no coaching actions)</li>
            <li>• "Ask Coach" callout for questions</li>
          </ul>
        </div>
      </div>

      {/* PT/AT Swimlane */}
      <div className="bg-white border-2 border-purple-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-purple-600 rounded-full" />
            <h3 className="text-gray-900">PT/AT App Flow</h3>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded">2 screens</span>
          </div>
          <button
            onClick={() => onNavigate('ptat')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            View Details →
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {[
            { num: '1', label: 'Alerts\nInbox', desc: 'Pushed coach alerts' },
            { num: '2', label: 'Evidence\nView', desc: 'PT metrics + clips' }
          ].map((screen, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center min-w-[140px]">
                <div className="w-28 h-32 border-2 border-purple-400 bg-purple-50 rounded flex items-center justify-center mb-2">
                  <span className="text-purple-600">{screen.num}</span>
                </div>
                <p className="text-xs text-gray-700 text-center whitespace-pre-line leading-tight mb-1">
                  {screen.label}
                </p>
                <span className="text-xs text-gray-500">{screen.desc}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-purple-400 mx-2 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-purple-200">
          <p className="text-sm text-gray-700 mb-2"><strong>Key Interactions:</strong></p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Inbox (severity + recency grouping) → Evidence Detail</li>
            <li>• Swipe actions: Monitor / Dismiss / Escalate</li>
            <li>• "Push back to coach" + intervention notes (non-medical)</li>
          </ul>
        </div>
      </div>

      {/* Admin Swimlane */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-600 rounded-full" />
            <h3 className="text-gray-900">Admin App Flow</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">5 screens</span>
          </div>
          <button
            onClick={() => onNavigate('admin')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            View Details →
          </button>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[
            { num: '1', label: 'Login\n& Role', phase: 'Entry' },
            { num: '2', label: 'User\nManagement', phase: 'Onboarding' },
            { num: '3', label: 'Settings\nConfiguration', phase: 'Onboarding' },
            { num: '4', label: 'Audit\nLogs', phase: 'Core' },
            { num: '5', label: 'System\nStatus', phase: 'Core' }
          ].map((screen, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-20 h-24 border-2 border-gray-400 bg-gray-50 rounded flex items-center justify-center mb-2">
                  <span className="text-gray-600">{screen.num}</span>
                </div>
                <p className="text-xs text-gray-700 text-center whitespace-pre-line leading-tight mb-1">
                  {screen.label}
                </p>
                <span className="text-xs text-gray-500">{screen.phase}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-700 mb-2"><strong>Key Interactions:</strong></p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• User Management → Role Assignment → Access Control</li>
            <li>• Settings Configuration → System Parameters → Customization</li>
            <li>• Audit Logs → Activity Tracking → Security Compliance</li>
          </ul>
        </div>
      </div>

      {/* Design System & Tokens */}
      <div className="bg-white border-2 border-gray-900 rounded-lg p-6">
        <h3 className="text-gray-900 mb-4">Design System Components & Tokens</h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-700 mb-3"><strong>Navigation & Layout</strong></p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Top nav + org/role switcher</li>
              <li>• Footer compliance bar</li>
              <li>• Responsive grid (1600px max)</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-3"><strong>Cards & Modules</strong></p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Athlete card (status dot)</li>
              <li>• Alert row (confidence chip)</li>
              <li>• Clip card (metric snapshot)</li>
              <li>• Trend card / mini chart</li>
            </ul>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-3"><strong>Actions & Data</strong></p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• One-tap action bar</li>
              <li>• Metric row (live numbers)</li>
              <li>• Evidence carousel</li>
              <li>• Validation loop UI</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-700 mb-2"><strong>Mandatory Copy (Footer on Alert & Athlete Pages):</strong></p>
          <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs text-gray-600 italic">
            "MotionLabs measures movement patterns and supports coaching decisions. It does not diagnose injuries or provide medical advice. If pain or symptoms are present, consult your AT/PT."
          </div>
        </div>
      </div>

      {/* Global Assumptions */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-3">Global Assumptions & Constraints</h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-gray-700 mb-2"><strong>Platform:</strong></p>
            <ul className="text-gray-600 space-y-1">
              <li>• Desktop-first web app</li>
              <li>• Responsive to tablet (768px+)</li>
              <li>• Max width: 1600px</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-700 mb-2"><strong>Alert System:</strong></p>
            <ul className="text-gray-600 space-y-1">
              <li>• Pattern-gated (not single-rep)</li>
              <li>• Evidence bundles (3–8 clips)</li>
              <li>• Confidence tiers: High/Med/Low</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-700 mb-2"><strong>Language:</strong></p>
            <ul className="text-gray-600 space-y-1">
              <li>• Non-medical boundary</li>
              <li>• No diagnosis or injury prediction</li>
              <li>• Observation-based copy</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-700 mb-2"><strong>Coach Actions:</strong></p>
            <ul className="text-gray-600 space-y-1">
              <li>• ≤2s one-tap framework</li>
              <li>• Monitor / Adjust / Escalate / Dismiss</li>
              <li>• Validation loop (follow-up status)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}