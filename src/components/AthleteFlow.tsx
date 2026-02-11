import {
  WireframeScreen,
  TopNav,
  TrendChart,
  ClipCard,
  Button,
} from './WireframeComponents';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export function AthleteFlow({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <AthleteProfilePersonal key="athlete-profile" />,
    <EvidenceClipHistory key="clip-history" />,
    <ClipConfirmation key="clip-confirmation" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Athlete Profile (Personal View)
function AthleteProfilePersonal() {
  return (
    <WireframeScreen>
      <TopNav title="My Profile" />
      <div className="p-6">
        {/* Athlete Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1">Sarah Johnson</h3>
            <p className="text-gray-500 text-sm">16 • Central HS • Level 9</p>
          </div>
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
        </div>

        {/* Status Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Your Status:</strong> Your coach is monitoring some movement patterns. Keep up
            the good work and focus on proper landing form during vault practice.
          </p>
        </div>

        {/* Personal Metrics Trends */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Your Performance Trends</h4>
          <div className="grid grid-cols-2 gap-4">
            <TrendChart title="Knee Alignment" />
            <TrendChart title="Landing Form" />
            <TrendChart title="Flexibility Score" />
            <TrendChart title="Jump Height" />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            {[
              { date: 'Today', activity: 'Practice session recorded', time: '2:30 PM' },
              { date: 'Yesterday', activity: 'Coach reviewed your vault form', time: '3:15 PM' },
              {
                date: '3 days ago',
                activity: 'New clips available for review',
                time: '4:00 PM',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border-2 border-gray-300 rounded p-3 flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
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
    </WireframeScreen>
  );
}

// Screen 2: Evidence Clip History
function EvidenceClipHistory() {
  return (
    <WireframeScreen>
      <TopNav title="My Clips" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Your Training Clips</h3>
          <p className="text-gray-500 text-sm">
            Review clips from your practice sessions and confirm your identity
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <div className="px-4 py-2 bg-gray-900 text-white rounded">All Clips</div>
          <div className="px-4 py-2 border-2 border-gray-300 rounded text-gray-700">
            Need Review
          </div>
          <div className="px-4 py-2 border-2 border-gray-300 rounded text-gray-700">
            Confirmed
          </div>
        </div>

        {/* Clips Grid */}
        <div className="grid grid-cols-3 gap-4">
          <ClipCard
            athleteName="Vault Landing"
            timestamp="Today, 2:34 PM"
            metric="Needs confirmation"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="small">
                  Review
                </Button>
              </div>
            }
          />
          <ClipCard
            athleteName="Floor Routine"
            timestamp="Today, 2:15 PM"
            metric="Confirmed ✓"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="small">
                  View
                </Button>
              </div>
            }
          />
          <ClipCard
            athleteName="Beam Practice"
            timestamp="Yesterday, 3:45 PM"
            metric="Confirmed ✓"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="small">
                  View
                </Button>
              </div>
            }
          />
          <ClipCard
            athleteName="Vault Landing"
            timestamp="2 days ago, 4:20 PM"
            metric="Needs confirmation"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="small">
                  Review
                </Button>
              </div>
            }
          />
          <ClipCard
            athleteName="Floor Tumbling"
            timestamp="3 days ago, 2:10 PM"
            metric="Confirmed ✓"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="small">
                  View
                </Button>
              </div>
            }
          />
          <ClipCard
            athleteName="Bars Dismount"
            timestamp="3 days ago, 1:55 PM"
            metric="Confirmed ✓"
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="small">
                  View
                </Button>
              </div>
            }
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">
            Previous
          </button>
          <div className="px-3 py-1 bg-gray-900 text-white rounded">1</div>
          <div className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">2</div>
          <div className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">3</div>
          <button className="px-3 py-1 border-2 border-gray-300 rounded text-gray-700">
            Next
          </button>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 3: Clip Confirmation
function ClipConfirmation() {
  return (
    <WireframeScreen>
      <TopNav title="Confirm Clip" />
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Is this you?</h3>
          <p className="text-gray-500 text-sm">
            Please confirm if this clip shows your performance
          </p>
        </div>

        {/* Video Clip */}
        <div className="mb-6">
          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-3">
            <div className="w-20 h-20 border-4 border-gray-400 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-10 border-t-transparent border-l-16 border-l-gray-400 border-b-10 border-b-transparent ml-1" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>Vault Landing • Jan 2, 2:34 PM</span>
            <span>0:08</span>
          </div>
        </div>

        {/* Clip Details */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded p-4 mb-6">
          <p className="text-gray-900 mb-2">Session Details</p>
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <strong>Date:</strong> January 2, 2026
            </p>
            <p>
              <strong>Time:</strong> 2:34 PM
            </p>
            <p>
              <strong>Event:</strong> Vault Landing
            </p>
            <p>
              <strong>Location:</strong> Main Gym
            </p>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-green-300 bg-green-50 rounded-lg hover:bg-green-100">
            <ThumbsUp className="w-6 h-6 text-green-700" />
            <div className="text-left">
              <p className="text-green-900">Yes, this is me</p>
              <p className="text-green-700 text-sm">Confirm identity</p>
            </div>
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-red-300 bg-red-50 rounded-lg hover:bg-red-100">
            <ThumbsDown className="w-6 h-6 text-red-700" />
            <div className="text-left">
              <p className="text-red-900">Not me</p>
              <p className="text-red-700 text-sm">Report mismatch</p>
            </div>
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded p-3 text-sm text-gray-700">
          <p>
            <strong>Privacy:</strong> Your confirmation helps ensure accurate tracking. Clips are
            only shared with your coach and authorized staff.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" size="medium">
            Back to Clips
          </Button>
          <p className="text-gray-500 text-sm self-center">3 clips remaining to review</p>
        </div>
      </div>
    </WireframeScreen>
  );
}
