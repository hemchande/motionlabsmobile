import {
  WireframeScreen,
  TopNav,
  AthleteCard,
  AlertBanner,
  MetricsRow,
  TrendChart,
  ClipCard,
  ActionButtonGroup,
  FormField,
  SummaryTile,
  ScatterPlot,
  Button,
} from './WireframeComponents';
import { Upload, Plus, Play, Settings, Download } from 'lucide-react';

export function CoachFlow({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <LoginScreen key="login" />,
    <TeamOnboardingRoster key="onboarding-roster" />,
    <TeamOnboardingSchedule key="onboarding-schedule" />,
    <AthleteRosterList key="roster-list" />,
    <AthleteProfileCoach key="athlete-profile" />,
    <RecordUploadVideo key="record-upload" />,
    <LiveRecordingView key="live-recording" />,
    <AlertBannerNotification key="alert-notification" />,
    <EvidenceCarousel key="evidence-carousel" />,
    <TeamDashboard key="team-dashboard" />,
    <SettingsRosterAdmin key="settings" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Login / Organization Select
function LoginScreen() {
  return (
    <WireframeScreen>
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2">MotionLabs AI Pilot</h2>
            <p className="text-gray-500">Sign in to continue</p>
          </div>

          <FormField label="Email" placeholder="coach@example.com" />
          <FormField label="Password" type="password" placeholder="••••••••" />

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Organization</label>
            <div className="w-full h-10 border-2 border-gray-300 rounded bg-gray-50 flex items-center justify-between px-3">
              <span className="text-gray-400 text-sm">Select your organization</span>
              <div className="text-gray-400">▼</div>
            </div>
          </div>

          <Button variant="primary" size="large">
            Sign In
          </Button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Don't have an account? Contact admin
          </p>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 2: Team Onboarding - Roster Setup
function TeamOnboardingRoster() {
  return (
    <WireframeScreen>
      <TopNav title="Team Onboarding - Phase 1" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Step 1: Roster Setup</h3>
          <p className="text-gray-500 text-sm">Add your athletes and their information</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-2 bg-gray-900 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded" />
        </div>

        {/* Upload Option */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-gray-400 cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 mb-1">Upload Roster CSV</p>
          <p className="text-gray-500 text-sm">or drag and drop file here</p>
        </div>

        <div className="text-center text-gray-500 mb-6">OR</div>

        {/* Manual Entry */}
        <div className="border-2 border-gray-300 rounded-lg p-6 mb-6">
          <p className="text-gray-900 mb-4">Add Athlete Manually</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" placeholder="Enter first name" />
            <FormField label="Last Name" placeholder="Enter last name" />
            <FormField label="Age" placeholder="Age" />
            <FormField label="School/Team" placeholder="School name" />
            <FormField label="Experience Level" />
            <FormField label="Medical History" />
          </div>
          <Button variant="outline" size="medium">
            <Plus className="w-4 h-4 inline mr-2" />
            Add Athlete
          </Button>
        </div>

        {/* Added Athletes Preview */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3">Added Athletes (3)</p>
          <div className="space-y-2">
            {['Sarah Johnson, 16', 'Emily Davis, 15', 'Mike Chen, 17'].map((name, i) => (
              <div key={i} className="flex items-center justify-between border-2 border-gray-300 rounded p-3">
                <span className="text-gray-900">{name}</span>
                <button className="text-gray-500 hover:text-gray-700">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" size="medium">
            Cancel
          </Button>
          <Button variant="primary" size="medium">
            Next: Practice Schedule
          </Button>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 3: Team Onboarding - Practice Schedule
function TeamOnboardingSchedule() {
  return (
    <WireframeScreen>
      <TopNav title="Team Onboarding - Phase 1" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Step 2: Practice Schedule</h3>
          <p className="text-gray-500 text-sm">Upload or manually enter your practice schedule</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-2 bg-gray-900 rounded" />
          <div className="flex-1 h-2 bg-gray-900 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded" />
        </div>

        {/* Calendar Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-gray-400 cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-900 mb-1">Upload Calendar File</p>
          <p className="text-gray-500 text-sm">iCal, CSV, or Google Calendar export</p>
        </div>

        <div className="text-center text-gray-500 mb-6">OR</div>

        {/* Manual Schedule Entry */}
        <div className="border-2 border-gray-300 rounded-lg p-6 mb-6">
          <p className="text-gray-900 mb-4">Add Practice Session</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Day of Week" />
            <FormField label="Time" placeholder="3:00 PM - 5:00 PM" />
            <FormField label="Location" placeholder="Main Gym" />
            <FormField label="Session Type" placeholder="Training, Competition, etc." />
          </div>
          <Button variant="outline" size="medium">
            <Plus className="w-4 h-4 inline mr-2" />
            Add Session
          </Button>
        </div>

        {/* Weekly Schedule Preview */}
        <div className="border-2 border-gray-300 rounded p-4 mb-6">
          <p className="text-gray-700 mb-3">Weekly Schedule Preview</p>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-2 border border-gray-300 rounded">
                <p className="text-xs text-gray-500 mb-1">{day}</p>
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" size="medium">
            Back
          </Button>
          <Button variant="primary" size="medium">
            Complete Setup
          </Button>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 4: Athlete Roster List
function AthleteRosterList() {
  return (
    <WireframeScreen>
      <TopNav
        title="Team Roster"
        actions={
          <>
            <Button variant="outline" size="small">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="small">
              <Settings className="w-4 h-4" />
            </Button>
          </>
        }
      />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900 mb-1">Athletes</h3>
            <p className="text-gray-500 text-sm">12 total athletes</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 border-2 border-gray-300 rounded text-sm">
              All
            </div>
            <div className="px-3 py-1.5 border-2 border-gray-300 rounded text-sm">
              Alert
            </div>
            <div className="px-3 py-1.5 border-2 border-gray-300 rounded text-sm">
              Monitor
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AthleteCard name="Sarah Johnson" age="16" school="Central HS" status="alert" />
          <AthleteCard name="Emily Davis" age="15" school="West Side Academy" status="green" />
          <AthleteCard name="Mike Chen" age="17" school="Central HS" status="monitor" />
          <AthleteCard name="Jessica Lee" age="16" school="East Valley HS" status="green" />
          <AthleteCard name="Tom Rodriguez" age="15" school="Central HS" status="green" />
          <AthleteCard name="Anna Martinez" age="16" school="West Side Academy" status="alert" />
          <AthleteCard name="Chris Park" age="17" school="Central HS" status="green" />
          <AthleteCard name="Lily Wang" age="15" school="East Valley HS" status="monitor" />
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 5: Athlete Profile (Coach View)
function AthleteProfileCoach() {
  return (
    <WireframeScreen>
      <TopNav title="Athlete Profile" />
      <div className="p-6">
        {/* Athlete Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1">Sarah Johnson</h3>
            <p className="text-gray-500 text-sm">16 • Central HS • Level 9</p>
          </div>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>

        {/* Summary Blurb */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Summary:</strong> Sarah has shown increased knee valgus deviation over the past 2
            weeks, particularly on vault landings. Consider form review or workload adjustment.
          </p>
        </div>

        {/* Key Metrics Trends */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Trends Over Time</h4>
          <div className="grid grid-cols-2 gap-4">
            <TrendChart title="Knee Valgus Angle" />
            <TrendChart title="Landing Knee Bend" />
            <TrendChart title="Hip Flexion Range" />
            <TrendChart title="Jump Height" />
          </div>
        </div>

        {/* Alert History */}
        <div>
          <h4 className="text-gray-900 mb-4">Alert History</h4>
          <div className="space-y-3">
            {[
              { date: '2 days ago', type: 'warning', message: 'Knee valgus deviation detected - Vault' },
              { date: '5 days ago', type: 'info', message: 'Landing form improvement noted' },
              { date: '1 week ago', type: 'warning', message: 'Reduced hip flexion - Floor routine' },
            ].map((alert, i) => (
              <div key={i} className="border-2 border-gray-300 rounded p-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
                <div className="flex-1">
                  <p className="text-gray-900 text-sm mb-1">{alert.message}</p>
                  <p className="text-gray-500 text-xs">{alert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 6: Record / Upload Video
function RecordUploadVideo() {
  return (
    <WireframeScreen>
      <TopNav title="Record Session - Phase 2" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Add Video</h3>
          <p className="text-gray-500 text-sm">Record a live session or upload past footage</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Upload Past Videos */}
          <div className="border-2 border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Upload Past Videos</p>
            <p className="text-gray-500 text-sm">Drag and drop or browse files</p>
            <p className="text-gray-400 text-xs mt-2">MP4, MOV, AVI up to 500MB</p>
          </div>

          {/* Record Live Session */}
          <div className="border-2 border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer bg-gray-50">
            <Play className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Record Live Session</p>
            <p className="text-gray-500 text-sm">Start recording with camera</p>
            <div className="mt-4">
              <Button variant="primary" size="medium">
                Start Recording
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Uploads</h4>
          <div className="space-y-3">
            {[
              { name: 'Practice_Session_Jan_2.mp4', date: '2 days ago', status: 'Processing' },
              { name: 'Vault_Training_Dec_28.mov', date: '1 week ago', status: 'Complete' },
              { name: 'Floor_Routine_Dec_20.mp4', date: '2 weeks ago', status: 'Complete' },
            ].map((video, i) => (
              <div key={i} className="border-2 border-gray-300 rounded p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded" />
                  <div>
                    <p className="text-gray-900 text-sm">{video.name}</p>
                    <p className="text-gray-500 text-xs">{video.date}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700">
                  {video.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 7: Live Recording View
function LiveRecordingView() {
  return (
    <WireframeScreen>
      <TopNav title="Live Recording" />
      <div className="p-6">
        {/* Video Player */}
        <div className="mb-6">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-3">
            <div className="text-center">
              <div className="w-24 h-24 border-8 border-white rounded-full flex items-center justify-center mb-4 mx-auto">
                <div className="w-8 h-8 bg-red-500 rounded" />
              </div>
              <p className="text-white">Recording: 02:34</p>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            <button className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-gray-600 rounded" />
            </button>
            <button className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full" />
            </button>
            <button className="w-12 h-12 bg-gray-200 rounded-full" />
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-3">Real-time Metrics</h4>
          <MetricsRow
            metrics={[
              { label: 'Knee Valgus', value: '12°' },
              { label: 'Landing Knee Bend', value: '45°' },
              { label: 'Hip Flexion', value: '82°' },
              { label: 'Height Off Surface', value: '24"' },
            ]}
          />
        </div>

        {/* Active Athletes */}
        <div>
          <h4 className="text-gray-900 mb-3">Athletes in Frame (3)</h4>
          <div className="flex gap-3">
            {['Sarah J.', 'Emily D.', 'Mike C.'].map((name, i) => (
              <div key={i} className="border-2 border-gray-300 rounded px-4 py-2 text-sm">
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 8: Alert Banner Notification
function AlertBannerNotification() {
  return (
    <WireframeScreen>
      <TopNav title="Team Dashboard" />
      <div className="p-6">
        {/* Alert Banner */}
        <div className="mb-6">
          <AlertBanner
            type="warning"
            message="Sarah Johnson showing deviation in Knee Valgus movement - Vault landing at 2:34 PM"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6">
          <p className="text-gray-900 mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="medium">
              View Evidence
            </Button>
            <Button variant="outline" size="medium">
              View Athlete Profile
            </Button>
            <Button variant="outline" size="medium">
              Mark as Reviewed
            </Button>
            <Button variant="primary" size="medium">
              Escalate to PT/AT
            </Button>
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Alerts (Today)</h4>
          <div className="space-y-3">
            {[
              {
                athlete: 'Sarah Johnson',
                time: '2:34 PM',
                metric: 'Knee Valgus',
                status: 'New',
              },
              {
                athlete: 'Anna Martinez',
                time: '1:15 PM',
                metric: 'Landing Form',
                status: 'Reviewed',
              },
              {
                athlete: 'Lily Wang',
                time: '12:45 PM',
                metric: 'Hip Flexion',
                status: 'Monitoring',
              },
            ].map((alert, i) => (
              <div
                key={i}
                className="border-2 border-gray-300 rounded p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-900 mb-1">{alert.athlete}</p>
                  <p className="text-gray-500 text-sm">
                    {alert.metric} • {alert.time}
                  </p>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded text-sm">{alert.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 9: Evidence Carousel
function EvidenceCarousel() {
  return (
    <WireframeScreen>
      <TopNav title="Evidence Review" />
      <div className="p-6">
        {/* Athlete Info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1">Sarah Johnson</h3>
            <p className="text-gray-500 text-sm">Vault Landing • Jan 2, 2:34 PM</p>
          </div>
        </div>

        {/* Clip Carousel */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button className="w-10 h-10 border-2 border-gray-300 rounded-full flex items-center justify-center">
              ←
            </button>
            <div className="flex-1">
              <ClipCard
                athleteName="Sarah Johnson"
                timestamp="Jan 2, 2:34 PM"
                metric="Knee Valgus: 18° (↑ from baseline 12°)"
              />
            </div>
            <button className="w-10 h-10 border-2 border-gray-300 rounded-full flex items-center justify-center">
              →
            </button>
          </div>
          <p className="text-center text-gray-500 text-sm">Clip 1 of 3</p>
        </div>

        {/* Textual Evidence */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded p-4 mb-6">
          <p className="text-gray-900 mb-2">AI Analysis</p>
          <p className="text-gray-700 text-sm leading-relaxed">
            Analysis shows a 50% increase in knee valgus angle compared to athlete's baseline (12°).
            This deviation was observed across 3 consecutive vault landings between 2:30-2:40 PM.
            Recommend form assessment and potential workload review.
          </p>
        </div>

        {/* Action Buttons */}
        <div>
          <p className="text-gray-900 mb-3">Take Action</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="medium">
              Monitor
            </Button>
            <Button variant="outline" size="medium">
              Make a Change
            </Button>
            <Button variant="outline" size="medium">
              Escalate
            </Button>
            <Button variant="primary" size="medium">
              Push to PT/AT
            </Button>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 10: Team Dashboard
function TeamDashboard() {
  return (
    <WireframeScreen>
      <TopNav
        title="Team Dashboard"
        actions={
          <Button variant="outline" size="small">
            <Download className="w-4 h-4" />
          </Button>
        }
      />
      <div className="p-6">
        {/* Summary Tiles */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryTile title="Alert Level" count={2} color="red" />
          <SummaryTile title="Monitoring" count={3} color="yellow" />
          <SummaryTile title="All Clear" count={7} color="green" />
        </div>

        {/* Scatter Plot */}
        <div className="mb-6">
          <ScatterPlot />
        </div>

        {/* Team Trends */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Team Trends Over Time</h4>
          <div className="grid grid-cols-2 gap-4">
            <TrendChart title="Average Knee Valgus" />
            <TrendChart title="Average Landing Quality" />
          </div>
        </div>

        {/* Athletes Requiring Attention */}
        <div>
          <h4 className="text-gray-900 mb-4">Requires Attention (2)</h4>
          <div className="space-y-3">
            <div className="border-2 border-red-200 bg-red-50 rounded p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div>
                  <p className="text-gray-900">Sarah Johnson</p>
                  <p className="text-gray-600 text-sm">Knee valgus deviation - 3 alerts today</p>
                </div>
              </div>
              <Button variant="outline" size="small">
                Review
              </Button>
            </div>
            <div className="border-2 border-red-200 bg-red-50 rounded p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div>
                  <p className="text-gray-900">Anna Martinez</p>
                  <p className="text-gray-600 text-sm">Landing form - 2 alerts this week</p>
                </div>
              </div>
              <Button variant="outline" size="small">
                Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 11: Settings / Roster Admin
function SettingsRosterAdmin() {
  return (
    <WireframeScreen>
      <TopNav title="Settings" />
      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 border-r-2 border-gray-200 pr-6">
            <div className="space-y-2">
              <div className="px-3 py-2 bg-gray-100 rounded text-gray-900">Roster Admin</div>
              <div className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
                Team Settings
              </div>
              <div className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
                Notifications
              </div>
              <div className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
                Account
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <h3 className="text-gray-900 mb-6">Roster Administration</h3>

            {/* Bulk Actions */}
            <div className="mb-6">
              <p className="text-gray-700 mb-3">Bulk Actions</p>
              <div className="flex gap-3">
                <Button variant="outline" size="medium">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Update Roster CSV
                </Button>
                <Button variant="outline" size="medium">
                  <Download className="w-4 h-4 inline mr-2" />
                  Export Roster
                </Button>
              </div>
            </div>

            {/* Individual Athletes */}
            <div className="mb-6">
              <p className="text-gray-700 mb-3">Manage Athletes (12)</p>
              <div className="space-y-2">
                {[
                  { name: 'Sarah Johnson', status: 'Active' },
                  { name: 'Emily Davis', status: 'Active' },
                  { name: 'Mike Chen', status: 'Active' },
                  { name: 'Jessica Lee (Graduated)', status: 'Archived' },
                ].map((athlete, i) => (
                  <div
                    key={i}
                    className="border-2 border-gray-300 rounded p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div>
                        <p className="text-gray-900">{athlete.name}</p>
                        <p className="text-gray-500 text-sm">{athlete.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="small">
                        Edit
                      </Button>
                      {athlete.status === 'Active' && (
                        <Button variant="outline" size="small">
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Athlete */}
            <Button variant="primary" size="medium">
              <Plus className="w-4 h-4 inline mr-2" />
              Add New Athlete
            </Button>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}
