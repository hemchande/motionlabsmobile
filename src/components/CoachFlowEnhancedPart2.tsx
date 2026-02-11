import { useState } from 'react';
import {
  WireframeScreen,
  TopNavEnhanced,
  AlertBannerEnhanced,
  MetricsRowLive,
  ClipCardEvidence,
  OneTapActionBar,
  ValidationStatus,
  MandatoryFooter,
  TrendChartEnhanced,
  EvidenceBundleHeader,
  ButtonEnhanced,
} from './EnhancedComponents';
import { Upload, Play, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Screen 6: Record / Upload Video
export function RecordUploadVideoEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Phase 2: Video ingestion - upload historical or record live sessions',
        kpis: ['Upload vs record ratio', 'Video processing time', 'Session tagging accuracy', 'Recent upload viewing rate', 'Time spent'],
        dependencies: ['File upload service', 'In-app camera API', 'Video processing pipeline']
      }}
    >
      <TopNavEnhanced title="Record Session - Phase 2" role="Head Coach" orgName="Central High Gymnastics" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Add Video</h3>
          <p className="text-gray-600 text-sm">Record a live session or upload past footage for analysis</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Upload Past Videos */}
          <div className="border-2 border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors bg-white">
            <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Upload Past Videos</p>
            <p className="text-gray-600 text-sm mb-3">Drag and drop or browse files</p>
            <p className="text-gray-500 text-xs">MP4, MOV, AVI • Up to 500MB per file</p>
          </div>

          {/* Record Live Session */}
          <div className="border-2 border-blue-400 rounded-lg p-8 text-center bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
            <Play className="w-16 h-16 text-blue-700 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Record Live Session</p>
            <p className="text-gray-600 text-sm mb-4">Start in-app recording with camera</p>
            <ButtonEnhanced variant="primary" size="medium">
              Start Recording
            </ButtonEnhanced>
            <p className="text-gray-500 text-xs mt-3">Max clip length: 10 minutes</p>
          </div>
        </div>

        {/* Session Tagging */}
        <div className="border-2 border-gray-300 rounded-lg p-6 mb-8 bg-white">
          <p className="text-gray-900 text-sm mb-4">Session Details (optional but recommended)</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-gray-700 mb-2">Event / Rotation</label>
              <div className="h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center justify-between px-3">
                <span className="text-gray-400 text-sm">Vault / Bars / Beam / Floor</span>
                <span className="text-gray-400">▼</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Session Type</label>
              <div className="h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center justify-between px-3">
                <span className="text-gray-400 text-sm">Training / Competition</span>
                <span className="text-gray-400">▼</span>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Athletes in Frame</label>
              <div className="h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center px-3">
                <span className="text-gray-400 text-sm">Select athletes...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Uploads */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Uploads</h4>
          <div className="space-y-3">
            {[
              { name: 'Practice_Session_Jan_2.mp4', date: '2 days ago', status: 'Processing', progress: 45 },
              { name: 'Vault_Training_Dec_28.mov', date: '1 week ago', status: 'Complete', progress: 100 },
              { name: 'Floor_Routine_Dec_20.mp4', date: '2 weeks ago', status: 'Complete', progress: 100 },
            ].map((video, i) => (
              <div key={i} className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-12 bg-gray-200 rounded" />
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm mb-1">{video.name}</p>
                    <p className="text-gray-500 text-xs">{video.date}</p>
                    {video.status === 'Processing' && (
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-xs ${
                  video.status === 'Processing' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
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

// Screen 7: Live Recording View (HIGHEST FIDELITY)
export function LiveRecordingViewHighFi() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'PHASE 2 PRIORITY: In-app recording with real-time metric display and live processing - CORE MODEL TESTING SCREEN',
        kpis: [
          'Recording completion rate',
          'Metric refresh rate (target: <200ms)',
          'Athlete detection accuracy',
          'Average duration between session log activity renders',
          'Average metric value differences within categories (knee valgus delta, landing bend delta, hip flexion delta, height delta)',
          'Real-time processing latency',
          'Frame drop rate',
          'Multi-athlete tracking success rate',
          'Session abandonment rate',
          'Coach intervention trigger rate',
          'Time spent per session',
          'Metric variance per athlete',
          'Alert generation frequency during live sessions'
        ],
        dependencies: ['Camera API', 'Real-time ML inference', 'Websocket for metrics stream', 'Athlete ID model', 'Metric trend storage (sellable gold)', 'Real-time deviation tracking', 'Multi-athlete pose estimation']
      }}
    >
      <TopNavEnhanced 
        title="Live Recording" 
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-700 text-sm">Recording 02:34</span>
            </div>
          </div>
        }
      />
      <div className="p-6">
        {/* Video Player - Large and Prominent */}
        <div className="mb-6">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative border-4 border-gray-700 shadow-xl">
            {/* Recording indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white text-sm">REC 02:34</span>
            </div>
            
            {/* Athlete detection overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
              <p className="text-white text-xs mb-1">Athletes Detected: 3</p>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Sarah J.</span>
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Emily D.</span>
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Mike C.</span>
              </div>
            </div>

            {/* Center play indicator */}
            <div className="text-center">
              <div className="w-24 h-24 border-8 border-white rounded-full flex items-center justify-center mb-4 mx-auto bg-red-600">
                <div className="w-8 h-8 bg-white rounded" />
              </div>
              <p className="text-white text-sm">Live Feed Active</p>
            </div>

            {/* Bottom info bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-black bg-opacity-60 px-3 py-1.5 rounded-lg">
                <p className="text-white text-xs">Session: Vault Training • 3:00 PM</p>
              </div>
              <div className="bg-black bg-opacity-60 px-3 py-1.5 rounded-lg">
                <p className="text-white text-xs">Camera 1 • Main Gym</p>
              </div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <div className="w-6 h-6 border-2 border-gray-600" />
            </button>
            <button className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg">
              <div className="w-6 h-6 bg-white" />
            </button>
            <button className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <span className="text-gray-600 text-xl">⚙</span>
            </button>
          </div>
        </div>

        {/* Real-time Metrics Row - LIVE UPDATES */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-900">Real-Time Metrics</h4>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live Processing</span>
            </div>
          </div>
          <MetricsRowLive
            live={true}
            metrics={[
              { label: 'Knee Valgus', value: '12°', baseline: '11°', trend: 'stable' },
              { label: 'Landing Knee Bend', value: '45°', baseline: '48°', trend: 'down' },
              { label: 'Hip Flexion', value: '82°', baseline: '85°', trend: 'down' },
              { label: 'Height Off Surface', value: '24"', baseline: '22"', trend: 'up' },
            ]}
          />
        </div>

        {/* Event Log / Activity Feed */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <p className="text-gray-900 text-sm mb-3">Session Activity Log</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">02:34</span>
              <span className="text-gray-700">Sarah J. - Vault landing detected • Processing metrics...</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">02:28</span>
              <span className="text-gray-700">Emily D. - Beam dismount • All metrics nominal</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">02:15</span>
              <span className="text-yellow-700">⚠ Mike C. - Elevated knee valgus detected (14°)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">02:08</span>
              <span className="text-gray-700">Sarah J. - Vault approach • Good form</span>
            </div>
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 8: Alert Banner Notification
export function AlertBannerNotificationEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Non-blocking alert notification with CTA to evidence detail',
        kpis: ['Banner click-through rate', 'Time to acknowledgment', 'Dismissal rate'],
        dependencies: ['Alert trigger logic', 'Pattern confirmation', 'Notification queue']
      }}
    >
      <TopNavEnhanced title="Team Dashboard" role="Head Coach" orgName="Central High Gymnastics" />
      <div className="p-6">
        {/* Alert Banner - Non-blocking */}
        <div className="mb-6">
          <AlertBannerEnhanced
            athleteName="Sarah Johnson"
            deviation="Knee Valgus"
          />
        </div>

        {/* Dashboard Content Below */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Active Alerts</p>
            <p className="text-3xl text-gray-900 mb-2">2</p>
            <p className="text-xs text-gray-600">+1 from yesterday</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Monitoring</p>
            <p className="text-3xl text-gray-900 mb-2">3</p>
            <p className="text-xs text-gray-600">No change</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">All Clear</p>
            <p className="text-3xl text-gray-900 mb-2">7</p>
            <p className="text-xs text-gray-600">-1 from yesterday</p>
          </div>
        </div>

        {/* Recent Alerts List */}
        <div>
          <h4 className="text-gray-900 mb-4">Recent Alerts (Today)</h4>
          <div className="space-y-3">
            {[
              {
                athlete: 'Sarah Johnson',
                time: '2:34 PM',
                metric: 'Knee Valgus',
                status: 'New',
                confidence: 'high' as const,
              },
              {
                athlete: 'Anna Martinez',
                time: '1:15 PM',
                metric: 'Landing Form',
                status: 'Reviewed',
                confidence: 'medium' as const,
              },
              {
                athlete: 'Lily Wang',
                time: '12:45 PM',
                metric: 'Hip Flexion',
                status: 'Monitoring',
                confidence: 'medium' as const,
              },
            ].map((alert, i) => (
              <div
                key={i}
                className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white hover:border-gray-400 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div>
                    <p className="text-gray-900 mb-1">{alert.athlete}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-600 text-sm">
                        {alert.metric} • {alert.time}
                      </p>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        alert.confidence === 'high' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {alert.confidence === 'high' ? 'High' : 'Med'} Confidence
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded text-sm ${
                    alert.status === 'New' 
                      ? 'bg-red-100 text-red-700'
                      : alert.status === 'Reviewed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {alert.status}
                  </div>
                  <button className="text-gray-500 hover:text-gray-700">→</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 9: Evidence Carousel (Alert Detail) - HIGHEST FIDELITY
export function EvidenceCarouselHighFi() {
  const [selectedClip, setSelectedClip] = useState(0);
  const [showAdjustOptions, setShowAdjustOptions] = useState(false);

  const clips = [
    { timestamp: 'Jan 3, 2:34 PM', metric: 'Knee Valgus: 18°', deviation: '↑50% from baseline (12°)' },
    { timestamp: 'Jan 3, 2:28 PM', metric: 'Knee Valgus: 19°', deviation: '↑58% from baseline (12°)' },
    { timestamp: 'Jan 2, 3:15 PM', metric: 'Knee Valgus: 17°', deviation: '↑42% from baseline (12°)' },
    { timestamp: 'Jan 2, 2:50 PM', metric: 'Knee Valgus: 18°', deviation: '↑50% from baseline (12°)' },
    { timestamp: 'Jan 1, 4:20 PM', metric: 'Knee Valgus: 16°', deviation: '↑33% from baseline (12°)' },
    { timestamp: 'Jan 1, 4:10 PM', metric: 'Knee Valgus: 17°', deviation: '↑42% from baseline (12°)' },
  ];

  return (
    <WireframeScreen
      annotations={{
        purpose: 'CORE INTERACTION: Evidence-first alert detail with one-tap action framework (≤2s)',
        kpis: ['Action selection distribution', 'Time to action', 'Evidence review depth', 'Clip playthrough rate'],
        dependencies: ['Clip retrieval service', 'Baseline comparison', 'Action logging', 'Escalation routing']
      }}
    >
      <TopNavEnhanced 
        title="Alert Detail - Evidence Review" 
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <ButtonEnhanced variant="outline" size="small">
            ← Back to Dashboard
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
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <p className="text-gray-600 text-sm">16 • Central HS • Vault Landing</p>
          </div>
        </div>

        {/* Evidence Bundle Header */}
        <div className="mb-6">
          <EvidenceBundleHeader
            clipCount={6}
            sessionCount={3}
            dateRange="Jan 1-3, 2026"
            confidence="high"
          />
        </div>

        {/* OBSERVATION (quantified change + baseline) */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <p className="text-gray-900 mb-2"><strong>Observation:</strong></p>
          <p className="text-gray-700 text-sm mb-3">
            Sarah's knee valgus angle has increased to an average of <strong>18°</strong> (baseline: 12°), 
            representing a <strong>+50% deviation</strong> from her personal baseline. This pattern has been 
            confirmed across <strong>6 vault landings in 3 separate sessions</strong> over the past 3 days.
          </p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Avg:</span> <strong className="text-red-700">18°</strong>
            </div>
            <div>
              <span className="text-gray-600">Baseline:</span> <strong>12°</strong>
            </div>
            <div>
              <span className="text-gray-600">Change:</span> <strong className="text-red-700">+6° (+50%)</strong>
            </div>
          </div>
        </div>

        {/* EVIDENCE - Clip Carousel */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-900">Evidence Clips</h4>
            <p className="text-sm text-gray-600">Clip {selectedClip + 1} of {clips.length}</p>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedClip(Math.max(0, selectedClip - 1))}
              disabled={selectedClip === 0}
              className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex-1">
              <ClipCardEvidence
                athleteName="Sarah Johnson - Vault Landing"
                timestamp={clips[selectedClip].timestamp}
                metric={clips[selectedClip].metric}
                deviation={clips[selectedClip].deviation}
                isSelected={true}
              />
            </div>

            <button 
              onClick={() => setSelectedClip(Math.min(clips.length - 1, selectedClip + 1))}
              disabled={selectedClip === clips.length - 1}
              className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {clips.map((clip, i) => (
              <div 
                key={i}
                onClick={() => setSelectedClip(i)}
                className={`flex-shrink-0 w-24 h-16 rounded border-2 cursor-pointer transition-all ${
                  i === selectedClip 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-100 hover:border-gray-400'
                }`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-xs text-gray-600">{i + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Textual Evidence + Trend */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-900 text-sm mb-2"><strong>Pattern Analysis:</strong></p>
            <p className="text-gray-700 text-xs leading-relaxed">
              Consistent elevation in knee valgus across all observed vault landings. Pattern most 
              pronounced during Yurchenko-style vaults. No correlation with fatigue (observed early 
              and late in sessions). Suggests potential biomechanical compensation or technique drift.
            </p>
          </div>
          <TrendChartEnhanced 
            title="7-Day Trend: Knee Valgus" 
            data={[48, 50, 52, 58, 65, 70, 75]}
            baseline={50}
          />
        </div>

        {/* ONE-TAP ACTION BAR */}
        {!showAdjustOptions ? (
          <div className="mb-6">
            <OneTapActionBar
              onMonitor={() => console.log('Monitor')}
              onAdjust={() => setShowAdjustOptions(true)}
              onEscalate={() => console.log('Escalate')}
              onDismiss={() => console.log('Dismiss')}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-900 text-sm"><strong>Select Training Adjustment:</strong></p>
              <button 
                onClick={() => setShowAdjustOptions(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Back
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm text-left hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <p className="text-gray-900 mb-1">Reduce Vault Reps</p>
                <p className="text-gray-500 text-xs">Lower volume by 25-50%</p>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm text-left hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <p className="text-gray-900 mb-1">Add Strength Work</p>
                <p className="text-gray-500 text-xs">Focus on knee stability</p>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm text-left hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <p className="text-gray-900 mb-1">Form Review Session</p>
                <p className="text-gray-500 text-xs">1-on-1 technique work</p>
              </button>
              <button className="px-4 py-3 border-2 border-gray-300 bg-white rounded-lg text-sm text-left hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <p className="text-gray-900 mb-1">Custom Adjustment</p>
                <p className="text-gray-500 text-xs">Enter your own plan</p>
              </button>
            </div>
          </div>
        )}

        {/* Validation Status */}
        <ValidationStatus status="worsening" />
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}

// Remaining screens continued in main file...