import {
  WireframeScreen,
  TopNavEnhanced,
  TrendChartEnhanced,
  ClipCardEvidence,
  MandatoryFooter,
  ButtonEnhanced,
} from './EnhancedComponents';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

export function AthleteFlowEnhanced({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <AthleteProfilePersonalEnhanced key="athlete-profile" />,
    <EvidenceClipHistoryEnhanced key="clip-history" />,
    <ClipConfirmationEnhanced key="clip-confirmation" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Athlete Profile (Personal View)
function AthleteProfilePersonalEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Read-only athlete view of their own performance data and trends',
        kpis: [
          'Profile view frequency',
          'Engagement with trends',
          'Ask coach usage',
          'Time spent on profile',
          'Trend chart views per visit',
          'Recent activity scroll depth',
          'Metric tooltip interactions',
          'Session to profile view lag (how quickly they check after practice)',
          'Return visit rate (daily/weekly)',
          'Mobile vs desktop usage',
          'Profile section completion (which areas viewed)',
          'Question formulation rate (typed but not sent)',
          'Self-assessment accuracy (comparing self-perception to metrics)'
        ],
        dependencies: ['Athlete metrics DB', 'Activity log', 'Clip library access', 'Engagement tracking', 'Coach messaging system']
      }}
    >
      <TopNavEnhanced title="My Profile" orgName="Central High Gymnastics" />
      <div className="p-6">
        {/* Athlete Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-gray-900">Sarah Johnson</h3>
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
            </div>
            <p className="text-gray-600 text-sm mb-2">16 • Central HS • Level 9 • Vault/Floor Specialist</p>
            <p className="text-gray-500 text-xs">Last session: Today, 3:00 PM</p>
          </div>
        </div>

        {/* Status Summary (Simplified for Athlete) */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <p className="text-gray-900 text-sm mb-1"><strong>Your Status:</strong></p>
          <p className="text-gray-700 text-sm">
            Your coach is monitoring some movement patterns in your vault landings. Keep up the good work 
            and focus on proper form. If you have questions, use the "Ask Coach" button below.
          </p>
        </div>

        {/* Ask Coach CTA */}
        <div className="mb-6">
          <ButtonEnhanced variant="outline" size="medium">
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Ask Coach a Question
          </ButtonEnhanced>
        </div>

        {/* Personal Metrics Trends (Simplified) */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Your Performance Trends</h4>
          <div className="grid grid-cols-2 gap-4">
            <TrendChartEnhanced 
              title="Knee Alignment" 
              data={[45, 48, 50, 55, 60, 70, 75]}
              baseline={50}
            />
            <TrendChartEnhanced 
              title="Landing Form" 
              data={[60, 58, 62, 60, 55, 52, 50]}
              baseline={60}
            />
            <TrendChartEnhanced 
              title="Flexibility Score" 
              data={[50, 52, 48, 50, 48, 45, 42]}
              baseline={50}
            />
            <TrendChartEnhanced 
              title="Jump Height" 
              data={[50, 52, 55, 58, 60, 58, 55]}
              baseline={50}
            />
          </div>
          <p className="text-gray-500 text-xs mt-3 italic">
            Note: These metrics show your movement patterns over time. They do not indicate injury or medical conditions.
          </p>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            {[
              { date: 'Today', activity: 'Practice session recorded', time: '3:00 PM', icon: '📹' },
              { date: 'Today', activity: '3 new clips available for review', time: '3:45 PM', icon: '🎬' },
              { date: 'Yesterday', activity: 'Coach reviewed your vault form', time: '2:15 PM', icon: '👀' },
              { date: '3 days ago', activity: 'Confirmed clips from practice', time: '4:00 PM', icon: '✓' },
            ].map((item, i) => (
              <div
                key={i}
                className="border-2 border-gray-300 rounded-lg p-4 flex items-start gap-3 bg-white hover:border-gray-400 cursor-pointer transition-colors"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm mb-1">{item.activity}</p>
                  <p className="text-gray-500 text-xs">
                    {item.date} • {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}

// Screen 2: Evidence Clip History
function EvidenceClipHistoryEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Athlete clip library with "Is this me?" validation workflow',
        kpis: ['Clip confirmation rate', 'Time to confirm', 'Mismatch reports'],
        dependencies: ['Clip library', 'Athlete ID validation', 'Coach notification on mismatch']
      }}
    >
      <TopNavEnhanced title="My Clips" orgName="Central High Gymnastics" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Your Training Clips</h3>
          <p className="text-gray-600 text-sm">
            Review clips from your practice sessions and confirm your identity
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
            All Clips
          </button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
            Need Review
            <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">3</span>
          </button>
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
            Confirmed
          </button>
        </div>

        {/* Clips Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { event: 'Vault Landing', time: 'Today, 2:34 PM', status: 'needs-review' },
            { event: 'Vault Approach', time: 'Today, 2:28 PM', status: 'needs-review' },
            { event: 'Floor Routine', time: 'Today, 2:15 PM', status: 'confirmed' },
            { event: 'Beam Dismount', time: 'Yesterday, 3:45 PM', status: 'confirmed' },
            { event: 'Vault Landing', time: '2 days ago, 4:20 PM', status: 'needs-review' },
            { event: 'Floor Tumbling', time: '3 days ago, 2:10 PM', status: 'confirmed' },
          ].map((clip, i) => (
            <div key={i} className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                <div className="w-16 h-16 border-4 border-gray-400 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-400 border-b-8 border-b-transparent ml-1" />
                </div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  0:08
                </div>
                {clip.status === 'needs-review' && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Needs Review
                  </div>
                )}
                {clip.status === 'confirmed' && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    ✓ Confirmed
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-gray-900 text-sm mb-1">{clip.event}</p>
                <p className="text-gray-500 text-xs mb-3">{clip.time}</p>
                {clip.status === 'needs-review' ? (
                  <ButtonEnhanced variant="primary" size="small">
                    Review & Confirm
                  </ButtonEnhanced>
                ) : (
                  <ButtonEnhanced variant="outline" size="small">
                    View Clip
                  </ButtonEnhanced>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Callout */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <p className="text-blue-900 text-sm mb-1"><strong>Why confirm clips?</strong></p>
          <p className="text-blue-800 text-xs">
            Confirming your clips helps ensure accurate tracking of your movement patterns. If a clip isn't you, 
            please report it so we can improve our athlete identification system.
          </p>
        </div>
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}

// Screen 3: Clip Confirmation - "Is this me?"
function ClipConfirmationEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'QA validation workflow - athlete confirms or rejects clip identity',
        kpis: ['Confirmation rate', 'Rejection rate', 'Time to confirm', 'False positive rate'],
        dependencies: ['Clip player', 'Validation logging', 'Coach notification on rejection']
      }}
    >
      <TopNavEnhanced title="Confirm Clip" orgName="Central High Gymnastics" />
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Is this you?</h3>
          <p className="text-gray-600 text-sm">
            Please confirm if this clip shows your performance
          </p>
        </div>

        {/* Video Clip Player */}
        <div className="mb-6">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative border-4 border-gray-700 shadow-lg">
            {/* Play button */}
            <div className="w-24 h-24 border-4 border-white rounded-full flex items-center justify-center bg-black bg-opacity-50 cursor-pointer hover:scale-110 transition-transform">
              <div className="w-0 h-0 border-t-12 border-t-transparent border-l-16 border-l-white border-b-12 border-b-transparent ml-2" />
            </div>

            {/* Video info overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black bg-opacity-60 rounded px-3 py-2">
              <span className="text-white text-sm">Vault Landing • Jan 2, 2:34 PM</span>
              <span className="text-white text-sm">0:08</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <span className="text-gray-600">⏮</span>
            </button>
            <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md">
              <span className="text-white text-xl">▶</span>
            </button>
            <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <span className="text-gray-600">⏭</span>
            </button>
          </div>
        </div>

        {/* Clip Details */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-6">
          <p className="text-gray-900 text-sm mb-3"><strong>Session Details</strong></p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">January 2, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="text-gray-900">2:34 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="text-gray-900">Vault Landing</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="text-gray-900">Main Gym</span>
            </div>
          </div>
        </div>

        {/* Confirmation Buttons - Prominent */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="flex items-center justify-center gap-3 px-6 py-6 border-2 border-green-400 bg-green-50 rounded-lg hover:bg-green-100 hover:border-green-500 transition-colors">
            <ThumbsUp className="w-8 h-8 text-green-700 flex-shrink-0" />
            <div className="text-left">
              <p className="text-green-900 mb-1">Yes, this is me</p>
              <p className="text-green-700 text-sm">Confirm identity</p>
            </div>
          </button>
          <button className="flex items-center justify-center gap-3 px-6 py-6 border-2 border-red-400 bg-red-50 rounded-lg hover:bg-red-100 hover:border-red-500 transition-colors">
            <ThumbsDown className="w-8 h-8 text-red-700 flex-shrink-0" />
            <div className="text-left">
              <p className="text-red-900 mb-1">Not me</p>
              <p className="text-red-700 text-sm">Report mismatch</p>
            </div>
          </button>
        </div>

        {/* Privacy & Info Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-900 text-sm mb-2"><strong>Privacy & Accuracy:</strong></p>
          <p className="text-blue-800 text-xs leading-relaxed">
            Your confirmation helps ensure accurate tracking of your movement patterns. Clips are only 
            shared with your coach and authorized athletic training staff. If you mark "Not me," your 
            coach will be notified to review the athlete identification.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <ButtonEnhanced variant="outline" size="medium">
            ← Back to Clips
          </ButtonEnhanced>
          <p className="text-gray-600 text-sm">3 clips remaining to review</p>
          <ButtonEnhanced variant="outline" size="medium">
            Skip for Now
          </ButtonEnhanced>
        </div>
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}