import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera,
  Video,
  Upload,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Play,
  Pause,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Users,
  Bell,
  Loader2,
  RefreshCw,
  Calendar,
  User,
  MessageSquare,
  Lightbulb,
  Square,
  Home,
} from 'lucide-react';
import {
  getAllAlerts,
  getAthleteAlerts,
  getAllAthletes,
  getBaselinesForAthlete,
  getBaselinesForAlert,
  getSessionsForAlert,
  getClipsForAlert,
  getSessionInsightsMetricsRecommendations,
  extractSessionMetrics,
  sortSessionMetrics,
  formatMetricLabel,
  safeRenderValue,
  getInsightDisplayLabel,
  getAlertSessionCount,
  getAlertPrimaryVideoUrl,
  stopLiveCamera,
  type AlertPayload,
  type SessionInsightsMetricsRecommendationsResponse,
  type BaselinesForAlertResponse,
} from '../../services/athleteCoachService';
import { Stream } from '@cloudflare/stream-react';
import { StreamVideoPlayer } from '../StreamVideoPlayer';
import { LiveCameraFeed } from '../LiveCameraFeed';
import { LiveCameraWSFeed } from '../LiveCameraWSFeed';
import { AlertBaselinesDisplay, AthleteBaselinesDisplay, type BaselineDocument } from '../AlertBaselinesDisplay';
import { useCoachPreferences } from '../../contexts/CoachPreferencesContext';
import { uploadVideoWithSSE, uploadFramesWithSSE, type LiveCameraSSEEvent } from '../../services/liveCameraUpload';

const CLOUDFLARE_TEST_VIDEO_ID = '325aefecad13e675e5066ed181dd03bf';

const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi';
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const VIDEO_AND_IMAGE_ACCEPT = `${VIDEO_ACCEPT},${IMAGE_ACCEPT}`;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

function isVideoFile(file: File): boolean {
  return ['video/mp4', 'video/quicktime', 'video/x-msvideo'].includes(file.type) || /\.(mp4|mov|avi)$/i.test(file.name);
}
function isImageFile(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
}

// Mobile Record Video Screen — same record functionality as coach web: upload + live camera, with athlete context
export function MobileRecordVideo({
  onStartLiveSession,
  onNavigate,
  athleteId,
  athleteName,
}: {
  onStartLiveSession?: () => void;
  onNavigate?: (screen: number) => void;
  /** When set (athlete or coach-selected), live stream and upload are tagged with this athlete (same as web) */
  athleteId?: string | null;
  athleteName?: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files?.length) return;
    const file = files[0];
    const asVideo = isVideoFile(file);
    const asImage = isImageFile(file);
    if (!asVideo && !asImage) {
      setUploadError('Choose a video (MP4, MOV, AVI) or image (JPG, PNG, WebP).');
      return;
    }
    if (asVideo && file.size > MAX_VIDEO_BYTES) {
      setUploadError('Video must be under 500MB.');
      return;
    }
    if (asImage && file.size > MAX_IMAGE_BYTES) {
      setUploadError('Each image must be under 50MB.');
      return;
    }
    setUploadError(null);
    setUploadStatus('uploading');
    setUploadProgress(file.name);
    const athlete = (athleteId || athleteName) ? { athlete_id: athleteId ?? undefined, athlete_name: athleteName ?? undefined } : undefined;
    try {
      if (asVideo) {
        const result = await uploadVideoWithSSE(
          { video: file, athlete_id: athlete?.athlete_id, athlete_name: athlete?.athlete_name },
          (_event: LiveCameraSSEEvent) => {}
        );
        if (result.error) throw new Error(result.error);
      } else {
        const fileList = Array.from(files).filter(isImageFile);
        const result = await uploadFramesWithSSE(
          { files: fileList, athlete_id: athlete?.athlete_id, athlete_name: athlete?.athlete_name },
          (_event: LiveCameraSSEEvent) => {}
        );
        if (result.error) throw new Error(result.error);
      }
      setUploadStatus('success');
      setUploadProgress(null);
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.(1)}
            className="w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg text-gray-900 flex-1">Record Session</h1>
        </div>
      </div>

      {/* Same options as coach web: Upload + Live camera */}
      <div className="shrink-0 px-4 py-3 bg-white border-b border-gray-200 flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={VIDEO_AND_IMAGE_ACCEPT}
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload video or images"
        />
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploadStatus === 'uploading'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-medium text-sm active:bg-gray-50 disabled:opacity-60"
        >
          {uploadStatus === 'uploading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload video or images
        </button>
        {uploadStatus === 'success' && <span className="text-green-600 text-sm py-2">Upload complete</span>}
        {uploadStatus === 'error' && uploadError && <span className="text-red-600 text-sm py-2">{uploadError}</span>}
        {uploadProgress && uploadStatus === 'uploading' && <span className="text-gray-500 text-xs py-2">{uploadProgress}</span>}
      </div>

      {/* Main Area: full-width live camera + metrics (same as coach web; athlete/coach context passed for tagging) */}
      <div className="flex-1 flex flex-col bg-black">
        <div className="px-4 pt-4 pb-2">
          <p className="text-gray-200 text-xs">
            Live camera with real-time ACL and landing metrics. Same as coach web.
          </p>
        </div>
        <div className="flex-1 px-0 pb-2">
          <LiveCameraWSFeed
            className="h-full"
            showMetrics={true}
            showAthleteInfo={true}
            athleteId={athleteId ?? undefined}
            athleteName={athleteName ?? undefined}
          />
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => onNavigate?.(1)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Roster</span>
          </button>
          <button 
            onClick={() => onNavigate?.(3)}
            className="flex flex-col items-center py-2 text-blue-600 active:opacity-70"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button 
            onClick={() => onNavigate?.(5)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button 
            onClick={() => onNavigate?.(6)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile Live Recording Screen
export function MobileLiveRecording({ onNavigate }: { onNavigate?: (screen: number) => void }) {
  const [isLive, setIsLive] = useState(true);
  const [isStopping, setIsStopping] = useState(false);

  const handleEndSession = async () => {
    if (isStopping) return;
    setIsStopping(true);
    try {
      await stopLiveCamera();
    } catch (e) {
      console.warn('Stop live camera API call failed:', e);
      // Still stop the feed locally
    }
    setIsLive(false);
    setIsStopping(false);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent px-4 pt-3 pb-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate?.(3)}
            className="w-9 h-9 flex items-center justify-center active:bg-white/20 rounded-lg"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isLive ? 'bg-red-600' : 'bg-gray-600'}`}>
            {isLive ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">02:34</span>
              </>
            ) : (
              <span className="text-white text-sm font-medium">Stopped</span>
            )}
          </div>
          <button className="w-9 h-9 flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <LiveCameraFeed
          className="absolute inset-0"
          fill
          showLabel={false}
          stopped={!isLive}
        />
        
        {/* Athletes Detected Overlay */}
        <div className="absolute top-20 left-4 bg-black bg-opacity-60 rounded-lg px-3 py-2 z-10">
          <p className="text-white text-xs mb-1">Athletes: 2</p>
          <div className="flex gap-1">
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Sarah</span>
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">Mike</span>
          </div>
        </div>
      </div>

      {/* Real-Time Metrics Panel - Swipeable */}
      <div className="bg-white rounded-t-3xl">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Metrics */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-900 text-sm font-medium">
              {isLive ? 'Live Metrics' : 'Session Ended'}
            </p>
            {isLive ? (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Processing</span>
              </div>
            ) : (
              <span className="text-gray-500 text-xs">Metrics stopped</span>
            )}
          </div>

          {isLive && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Knee Valgus</p>
              <p className="text-gray-900 text-2xl font-semibold">12°</p>
              <p className="text-gray-400 text-xs mt-0.5">Baseline: 11°</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Landing Bend</p>
              <p className="text-gray-900 text-2xl font-semibold">45°</p>
              <p className="text-gray-400 text-xs mt-0.5">Baseline: 48°</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Hip Flexion</p>
              <p className="text-gray-900 text-2xl font-semibold">82°</p>
              <p className="text-gray-400 text-xs mt-0.5">Baseline: 85°</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Jump Height</p>
              <p className="text-gray-900 text-2xl font-semibold">24"</p>
              <p className="text-gray-400 text-xs mt-0.5">Baseline: 22"</p>
            </div>
          </div>
          )}

          {/* Activity Log */}
          {isLive && (
          <div className="mt-4 bg-gray-50 rounded-xl p-3 max-h-24 overflow-y-auto">
            <p className="text-gray-700 text-xs mb-2 font-medium">Activity</p>
            <div className="space-y-1 text-xs">
              <p className="text-gray-600">02:34 - Sarah: Vault landing detected</p>
              <p className="text-gray-600">02:28 - Mike: Beam dismount</p>
              <p className="text-yellow-700">02:15 - ⚠ Elevated knee valgus</p>
            </div>
          </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 px-4 pb-6">
          <button className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex flex-col items-center">
            <button
              onClick={handleEndSession}
              disabled={!isLive || isStopping}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  : 'bg-gray-400 cursor-default'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
              title={isLive ? 'End session' : 'Session ended'}
            >
              <div className="w-8 h-8 bg-white rounded-sm" />
            </button>
            <span className="text-gray-600 text-xs mt-1">{isLive ? (isStopping ? 'Stopping…' : 'End') : 'Ended'}</span>
          </div>
          <button className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
            <Video className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface AthleteOption {
  athlete_id: string;
  athlete_name: string;
}

// Mobile Athlete Detail — alerts and baselines for a selected athlete
export function MobileAthleteDetail({
  athlete,
  athletes = [],
  onBack,
  onNavigate,
}: {
  athlete: { athlete_id: string; athlete_name: string };
  athletes?: AthleteOption[];
  onBack?: () => void;
  onNavigate?: (screen: number) => void;
}) {
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [baselines, setBaselines] = useState<BaselineDocument[] | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingBaselines, setLoadingBaselines] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState<string | null>(null);
  const [errorBaselines, setErrorBaselines] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertPayload | null>(null);
  const [activeTab, setActiveTab] = useState<'alerts' | 'baselines'>('alerts');

  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    setErrorAlerts(null);
    try {
      const res = (await getAthleteAlerts(athlete.athlete_id, {
        include_stream_urls: true,
        include_insights: true,
        include_metrics: true,
        limit: 50,
      })) as { alerts?: AlertPayload[] };
      setAlerts(Array.isArray(res?.alerts) ? res.alerts : []);
    } catch (e) {
      setErrorAlerts(e instanceof Error ? e.message : 'Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  }, [athlete.athlete_id]);

  const fetchBaselines = useCallback(async () => {
    setLoadingBaselines(true);
    setErrorBaselines(null);
    try {
      const res = await getBaselinesForAthlete(athlete.athlete_id);
      const raw = res?.baselines;
      if (Array.isArray(raw) && raw.length > 0) {
        setBaselines(raw as BaselineDocument[]);
      } else if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'items' in raw && Array.isArray((raw as { items: unknown }).items)) {
        setBaselines((raw as { items: BaselineDocument[] }).items);
      } else {
        setBaselines(null);
      }
    } catch (e) {
      setErrorBaselines(e instanceof Error ? e.message : 'Failed to load baselines');
      setBaselines(null);
    } finally {
      setLoadingBaselines(false);
    }
  }, [athlete.athlete_id]);

  useEffect(() => {
    fetchAlerts();
    fetchBaselines();
  }, [fetchAlerts, fetchBaselines]);

  if (selectedAlert) {
    return (
      <MobileAlertDetail
        alert={selectedAlert}
        athletes={athletes}
        onBack={() => setSelectedAlert(null)}
        onNavigate={onNavigate}
      />
    );
  }

  const baselineList = Array.isArray(baselines) ? baselines : [];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack ?? (() => onNavigate?.(1))}
            className="w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg text-gray-900 truncate">{athlete.athlete_name || athlete.athlete_id}</h1>
            <p className="text-xs text-gray-500">{athlete.athlete_id}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('baselines')}
            className={`py-3 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'baselines'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Baselines
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'alerts' ? (
          <>
            {loadingAlerts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : errorAlerts ? (
              <div className="py-6 text-center">
                <p className="text-red-600 text-sm mb-2">{errorAlerts}</p>
                <button onClick={fetchAlerts} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  Retry
                </button>
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">No alerts for this athlete</div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, i) => {
                  const label = getInsightDisplayLabel(alert.insight_id ?? '');
                  const count = getAlertSessionCount(alert);
                  return (
                    <button
                      key={alert.alert_id ?? alert._id ?? i}
                      onClick={() => setSelectedAlert(alert)}
                      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{label}</p>
                          <p className="text-xs text-gray-500">
                            {alert.severity ?? '—'} • {count} session{count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {loadingBaselines ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : errorBaselines ? (
              <div className="py-6 text-center">
                <p className="text-red-600 text-sm mb-2">{errorBaselines}</p>
                <button onClick={fetchBaselines} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  Retry
                </button>
              </div>
            ) : baselineList.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">No baselines for this athlete</div>
            ) : (
              <AthleteBaselinesDisplay baselines={baselineList} compact />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Mobile Alerts List (uses athleteCoachFastApiClient via athleteCoachService)
// Coach flow: fetches alerts with athlete dropdown. Athlete flow: pass filterAthleteId to see only own alerts.
export function MobileAlertsList({
  onNavigate,
  filterAthleteId,
  isAthlete,
}: {
  onNavigate?: (screen: number) => void;
  filterAthleteId?: string;
  isAthlete?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertPayload | null>(null);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(filterAthleteId ?? 'all');
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);
  const effectiveFilter = filterAthleteId ?? selectedAthleteId;

  const fetchAthletes = useCallback(async () => {
    if (filterAthleteId) return; // athlete view: no need to load full roster
    try {
      const res = (await getAllAthletes({ limit: 100 })) as
        | { athletes?: Array<{ athlete_id?: string; athlete_name?: string }> }
        | Array<{ athlete_id?: string; athlete_name?: string }>;
      const raw =
        Array.isArray((res as { athletes?: unknown[] })?.athletes)
          ? (res as { athletes: Array<{ athlete_id?: string; athlete_name?: string }> }).athletes
          : Array.isArray(res)
            ? (res as Array<{ athlete_id?: string; athlete_name?: string }>)
            : [];
      const list = raw.map((a) => ({
        athlete_id: a.athlete_id ?? '',
        athlete_name: a.athlete_name ?? a.athlete_id ?? 'Unknown',
      }));
      setAthletes(list);
    } catch {
      setAthletes([]);
    }
  }, [filterAthleteId]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res: { alerts?: AlertPayload[] };
      // Athletes must only see their own alerts - never use 'all'
      if (isAthlete && !filterAthleteId) {
        setAlerts([]);
        setLoading(false);
        return;
      }
      if (effectiveFilter === 'all') {
        res = (await getAllAlerts({ limit: 50 })) as { alerts?: AlertPayload[] };
      } else {
        res = (await getAthleteAlerts(effectiveFilter, { limit: 50 })) as { alerts?: AlertPayload[] };
      }
      const list = Array.isArray(res?.alerts) ? res.alerts : [];
      setAlerts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveFilter, isAthlete, filterAthleteId]);

  useEffect(() => {
    if (filterAthleteId) setSelectedAthleteId(filterAthleteId);
  }, [filterAthleteId]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  if (selectedAlert) {
    return (
      <MobileAlertDetail
        alert={selectedAlert}
        athletes={athletes}
        onBack={() => setSelectedAlert(null)}
        onNavigate={onNavigate}
      />
    );
  }

  const selectedLabel = filterAthleteId
    ? 'My Alerts'
    : selectedAthleteId === 'all'
      ? 'All Athletes'
      : athletes.find((a) => a.athlete_id === selectedAthleteId)?.athlete_name ?? selectedAthleteId;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onNavigate?.(1)}
            className="w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg text-gray-900 flex-1">Alerts</h1>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        {/* Athlete dropdown (hidden when athlete view – filterAthleteId set) */}
        {!filterAthleteId && (
          <div className="relative">
            <button
              onClick={() => setShowAthleteDropdown(!showAthleteDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-left text-sm"
            >
              <span className="text-gray-900 font-medium truncate">{selectedLabel}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${showAthleteDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showAthleteDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedAthleteId('all');
                    setShowAthleteDropdown(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${selectedAthleteId === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                >
                  All Athletes
                </button>
                {athletes.map((a) => (
                  <button
                    key={a.athlete_id}
                    onClick={() => {
                      setSelectedAthleteId(a.athlete_id);
                      setShowAthleteDropdown(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 truncate ${selectedAthleteId === a.athlete_id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    {a.athlete_name || a.athlete_id}
                  </button>
                ))}
                {athletes.length === 0 && (
                  <p className="px-3 py-2.5 text-gray-500 text-sm">No athletes found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && alerts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-red-600 text-sm mb-2">{error}</p>
            <p className="text-gray-500 text-xs mb-3">
              Ensure Athlete Coach API is running on port 8004
            </p>
            <button
              onClick={fetchAlerts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No alerts found
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const label = getInsightDisplayLabel(alert.insight_id ?? '');
              const count = getAlertSessionCount(alert);
              return (
                <button
                  key={alert.alert_id ?? alert._id ?? i}
                  onClick={() => setSelectedAlert(alert)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{label}</p>
                      <p className="text-xs text-gray-500">
                        {alert.severity ?? '—'} • {count} session{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex justify-around">
          <button
            onClick={() => onNavigate?.(1)}
            className="flex flex-col items-center py-2 text-gray-400"
          >
            {isAthlete ? (
              <>
                <Home className="w-6 h-6 mb-1" />
                <span className="text-xs">Home</span>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 mb-1" />
                <span className="text-xs">Roster</span>
              </>
            )}
          </button>
          <button
            onClick={() => onNavigate?.(3)}
            className="flex flex-col items-center py-2 text-gray-400"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button className="flex flex-col items-center py-2 text-blue-600">
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button
            onClick={() => onNavigate?.(6)}
            className="flex flex-col items-center py-2 text-gray-400"
          >
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile Alert Detail Screen (can show real alert data when passed)
export function MobileAlertDetail({
  alert: propAlert,
  athletes = [],
  onBack,
  onNavigate,
}: {
  alert?: AlertPayload | null;
  athletes?: Array<{ athlete_id: string; athlete_name: string }>;
  onBack?: () => void;
  onNavigate?: (screen: number) => void;
}) {
  const [selectedClip, setSelectedClip] = useState(0);
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [clipsFromApi, setClipsFromApi] = useState<Array<Record<string, unknown>>>([]);
  const [sessionDetailData, setSessionDetailData] = useState<
    Record<string, SessionInsightsMetricsRecommendationsResponse>
  >({});
  const [alertBaselines, setAlertBaselines] = useState<BaselinesForAlertResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const useMock = !propAlert;
  const clips = useMock
    ? [
        { time: 'Jan 3, 2:34 PM', metric: '18°' },
        { time: 'Jan 3, 2:28 PM', metric: '19°' },
        { time: 'Jan 2, 3:15 PM', metric: '17°' },
        { time: 'Jan 2, 2:50 PM', metric: '18°' },
      ]
    : [];
  const displayLabel = propAlert
    ? getInsightDisplayLabel(propAlert.insight_id ?? '')
    : 'Knee Valgus';
  const sessionCount = propAlert ? getAlertSessionCount(propAlert) : 6;
  const primaryUrl = propAlert ? getAlertPrimaryVideoUrl(propAlert) : undefined;

  useEffect(() => {
    if (!propAlert) return;
    const alertId = propAlert.alert_id ?? propAlert._id;
    if (!alertId) return;

    setLoadingDetail(true);
    (async () => {
      try {
        const [sessionsResp, clipsResp, baselinesResp] = await Promise.all([
          getSessionsForAlert(String(alertId)),
          getClipsForAlert(String(alertId)),
          getBaselinesForAlert(String(alertId)),
        ]);
        const sess = Array.isArray(sessionsResp?.sessions) ? sessionsResp.sessions : [];
        const cl = Array.isArray(clipsResp?.clips) ? clipsResp.clips : [];
        const sessionIds = new Set<string>();
        const getSid = (s: Record<string, unknown>) => String(s.session_id ?? s._id ?? s.original_filename ?? '').trim();
        sess.forEach((s: Record<string, unknown>) => {
          const sid = getSid(s);
          if (sid) sessionIds.add(sid);
        });
        (propAlert.session_ids ?? []).forEach((sid) => { if (sid) sessionIds.add(String(sid)); });
        if (propAlert.session_id) sessionIds.add(String(propAlert.session_id));

        setSessions(sess as Array<Record<string, unknown>>);
        setClipsFromApi(cl as Array<Record<string, unknown>>);

        const detailBySession: Record<string, SessionInsightsMetricsRecommendationsResponse> = {};
        await Promise.all(
          [...sessionIds].map(async (sid) => {
            try {
              const data = await getSessionInsightsMetricsRecommendations(sid);
              if (data?.status === 'success') {
                detailBySession[sid] = data;
              }
            } catch (_) {}
          })
        );
        setSessionDetailData(detailBySession);

        if (sess.length === 0 && Object.keys(detailBySession).length > 0) {
          setSessions(
            Object.entries(detailBySession).map(([sid, d]) => ({
              session_id: sid,
              _id: sid,
              ...(d.session as Record<string, unknown>),
            })) as Array<Record<string, unknown>>
          );
        }

        // API returns { status, alert, baseline_id, baseline, related_baselines }
        const baselinesRespTyped = baselinesResp as BaselinesForAlertResponse | undefined;
        setAlertBaselines(baselinesRespTyped ?? null);
      } catch (e) {
        console.error('Failed to load sessions/clips', e);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [propAlert?.alert_id, propAlert?._id]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack ?? (() => onNavigate?.(1))}
            className="w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg text-gray-900 flex-1">Alert Detail</h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Athlete Header */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-gray-900 font-medium">
                  {propAlert?.session_metadata?.athlete_name ??
                    (sessions[0] as { athlete_name?: string })?.athlete_name ??
                    athletes.find((a) => a.athlete_id === propAlert?.athlete_id)?.athlete_name ??
                    propAlert?.athlete_id ??
                    'Athlete'}
                </p>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <p className="text-gray-600 text-sm">
                {propAlert?.session_metadata?.technique ?? 'Vault Landing'}
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Summary */}
        <div className="bg-blue-50 border-y border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-900 text-sm font-medium">Evidence Bundle</p>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              {propAlert?.severity ?? 'High Confidence'}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-blue-800">
            <span>{displayLabel}</span>
            <span>•</span>
            <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
            {propAlert?.created_at && (
              <>
                <span>•</span>
                <span>{new Date(propAlert.created_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Observation */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <p className="text-gray-900 text-sm font-medium mb-2">Observation</p>
          <p className="text-gray-700 text-sm mb-3">
            {useMock
              ? 'Knee valgus angle increased to 18° (baseline: 12°), a +50% deviation. Pattern confirmed across 6 vault landings.'
              : `${displayLabel} — ${propAlert?.status ?? 'open'} alert. ${sessionCount} session${sessionCount !== 1 ? 's' : ''} contributed.`}
          </p>
          {useMock && (
            <div className="flex gap-3 text-xs">
              <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                <p className="text-red-600 mb-1">Current</p>
                <p className="text-red-900 font-semibold">18°</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-gray-600 mb-1">Baseline</p>
                <p className="text-gray-900 font-semibold">12°</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-lg p-2 text-center">
                <p className="text-red-600 mb-1">Change</p>
                <p className="text-red-900 font-semibold">+50%</p>
              </div>
            </div>
          )}
        </div>

        {/* Alert Baselines */}
        {propAlert && alertBaselines && (
          <div className="bg-white px-4 py-4 border-b border-gray-200">
            <AlertBaselinesDisplay data={alertBaselines} compact />
          </div>
        )}

        {/* Contributing Sessions + Insights (expanded view for real alerts) */}
        {propAlert && (
          <div className="bg-white px-4 py-4 border-b border-gray-200">
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading session details...
              </div>
            ) : (
              <>
                {sessions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-900 text-sm font-medium mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contributing Sessions ({sessions.length})
                    </p>
                    <div className="space-y-4">
                      {sessions.map((s, i) => {
                        const sid = String(s.session_id ?? s._id ?? (s.original_filename as string) ?? i);
                        const streamUrl = s.cloudflare_stream_url as string | undefined;
                        const detail = sessionDetailData[sid] ?? sessionDetailData[String(s.session_id)] ?? sessionDetailData[String(s._id)];
                        const metrics = detail?.full_metrics
                          ? extractSessionMetrics(detail.full_metrics as Record<string, unknown>)
                          : extractSessionMetrics(s as Record<string, unknown>);
                        const insightsList = detail?.insights ?? (s.insights as unknown[]) ?? [];
                        return (
                          <div
                            key={i}
                            className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {s.timestamp ? new Date(String(s.timestamp)).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">
                              {String(s.activity ?? '—')} • {String(s.technique ?? '—')}
                              {(s.athlete_id ?? propAlert?.athlete_id) && (
                                <> • {athletes.find((a) => a.athlete_id === (s.athlete_id ?? propAlert?.athlete_id))?.athlete_name ?? (s.athlete_name as string) ?? s.athlete_id ?? propAlert?.athlete_id}</>
                              )}
                            </p>
                            {streamUrl && (
                              <div className="mb-2">
                                <StreamVideoPlayer url={streamUrl} title={`Session ${i + 1}`} className="rounded-lg" />
                              </div>
                            )}
                            {detail?.recommendations && detail.recommendations.length > 0 && (
                              <div className="mb-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                <p className="text-xs font-medium text-emerald-800 mb-1 flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3" /> Recommendations
                                </p>
                                {detail.recommendations.slice(0, 2).map((rec, j) => (
                                  <div key={j} className="text-xs">
                                    {rec.observation != null && rec.observation !== '' && <p className="text-gray-700 font-medium">{safeRenderValue(rec.observation)}</p>}
                                    {rec.coaching_options?.[0] != null && rec.coaching_options[0] !== '' && (
                                      <p className="text-gray-600 mt-0.5">{safeRenderValue(rec.coaching_options[0])}</p>
                                    )}
                                  </div>
                                ))}
                                {detail.recommendations.length > 2 && (
                                  <p className="text-xs text-gray-400 mt-1">+{detail.recommendations.length - 2} more</p>
                                )}
                              </div>
                            )}
                            {metrics && Object.keys(metrics).length > 0 && (
                              <div className="mb-2 p-2 bg-white rounded-lg border border-gray-100">
                                <p className="text-xs font-medium text-gray-700 mb-1">Metrics</p>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  {sortSessionMetrics(metrics)
                                    .filter(([, v]) => v != null)
                                    .map(([k, v]) => {
                                      const displayVal = typeof v === 'object' && v && 'value' in v
                                        ? (v as { value?: unknown }).value
                                        : v;
                                      if (displayVal == null || typeof displayVal === 'object') return null;
                                      return (
                                        <div key={k} className="flex justify-between gap-1">
                                          <span className="text-gray-500 truncate">{formatMetricLabel(k)}:</span>
                                          <span className="font-medium truncate">{String(displayVal)}</span>
                                        </div>
                                      );
                                    })
                                    .filter(Boolean)
                                    .slice(0, 12)}
                                </div>
                              </div>
                            )}
                            {(insightsList.length > 0 || detail?.insights?.some((ins) => ins.summary || ins.insights?.summary)) && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  Insights
                                </p>
                                {detail?.insights?.map((ins, j) => {
                                  const summary = ins.insights?.summary ?? ins.summary;
                                  const keyFindings = ins.insights?.key_findings ?? ins.key_findings ?? [];
                                  if ((summary == null || summary === '') && keyFindings.length === 0) return null;
                                  return (
                                    <div key={j} className="text-xs text-gray-700 pl-2 py-1 border-l-2 border-amber-300 bg-amber-50/50 rounded-r mb-1">
                                      {summary != null && summary !== '' && <p>{safeRenderValue(summary)}</p>}
                                      {keyFindings.slice(0, 2).map((f, k) => (
                                        <p key={k} className="mt-0.5">• {safeRenderValue(f)}</p>
                                      ))}
                                    </div>
                                  );
                                }) ?? insightsList.slice(0, 3).map((ins: unknown, j: number) => (
                                  <p key={j} className="text-xs text-gray-700 pl-2 py-1 border-l-2 border-amber-300 bg-amber-50/50 rounded-r">
                                    {safeRenderValue(ins)}
                                  </p>
                                ))}
                                {insightsList.length > 3 && !detail?.insights && (
                                  <p className="text-xs text-gray-400 mt-1">+{insightsList.length - 3} more</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {clipsFromApi.length > 0 && (
                  <div>
                    <p className="text-gray-900 text-sm font-medium mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Clips ({clipsFromApi.length})
                    </p>
                    <div className="space-y-3">
                      {clipsFromApi.map((clip, i) => {
                        const url = clip.cloudflare_stream_url ?? clip.preview_url ?? clip.stream_url;
                        return url ? (
                          <div key={i} className="rounded-lg overflow-hidden">
                            <p className="text-xs text-gray-600 mb-1">Clip {i + 1}</p>
                            <StreamVideoPlayer url={String(url)} title={`Clip ${i + 1}`} className="rounded-lg" />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Evidence Clips / Video */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-900 text-sm font-medium">Evidence Clips</p>
            {(clips.length > 0 || primaryUrl) && (
              <p className="text-gray-600 text-xs">
                {clips.length > 0 ? `${selectedClip + 1} of ${clips.length}` : '1 video'}
              </p>
            )}
          </div>

          {/* Main Clip / Video */}
          <div className="bg-gray-900 rounded-xl aspect-video mb-3 flex items-center justify-center relative">
            {primaryUrl ? (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center"
              >
                <Play className="w-12 h-12 text-white" />
              </a>
            ) : (
              <Play className="w-12 h-12 text-white" />
            )}
            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 rounded px-2 py-1 flex items-center justify-between">
              <span className="text-white text-xs">
                {clips[selectedClip]?.time ?? (propAlert?.created_at ? new Date(propAlert.created_at).toLocaleString() : '—')}
              </span>
              <span className="text-white text-xs">0:08</span>
            </div>
          </div>

          {/* Metric Display */}
          {(clips.length > 0 || useMock) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-red-700 text-xs mb-1">{displayLabel}</p>
              <p className="text-red-900 text-xl font-semibold">
                {clips[selectedClip]?.metric ?? (propAlert?.insight_id ?? '—')}
              </p>
              <p className="text-red-600 text-xs">
                {useMock ? '↑50% from baseline (12°)' : `${sessionCount} session${sessionCount !== 1 ? 's' : ''} affected`}
              </p>
            </div>
          )}

          {/* Thumbnail Strip */}
          {clips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {clips.map((clip, i) => (
              <button
                key={i}
                onClick={() => setSelectedClip(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg border-2 ${
                  i === selectedClip 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-100'
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                  {i + 1}
                </div>
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white px-4 py-4">
          <p className="text-gray-900 text-sm font-medium mb-3">Take Action</p>
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate?.(1)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium active:bg-blue-700"
            >
              Monitor
            </button>
            <button className="w-full py-3 bg-yellow-600 text-white rounded-xl font-medium active:bg-yellow-700">
              Make a Change
            </button>
            <button className="w-full py-3 bg-red-600 text-white rounded-xl font-medium active:bg-red-700">
              Escalate to PT/AT
            </button>
            <button 
              onClick={() => onNavigate?.(1)}
              className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium active:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        </div>

        <div className="h-20" />
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => onNavigate?.(1)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Roster</span>
          </button>
          <button 
            onClick={() => onNavigate?.(3)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button 
            onClick={() => onNavigate?.(5)}
            className="flex flex-col items-center py-2 text-blue-600 active:opacity-70"
          >
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button 
            onClick={() => onNavigate?.(6)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile Quick Actions Screen (coach: Team Roster; athlete: Home, no roster)
export function MobileQuickActions({
  onStartLiveSession,
  onNavigate,
  isAthlete,
}: {
  onStartLiveSession?: () => void;
  onNavigate?: (screen: number) => void;
  isAthlete?: boolean;
}) {
  const { coachUseWebApp, setCoachUseWebApp } = useCoachPreferences();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg text-gray-900">Quick Actions</h1>
      </div>

      {/* Coach: Web app version toggle (Figma: coach profile preference) */}
      {!isAthlete && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Use web app version</p>
              <p className="text-xs text-gray-500 mt-0.5">Switch to desktop-style coach view</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={coachUseWebApp}
              onClick={() => setCoachUseWebApp(!coachUseWebApp)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                coachUseWebApp ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                  coachUseWebApp ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Action Grid */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate?.(3)}
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 active:bg-gray-50"
          >
            <Camera className="w-8 h-8 text-blue-600 mb-3" />
            <p className="text-gray-900 text-sm font-medium">Record Session</p>
          </button>
          <button
            onClick={() => onNavigate?.(3)}
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 active:bg-gray-50"
          >
            <Upload className="w-8 h-8 text-blue-600 mb-3" />
            <p className="text-gray-900 text-sm font-medium">Upload Video</p>
          </button>
          <button
            onClick={() => onNavigate?.(5)}
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 active:bg-gray-50"
          >
            <Bell className="w-8 h-8 text-red-600 mb-3" />
            <p className="text-gray-900 text-sm font-medium">View Alerts</p>
          </button>
          <button
            onClick={() => onNavigate?.(1)}
            className="bg-white border-2 border-gray-300 rounded-2xl p-6 active:bg-gray-50"
          >
            {isAthlete ? (
              <>
                <Home className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-gray-900 text-sm font-medium">Home</p>
              </>
            ) : (
              <>
                <Users className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-gray-900 text-sm font-medium">Team Roster</p>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onNavigate?.(1)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            {isAthlete ? (
              <>
                <Home className="w-6 h-6 mb-1" />
                <span className="text-xs">Home</span>
              </>
            ) : (
              <>
                <Users className="w-6 h-6 mb-1" />
                <span className="text-xs">Roster</span>
              </>
            )}
          </button>
          <button
            onClick={() => onNavigate?.(3)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button
            onClick={() => onNavigate?.(5)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button
            onClick={() => onNavigate?.(6)}
            className="flex flex-col items-center py-2 text-blue-600 active:opacity-70"
          >
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
