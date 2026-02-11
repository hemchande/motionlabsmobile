import {
  WireframeScreen,
  TopNav,
  ClipCard,
  MetricsRow,
  Button,
} from './WireframeComponents';
import { Filter, Download } from 'lucide-react';

export function PTATFlow({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <AlertsInbox key="alerts-inbox" />,
    <EvidenceViewPTAT key="evidence-view" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Alerts Inbox
function AlertsInbox() {
  return (
    <WireframeScreen>
      <TopNav
        title="PT/AT Dashboard"
        actions={
          <>
            <Button variant="outline" size="small">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="small">
              <Download className="w-4 h-4" />
            </Button>
          </>
        }
      />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Escalated Alerts</h3>
          <p className="text-gray-500 text-sm">
            Review alerts pushed by coaches requiring PT/AT attention
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border-2 border-red-300 bg-red-50 rounded p-4">
            <p className="text-gray-600 text-sm mb-1">New Alerts</p>
            <p className="text-3xl text-gray-900">5</p>
          </div>
          <div className="border-2 border-yellow-300 bg-yellow-50 rounded p-4">
            <p className="text-gray-600 text-sm mb-1">In Review</p>
            <p className="text-3xl text-gray-900">3</p>
          </div>
          <div className="border-2 border-blue-300 bg-blue-50 rounded p-4">
            <p className="text-gray-600 text-sm mb-1">Follow-up Scheduled</p>
            <p className="text-3xl text-gray-900">2</p>
          </div>
          <div className="border-2 border-green-300 bg-green-50 rounded p-4">
            <p className="text-gray-600 text-sm mb-1">Resolved</p>
            <p className="text-3xl text-gray-900">12</p>
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex gap-2 mb-6">
          <div className="px-4 py-2 bg-gray-900 text-white rounded">All Alerts</div>
          <div className="px-4 py-2 border-2 border-gray-300 rounded text-gray-700">New</div>
          <div className="px-4 py-2 border-2 border-gray-300 rounded text-gray-700">
            High Priority
          </div>
          <div className="px-4 py-2 border-2 border-gray-300 rounded text-gray-700">
            In Review
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {/* High Priority Alert */}
          <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">Sarah Johnson</p>
                    <span className="px-2 py-0.5 bg-red-200 text-red-900 text-xs rounded">
                      High Priority
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    16 • Central HS • Coach: Mike Stevens
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Alert:</strong> Significant knee valgus deviation detected over 3
                    consecutive sessions. Increased 50% from baseline.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm mb-1">Escalated 2 hours ago</p>
                <span className="px-2 py-1 bg-red-200 text-red-900 text-xs rounded">New</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="small">
                Review Evidence
              </Button>
              <Button variant="outline" size="small">
                Schedule Assessment
              </Button>
              <Button variant="outline" size="small">
                Contact Coach
              </Button>
            </div>
          </div>

          {/* Medium Priority Alert */}
          <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">Anna Martinez</p>
                    <span className="px-2 py-0.5 bg-yellow-200 text-yellow-900 text-xs rounded">
                      Medium
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    16 • West Side Academy • Coach: Sarah Lee
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Alert:</strong> Reduced hip flexion range noted during floor routine.
                    May indicate tightness or fatigue.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm mb-1">Escalated 1 day ago</p>
                <span className="px-2 py-1 bg-blue-200 text-blue-900 text-xs rounded">
                  In Review
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="small">
                Review Evidence
              </Button>
              <Button variant="outline" size="small">
                Add Notes
              </Button>
            </div>
          </div>

          {/* Standard Alert */}
          <div className="border-2 border-gray-300 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full mt-1" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">Lily Wang</p>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    15 • East Valley HS • Coach: Tom Bradley
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Alert:</strong> Inconsistent landing mechanics on beam dismount.
                    Coach requests assessment.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm mb-1">Escalated 2 days ago</p>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">New</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="small">
                Review Evidence
              </Button>
              <Button variant="outline" size="small">
                Mark as Low Priority
              </Button>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">
            Previous
          </button>
          <div className="px-3 py-1 bg-gray-900 text-white rounded">1</div>
          <div className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">2</div>
          <button className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">
            Next
          </button>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 2: Evidence View with PT/AT Metrics
function EvidenceViewPTAT() {
  return (
    <WireframeScreen>
      <TopNav title="Evidence Review - PT/AT" />
      <div className="p-6">
        {/* Athlete Info Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-gray-900">Sarah Johnson</h3>
              <span className="px-2 py-0.5 bg-red-200 text-red-900 text-xs rounded">
                High Priority
              </span>
            </div>
            <p className="text-gray-500 text-sm">16 • Central HS • Coach: Mike Stevens</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Escalated 2 hours ago</p>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="bg-red-50 border-2 border-red-200 rounded p-4 mb-6">
          <p className="text-gray-900 mb-2">Coach Alert Summary</p>
          <p className="text-gray-700 text-sm">
            Significant knee valgus deviation detected over 3 consecutive sessions (Jan 1-3).
            Baseline: 12°, Current average: 18° (50% increase). Observed primarily during vault
            landings. Coach recommends PT assessment for potential intervention.
          </p>
        </div>

        {/* PT/AT Specific Metrics */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Biomechanical Analysis</h4>
          <MetricsRow
            metrics={[
              { label: 'Knee Valgus Angle', value: '18°' },
              { label: 'Q-Angle Deviation', value: '+6°' },
              { label: 'Landing Force (GRF)', value: '2.8x BW' },
              { label: 'Hip-Knee Alignment', value: 'Varus' },
            ]}
          />
        </div>

        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Range of Motion Assessment</h4>
          <MetricsRow
            metrics={[
              { label: 'Hip Flexion', value: '95°' },
              { label: 'Ankle Dorsiflexion', value: '12°' },
              { label: 'Knee Extension', value: '0°' },
              { label: 'Hip Abduction', value: '42°' },
            ]}
          />
        </div>

        {/* Video Evidence Carousel */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Video Evidence (3 clips)</h4>
          <div className="grid grid-cols-3 gap-4">
            <ClipCard
              athleteName="Vault Landing"
              timestamp="Jan 3, 2:34 PM"
              metric="Knee Valgus: 18°"
            />
            <ClipCard
              athleteName="Vault Landing"
              timestamp="Jan 2, 3:15 PM"
              metric="Knee Valgus: 19°"
            />
            <ClipCard
              athleteName="Vault Landing"
              timestamp="Jan 1, 2:50 PM"
              metric="Knee Valgus: 17°"
            />
          </div>
        </div>

        {/* Historical Trend */}
        <div className="border-2 border-gray-300 rounded p-4 mb-6">
          <p className="text-gray-900 mb-3">30-Day Trend Analysis</p>
          <div className="h-48 bg-gray-100 rounded flex items-end justify-around p-2 gap-1">
            {[30, 32, 28, 35, 40, 38, 45, 50, 48, 52, 55, 60, 58].map((height, index) => (
              <div
                key={index}
                className={`w-full rounded-t ${
                  index >= 10 ? 'bg-red-400' : index >= 7 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Week 1</span>
            <span>Week 4</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded" />
              <span className="text-gray-600">Normal Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded" />
              <span className="text-gray-600">Elevated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span className="text-gray-600">Alert Level</span>
            </div>
          </div>
        </div>

        {/* PT/AT Notes */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Assessment Notes</h4>
          <div className="border-2 border-gray-300 rounded">
            <div className="h-32 bg-gray-50 p-3 text-sm text-gray-400">
              Enter your clinical assessment and recommendations...
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Recommended Action Plan</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 border-2 border-gray-300 rounded p-3 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-gray-700">Schedule in-person assessment</span>
            </label>
            <label className="flex items-center gap-2 border-2 border-gray-300 rounded p-3 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-gray-700">Prescribe corrective exercises</span>
            </label>
            <label className="flex items-center gap-2 border-2 border-gray-300 rounded p-3 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-gray-700">Modify training volume</span>
            </label>
            <label className="flex items-center gap-2 border-2 border-gray-300 rounded p-3 cursor-pointer hover:bg-gray-50">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm text-gray-700">Refer to orthopedic specialist</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="primary" size="medium">
            Save Assessment
          </Button>
          <Button variant="outline" size="medium">
            Contact Coach
          </Button>
          <Button variant="outline" size="medium">
            Schedule Follow-up
          </Button>
          <Button variant="outline" size="medium">
            Mark as Resolved
          </Button>
        </div>
      </div>
    </WireframeScreen>
  );
}
