import {
  WireframeScreen,
  TopNavEnhanced,
  TrendChartEnhanced,
  ButtonEnhanced,
  FormFieldEnhanced,
} from './EnhancedComponents';
import { Upload, Plus, Download, Settings } from 'lucide-react';

// Screen 10: Team Dashboard
export function TeamDashboardEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Team-level overview with summary stats, trends, and at-risk athletes',
        kpis: ['Dashboard visit frequency', 'Alert response time', 'Export usage'],
        dependencies: ['Aggregate metrics', 'Team-wide baselines', 'Scatter plot data', 'Alert prioritization']
      }}
    >
      <TopNavEnhanced 
        title="Team Dashboard" 
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <ButtonEnhanced variant="outline" size="small">
            <Download className="w-4 h-4 inline mr-1" /> Export Report
          </ButtonEnhanced>
        }
      />
      <div className="p-6">
        {/* Summary Tiles */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Total Athletes</p>
            <p className="text-3xl text-gray-900 mb-2">12</p>
            <p className="text-xs text-gray-600">Active roster</p>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 text-sm mb-1">Alert Level</p>
            <p className="text-3xl text-red-700 mb-2">2</p>
            <p className="text-xs text-red-600">↑ +1 this week</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-700 text-sm mb-1">Monitoring</p>
            <p className="text-3xl text-yellow-700 mb-2">3</p>
            <p className="text-xs text-yellow-600">No change</p>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <p className="text-green-700 text-sm mb-1">All Clear</p>
            <p className="text-3xl text-green-700 mb-2">7</p>
            <p className="text-xs text-green-600">↓ -1 this week</p>
          </div>
        </div>

        {/* Scatter Plot - Athlete Deviation Comparison */}
        <div className="mb-6">
          <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-900 mb-1">Athlete Deviation from Baseline</p>
                <p className="text-gray-600 text-sm">Normalized comparison across all athletes</p>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <span className="text-gray-600">Alert</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <span className="text-gray-600">Monitor</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="text-gray-600">Normal</span>
                </div>
              </div>
            </div>
            
            <div className="h-80 bg-gray-50 rounded-lg relative flex items-center justify-center border-2 border-gray-200">
              {/* Y-axis */}
              <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-400" />
              <div className="absolute left-2 top-4 text-xs text-gray-600 -rotate-90 origin-left">
                Deviation %
              </div>
              
              {/* X-axis */}
              <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-400" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-600">
                Athletes (sorted by deviation)
              </div>

              {/* Baseline line */}
              <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-blue-400" />

              {/* Data points */}
              {[
                { x: 10, y: 70, color: 'bg-red-400', label: 'Sarah J.' },
                { x: 18, y: 65, color: 'bg-red-400', label: 'Anna M.' },
                { x: 28, y: 58, color: 'bg-yellow-400', label: 'Mike C.' },
                { x: 38, y: 54, color: 'bg-yellow-400', label: 'Lily W.' },
                { x: 48, y: 52, color: 'bg-yellow-400', label: 'Tom R.' },
                { x: 58, y: 48, color: 'bg-green-400', label: 'Emily D.' },
                { x: 68, y: 45, color: 'bg-green-400', label: 'Jessica L.' },
                { x: 78, y: 42, color: 'bg-green-400', label: 'Chris P.' },
                { x: 88, y: 40, color: 'bg-green-400', label: 'David K.' },
              ].map((point, i) => (
                <div
                  key={i}
                  className={`absolute w-4 h-4 ${point.color} rounded-full cursor-pointer hover:scale-125 transition-transform`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  title={point.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Team Trends Over Time */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Team-Wide Trends (30 Days)</h4>
          <div className="grid grid-cols-2 gap-4">
            <TrendChartEnhanced 
              title="Average Knee Valgus Angle" 
              data={[48, 50, 52, 54, 58, 60, 62]}
              baseline={50}
            />
            <TrendChartEnhanced 
              title="Average Landing Quality Score" 
              data={[60, 58, 55, 52, 50, 48, 45]}
              baseline={55}
            />
            <TrendChartEnhanced 
              title="Average Hip Flexion Range" 
              data={[52, 50, 48, 46, 45, 44, 42]}
              baseline={50}
            />
            <TrendChartEnhanced 
              title="Team Training Load Index" 
              data={[40, 45, 52, 58, 62, 65, 68]}
              baseline={50}
            />
          </div>
        </div>

        {/* Athletes Requiring Attention */}
        <div>
          <h4 className="text-gray-900 mb-4">Athletes Requiring Attention (2)</h4>
          <div className="space-y-3">
            <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">Sarah Johnson</p>
                    <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded">
                      High Priority
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-1">
                    Knee valgus deviation - 3 alerts in 3 days
                  </p>
                  <p className="text-gray-600 text-xs">
                    Last action: Monitoring (2 days ago) • Status: Worsening
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <ButtonEnhanced variant="outline" size="small">
                  View Profile
                </ButtonEnhanced>
                <ButtonEnhanced variant="danger" size="small">
                  Take Action
                </ButtonEnhanced>
              </div>
            </div>

            <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-900">Anna Martinez</p>
                    <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
                      Medium Priority
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-1">
                    Landing form inconsistency - 2 alerts this week
                  </p>
                  <p className="text-gray-600 text-xs">
                    Last action: Form review scheduled • Status: Unchanged
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <ButtonEnhanced variant="outline" size="small">
                  View Profile
                </ButtonEnhanced>
                <ButtonEnhanced variant="primary" size="small">
                  Review
                </ButtonEnhanced>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 11: Settings / Roster Admin
export function SettingsRosterAdminEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Roster management, compliance settings, and data retention controls',
        kpis: ['Roster update frequency', 'Archive actions', 'Settings changes'],
        dependencies: ['Roster DB', 'File upload', 'Compliance settings', 'Data retention policies']
      }}
    >
      <TopNavEnhanced 
        title="Settings" 
        role="Head Coach"
        orgName="Central High Gymnastics"
      />
      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r-2 border-gray-200 pr-6">
            <div className="space-y-2">
              <div className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm cursor-pointer">
                Roster Admin
              </div>
              <div className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm cursor-pointer">
                Team Settings
              </div>
              <div className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm cursor-pointer">
                Notifications
              </div>
              <div className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm cursor-pointer">
                Alert Thresholds
              </div>
              <div className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm cursor-pointer">
                Compliance & Privacy
              </div>
              <div className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm cursor-pointer">
                Account
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <h3 className="text-gray-900 mb-6">Roster Administration</h3>

            {/* Bulk Actions */}
            <div className="mb-8">
              <p className="text-gray-700 text-sm mb-4">Bulk Actions</p>
              <div className="flex gap-3">
                <ButtonEnhanced variant="outline" size="medium">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Update Roster CSV
                </ButtonEnhanced>
                <ButtonEnhanced variant="outline" size="medium">
                  <Download className="w-4 h-4 inline mr-2" />
                  Export Roster
                </ButtonEnhanced>
                <ButtonEnhanced variant="outline" size="medium">
                  <Download className="w-4 h-4 inline mr-2" />
                  Export All Data
                </ButtonEnhanced>
              </div>
            </div>

            {/* Individual Athletes Management */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-700 text-sm">Manage Athletes (12 active, 3 archived)</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm">
                    Active
                  </button>
                  <button className="px-3 py-1.5 border-2 border-gray-300 rounded text-sm text-gray-700">
                    Archived
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {[
                  { name: 'Sarah Johnson', age: '16', event: 'Vault/Floor', status: 'Active' },
                  { name: 'Emily Davis', age: '15', event: 'Bars/Beam', status: 'Active' },
                  { name: 'Mike Chen', age: '17', event: 'All-Around', status: 'Active' },
                  { name: 'Jessica Lee', age: '16', event: 'Floor', status: 'Active' },
                ].map((athlete, i) => (
                  <div
                    key={i}
                    className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div>
                        <p className="text-gray-900 text-sm">{athlete.name}</p>
                        <p className="text-gray-600 text-xs">
                          {athlete.age} • {athlete.event} • {athlete.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ButtonEnhanced variant="outline" size="small">
                        Edit
                      </ButtonEnhanced>
                      <ButtonEnhanced variant="outline" size="small">
                        Archive
                      </ButtonEnhanced>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Athlete */}
            <div className="mb-8">
              <ButtonEnhanced variant="primary" size="medium">
                <Plus className="w-4 h-4 inline mr-2" />
                Add New Athlete
              </ButtonEnhanced>
            </div>

            {/* Compliance & Data Retention */}
            <div className="border-t-2 border-gray-200 pt-8">
              <h4 className="text-gray-900 mb-4">Compliance & Data Retention</h4>
              
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
                <p className="text-blue-900 text-sm mb-2"><strong>Mandatory Compliance:</strong></p>
                <ul className="text-blue-800 text-xs space-y-1">
                  <li>• All athlete data requires parental/guardian consent for minors</li>
                  <li>• Video footage stored for max 90 days (configurable)</li>
                  <li>• No medical diagnosis or injury prediction claims</li>
                  <li>• Data export available on request</li>
                </ul>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 mt-0.5" defaultChecked />
                  <div>
                    <p className="text-gray-900 text-sm mb-1">
                      Require parental consent for all athletes under 18
                    </p>
                    <p className="text-gray-600 text-xs">
                      Blocks data collection until consent form signed
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 mt-0.5" defaultChecked />
                  <div>
                    <p className="text-gray-900 text-sm mb-1">
                      Auto-archive graduated athletes after 30 days
                    </p>
                    <p className="text-gray-600 text-xs">
                      Moves to archive; data retained per policy
                    </p>
                  </div>
                </label>

                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                  <p className="text-gray-700 text-sm mb-3">Video Retention Period</p>
                  <div className="flex gap-4">
                    {['30 days', '60 days', '90 days', 'Custom'].map((option, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="retention" 
                          className="w-4 h-4" 
                          defaultChecked={i === 2}
                        />
                        <span className="text-gray-700 text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <ButtonEnhanced variant="primary" size="medium">
                  Save Settings
                </ButtonEnhanced>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}
