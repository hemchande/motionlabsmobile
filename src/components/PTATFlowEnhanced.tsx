import {
  WireframeScreen,
  TopNavEnhanced,
  ClipCardEvidence,
  MetricsRowLive,
  TrendChartEnhanced,
  ConfidenceChip,
  EvidenceBundleHeader,
  MandatoryFooter,
  ButtonEnhanced,
} from './EnhancedComponents';
import { Filter, Download, ChevronDown, ChevronRight } from 'lucide-react';

export function PTATFlowEnhanced({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <AlertsInboxEnhanced key="alerts-inbox" />,
    <EvidenceViewPTATEnhanced key="evidence-view" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Alerts Inbox (Pushed Coach Alerts)
function AlertsInboxEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'PT/AT inbox showing escalated alerts from coaches, grouped by severity and recency',
        kpis: ['Response time', 'Swipe action usage', 'Escalation rate', 'Time to assessment'],
        dependencies: ['Pushed alert queue', 'Coach escalation logs', 'PT metrics', 'Intervention tracking']
      }}
    >
      <TopNavEnhanced
        title="PT/AT Dashboard"
        role="Athletic Trainer"
        orgName="Central High Gymnastics"
        actions={
          <>
            <ButtonEnhanced variant="outline" size="small">
              <Filter className="w-4 h-4 inline mr-1" /> Filter
            </ButtonEnhanced>
            <ButtonEnhanced variant="outline" size="small">
              <Download className="w-4 h-4 inline mr-1" /> Export
            </ButtonEnhanced>
          </>
        }
      />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Escalated Alerts</h3>
          <p className="text-gray-600 text-sm">
            Review movement pattern alerts pushed by coaches requiring PT/AT attention
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4">
            <p className="text-red-700 text-sm mb-1">New Alerts</p>
            <p className="text-3xl text-red-700 mb-2">5</p>
            <p className="text-xs text-red-600">Requires review</p>
          </div>
          <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4">
            <p className="text-yellow-700 text-sm mb-1">In Review</p>
            <p className="text-3xl text-yellow-700 mb-2">3</p>
            <p className="text-xs text-yellow-600">Under assessment</p>
          </div>
          <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4">
            <p className="text-blue-700 text-sm mb-1">Follow-up Scheduled</p>
            <p className="text-3xl text-blue-700 mb-2">2</p>
            <p className="text-xs text-blue-600">Appointments set</p>
          </div>
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
            <p className="text-green-700 text-sm mb-1">Resolved (30d)</p>
            <p className="text-3xl text-green-700 mb-2">12</p>
            <p className="text-xs text-green-600">Completed</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
              All Alerts (10)
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
              New (5)
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
              High Priority
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
              In Review (3)
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400 flex items-center gap-1">
              Sort: Recent <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts List - Grouped by Recency */}
        <div className="space-y-6">
          {/* Today */}
          <div>
            <p className="text-gray-700 text-sm mb-3"><strong>Today</strong></p>
            <div className="space-y-3">
              {/* High Priority Alert */}
              <div className="border-2 border-red-400 bg-red-50 rounded-lg p-5 hover:border-red-500 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900">Sarah Johnson</p>
                        <span className="px-2 py-0.5 bg-red-200 text-red-900 text-xs rounded">
                          High Priority
                        </span>
                        <ConfidenceChip level="high" />
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        16 • Central HS • Coach: Mike Stevens
                      </p>
                      <div className="flex gap-6 text-xs text-gray-600 mb-3">
                        <span>• Knee Valgus Deviation</span>
                        <span>• 6 clips, 3 sessions</span>
                        <span>• +50% from baseline</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        <strong>Coach Note:</strong> Significant knee valgus deviation detected over 3 
                        consecutive sessions. Pattern worsening despite reduced reps. Requesting PT 
                        assessment for potential intervention.
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-gray-500 text-xs mb-1">Escalated 2 hours ago</p>
                    <span className="px-3 py-1 bg-red-200 text-red-900 text-xs rounded">New</span>
                  </div>
                </div>
                
                {/* Swipe Actions / Quick Actions */}
                <div className="flex gap-2">
                  <ButtonEnhanced variant="primary" size="small">
                    Review Evidence →
                  </ButtonEnhanced>
                  <ButtonEnhanced variant="outline" size="small">
                    Schedule Assessment
                  </ButtonEnhanced>
                  <ButtonEnhanced variant="outline" size="small">
                    Contact Coach
                  </ButtonEnhanced>
                  <button className="ml-auto px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Medium Priority Alert */}
              <div className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-5 hover:border-yellow-500 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900">Lily Wang</p>
                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-900 text-xs rounded">
                          Medium Priority
                        </span>
                        <ConfidenceChip level="medium" />
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        15 • East Valley HS • Coach: Tom Bradley
                      </p>
                      <div className="flex gap-6 text-xs text-gray-600 mb-3">
                        <span>• Inconsistent Landing</span>
                        <span>• 4 clips, 2 sessions</span>
                        <span>• Beam dismount</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        <strong>Coach Note:</strong> Inconsistent landing mechanics on beam dismount. 
                        No pain reported. Request assessment to rule out any underlying issues.
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-gray-500 text-xs mb-1">Escalated 4 hours ago</p>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-900 text-xs rounded">New</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <ButtonEnhanced variant="primary" size="small">
                    Review Evidence →
                  </ButtonEnhanced>
                  <ButtonEnhanced variant="outline" size="small">
                    Mark Low Priority
                  </ButtonEnhanced>
                  <button className="ml-auto px-3 py-2 text-gray-500 hover:text-gray-700 text-sm">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div>
            <p className="text-gray-700 text-sm mb-3"><strong>This Week</strong></p>
            <div className="space-y-3">
              <div className="border-2 border-gray-300 rounded-lg p-5 bg-white hover:border-gray-400 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900">Anna Martinez</p>
                        <ConfidenceChip level="medium" />
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        16 • West Side Academy • Coach: Sarah Lee
                      </p>
                      <div className="flex gap-6 text-xs text-gray-600 mb-3">
                        <span>• Hip Flexion Reduction</span>
                        <span>• 5 clips, 2 sessions</span>
                        <span>• Floor routine</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        <strong>Coach Note:</strong> Reduced hip flexion range noted. May indicate 
                        tightness or fatigue. Athlete reports mild soreness (not pain).
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-gray-500 text-xs mb-1">Escalated 2 days ago</p>
                    <span className="px-3 py-1 bg-blue-200 text-blue-900 text-xs rounded">
                      In Review
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <ButtonEnhanced variant="primary" size="small">
                    Continue Assessment →
                  </ButtonEnhanced>
                  <ButtonEnhanced variant="outline" size="small">
                    Add Notes
                  </ButtonEnhanced>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 2: Evidence View - PT/AT Metrics
function EvidenceViewPTATEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Detailed PT/AT evidence view with biomechanical metrics, clips, and intervention planning',
        kpis: ['Assessment completion time', 'Intervention plan creation', 'Coach communication rate'],
        dependencies: ['PT-specific metrics API', 'Clip retrieval', 'Intervention templates', 'Coach notification']
      }}
    >
      <TopNavEnhanced
        title="Evidence Review - PT/AT"
        role="Athletic Trainer"
        orgName="Central High Gymnastics"
        actions={
          <ButtonEnhanced variant="outline" size="small">
            ← Back to Inbox
          </ButtonEnhanced>
        }
      />
      <div className="p-6">
        {/* Athlete Info Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-gray-900">Sarah Johnson</h3>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                High Priority
              </span>
              <ConfidenceChip level="high" />
            </div>
            <p className="text-gray-600 text-sm mb-2">
              16 • Central HS • 5'4", 118 lbs • Level 9 • Vault/Floor
            </p>
            <p className="text-gray-500 text-xs">
              Coach: Mike Stevens • Escalated 2 hours ago
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonEnhanced variant="outline" size="small">
              View Full History
            </ButtonEnhanced>
            <ButtonEnhanced variant="outline" size="small">
              Contact Coach
            </ButtonEnhanced>
          </div>
        </div>

        {/* Coach Alert Summary */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <p className="text-gray-900 text-sm mb-2"><strong>Coach Alert Summary:</strong></p>
          <p className="text-gray-700 text-sm mb-3">
            Significant knee valgus deviation detected over 3 consecutive sessions (Jan 1-3). Baseline: 12°, 
            Current average: 18° (+50% increase). Observed primarily during vault landings. Pattern worsening 
            despite reduced reps from 12 to 8 per session. No pain reported by athlete, but coach concerned 
            about injury risk. Requesting PT assessment for potential intervention.
          </p>
          <p className="text-gray-600 text-xs">
            <strong>Coach Intervention Attempted:</strong> Reduced vault volume by 33%, added strengthening 
            exercises (Dec 28)
          </p>
        </div>

        {/* Evidence Bundle */}
        <div className="mb-6">
          <EvidenceBundleHeader
            clipCount={6}
            sessionCount={3}
            dateRange="Jan 1-3, 2026"
            confidence="high"
          />
        </div>

        {/* PT/AT Specific Biomechanical Metrics */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Biomechanical Analysis</h4>
          <MetricsRowLive
            metrics={[
              { label: 'Knee Valgus Angle', value: '18°', baseline: '12°', trend: 'up' },
              { label: 'Q-Angle Deviation', value: '+6°', baseline: '15°', trend: 'up' },
              { label: 'Landing Force (GRF)', value: '2.8x BW', baseline: '2.4x', trend: 'up' },
              { label: 'Hip-Knee Alignment', value: 'Varus', baseline: 'Neutral' },
            ]}
          />
        </div>

        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Range of Motion & Functional Assessment</h4>
          <MetricsRowLive
            metrics={[
              { label: 'Hip Flexion', value: '95°', baseline: '105°', trend: 'down' },
              { label: 'Ankle Dorsiflexion', value: '12°', baseline: '15°', trend: 'down' },
              { label: 'Knee Extension', value: '0°', baseline: '0°', trend: 'stable' },
              { label: 'Hip Abduction', value: '42°', baseline: '45°', trend: 'down' },
            ]}
          />
        </div>

        {/* Video Evidence Carousel */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Video Evidence (6 clips)</h4>
          <div className="grid grid-cols-3 gap-4">
            <ClipCardEvidence
              athleteName="Vault Landing"
              timestamp="Jan 3, 2:34 PM"
              metric="Knee Valgus: 18°"
              deviation="↑50% from baseline"
              isSelected={true}
            />
            <ClipCardEvidence
              athleteName="Vault Landing"
              timestamp="Jan 3, 2:28 PM"
              metric="Knee Valgus: 19°"
              deviation="↑58% from baseline"
            />
            <ClipCardEvidence
              athleteName="Vault Landing"
              timestamp="Jan 2, 3:15 PM"
              metric="Knee Valgus: 17°"
              deviation="↑42% from baseline"
            />
            <ClipCardEvidence
              athleteName="Vault Landing"
              timestamp="Jan 2, 2:50 PM"
              metric="Knee Valgus: 18°"
              deviation="↑50% from baseline"
            />
            <ClipCardEvidence
              athleteName="Vault Landing"
              timestamp="Jan 1, 4:20 PM"
              metric="Knee Valgus: 16°"
              deviation="↑33% from baseline"
            />
            <ClipCardEvidence
              athleteName="Vault Landing"
              timestamp="Jan 1, 4:10 PM"
              metric="Knee Valgus: 17°"
              deviation="↑42% from baseline"
            />
          </div>
        </div>

        {/* Historical Trend - 30 Day */}
        <div className="mb-6">
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <p className="text-gray-900 mb-3">30-Day Trend Analysis</p>
            <div className="h-56 bg-gray-50 rounded flex items-end justify-around p-3 gap-1 relative">
              {/* Baseline and alert threshold lines */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-blue-500"
                style={{ bottom: '50%' }}
              />
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-red-400"
                style={{ bottom: '70%' }}
              />
              
              {[30, 32, 28, 35, 40, 38, 45, 50, 48, 52, 55, 60, 65, 70, 75].map((height, index) => (
                <div
                  key={index}
                  className={`w-full rounded-t ${
                    height > 70 ? 'bg-red-500' : 
                    height > 55 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 text-xs">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-gray-600">Normal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span className="text-gray-600">Elevated</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-gray-600">Alert</span>
                </div>
              </div>
              <div className="flex gap-4 text-gray-500">
                <span>— Baseline</span>
                <span>— Alert Threshold</span>
              </div>
            </div>
          </div>
        </div>

        {/* PT/AT Assessment Notes */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">PT/AT Assessment Notes</h4>
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <div className="h-40 p-4 text-sm text-gray-400 bg-gray-50 rounded-t-lg">
              Enter your clinical assessment observations here...
              <br /><br />
              Consider: movement patterns observed, ROM findings, strength assessment, functional testing results, 
              athlete-reported symptoms, recommended interventions.
            </div>
            <div className="border-t-2 border-gray-300 p-3 flex items-center justify-between bg-white rounded-b-lg">
              <span className="text-xs text-gray-500">Non-medical language required</span>
              <ButtonEnhanced variant="outline" size="small">
                Use Template
              </ButtonEnhanced>
            </div>
          </div>
        </div>

        {/* Recommended Action Plan */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Recommended Action Plan</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-start gap-3 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <input type="checkbox" className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm mb-1">Schedule in-person assessment</p>
                <p className="text-gray-600 text-xs">Full biomechanical evaluation</p>
              </div>
            </label>
            <label className="flex items-start gap-3 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <input type="checkbox" className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm mb-1">Prescribe corrective exercises</p>
                <p className="text-gray-600 text-xs">Knee stability & hip mobility</p>
              </div>
            </label>
            <label className="flex items-start gap-3 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <input type="checkbox" className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm mb-1">Modify training volume</p>
                <p className="text-gray-600 text-xs">Recommend reduced load</p>
              </div>
            </label>
            <label className="flex items-start gap-3 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <input type="checkbox" className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm mb-1">Refer to specialist</p>
                <p className="text-gray-600 text-xs">Orthopedic consultation if needed</p>
              </div>
            </label>
            <label className="flex items-start gap-3 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <input type="checkbox" className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm mb-1">Monitor with follow-up</p>
                <p className="text-gray-600 text-xs">Re-assess in 1-2 weeks</p>
              </div>
            </label>
            <label className="flex items-start gap-3 border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-white">
              <input type="checkbox" className="w-5 h-5 mt-0.5" />
              <div>
                <p className="text-gray-900 text-sm mb-1">Push back to coach</p>
                <p className="text-gray-600 text-xs">Recommend coach-led intervention</p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <ButtonEnhanced variant="primary" size="medium">
            Save Assessment
          </ButtonEnhanced>
          <ButtonEnhanced variant="outline" size="medium">
            Schedule Appointment
          </ButtonEnhanced>
          <ButtonEnhanced variant="outline" size="medium">
            Push Back to Coach
          </ButtonEnhanced>
          <ButtonEnhanced variant="outline" size="medium">
            Mark as Resolved
          </ButtonEnhanced>
        </div>
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}
