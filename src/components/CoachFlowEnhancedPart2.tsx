import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WireframeScreen,
  TopNavEnhanced,
  AlertBannerEnhanced,
  ClipCardEvidence,
  OneTapActionBar,
  ValidationStatus,
  MandatoryFooter,
  TrendChartEnhanced,
  EvidenceBundleHeader,
  ButtonEnhanced,
} from './EnhancedComponents';
import { Upload, Play, ChevronLeft, ChevronRight, Download, Loader2, X, FileVideo } from 'lucide-react';
import { useCoachWebApp } from '../contexts/CoachWebAppContext';
import { getClipsForAlert, getSessionsForAlert, getAlert, getInsightDisplayLabel, getAthleteTrends, getSessionSummaries, type TrendItem } from '../services/athleteCoachService';
import type { SessionSummary } from '../services/athleteCoachService';
import { AthleteTrendsCards } from './AthleteTrendsCards';
import { useLiveCameraWS } from '../hooks/useLiveCameraWS';
import { LiveCameraMetricsCards } from './LiveCameraMetricsCards';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { getAthleteCoachApiUrl } from '../lib/athleteCoachApiUrl';
import { uploadVideoWithSSE, uploadFramesWithSSE, type LiveCameraSSEEvent } from '../services/liveCameraUpload';

const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi';
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const VIDEO_AND_IMAGE_ACCEPT = `${VIDEO_ACCEPT},${IMAGE_ACCEPT}`;
const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500MB
const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50MB per image

function isVideoFile(file: File): boolean {
  const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const videoExt = /\.(mp4|mov|avi)$/i;
  return videoTypes.includes(file.type) || videoExt.test(file.name);
}

/** Short label for session id (e.g. upload_xxx_seg_21 → Segment 21). */
function shortSessionLabel(sessionId: string): string {
  const seg = sessionId.match(/_seg_(\d+)$/i);
  if (seg) return `Segment ${seg[1]}`;
  if (sessionId.length > 32) return sessionId.slice(0, 16) + '…';
  return sessionId;
}

/** Stylized form issues + ACL block for a session panel (Record tab). */
function SessionPanelFormIssues({
  formIssues,
  aclRiskLevel,
  hasHighRiskAcl,
  aclHighRiskCount,
}: {
  formIssues?: string[];
  aclRiskLevel?: string;
  hasHighRiskAcl?: boolean;
  aclHighRiskCount?: number;
}) {
  const issues = formIssues ?? [];
  const hasForm = issues.length > 0;
  const hasAcl = aclRiskLevel != null && aclRiskLevel !== '';
  if (!hasForm && !hasAcl) return null;
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
      {hasForm && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-amber-800 text-xs font-medium mb-1">Form issues</p>
              <ul className="list-disc list-inside text-amber-800 text-xs space-y-0.5">
                {issues.slice(0, 6).map((issue, idx) => (
                  <li key={idx} className="break-words">{issue}</li>
                ))}
                {issues.length > 6 && (
                  <li className="text-amber-700">+{issues.length - 6} more</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      {hasAcl && (
        <div className={`rounded-lg border px-2.5 py-2 ${hasHighRiskAcl ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs font-medium ${hasHighRiskAcl ? 'text-red-800' : 'text-gray-700'}`}>
            ACL risk: <span className={hasHighRiskAcl ? 'text-red-900' : ''}>{aclRiskLevel}</span>
            {aclHighRiskCount != null && aclHighRiskCount > 0 && (
              <span className="text-gray-600 font-normal"> ({aclHighRiskCount} high)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/** Parse insight_previews that may be stringified dicts (Python or JSON). */
function parseInsightPreview(raw: string): { what?: string; why?: string; priority?: string; raw: string } {
  const result: { what?: string; why?: string; priority?: string; raw: string } = { raw: String(raw) };
  if (typeof raw !== 'string' || !raw.trim()) return result;
  const s = raw.trim();
  if (s.startsWith('{') && s.includes('"')) {
    try {
      const obj = JSON.parse(s) as Record<string, unknown>;
      if (typeof obj.what === 'string') result.what = obj.what;
      if (typeof obj.why === 'string') result.why = obj.why;
      if (typeof obj.priority === 'string') result.priority = obj.priority;
      return result;
    } catch {
      /* fall through */
    }
  }
  const whatMatch = s.match(/'what':\s*'((?:[^'\\]|\\.)*)'/);
  const whyMatch = s.match(/'why':\s*'((?:[^'\\]|\\.)*)'/);
  const priorityMatch = s.match(/'priority':\s*'((?:[^'\\]|\\.)*)'/);
  if (whatMatch) result.what = whatMatch[1].replace(/\\'/g, "'");
  if (whyMatch) result.why = whyMatch[1].replace(/\\'/g, "'");
  if (priorityMatch) result.priority = priorityMatch[1];
  return result;
}

/** Segment + metrics + insights blocks for a session panel. */
function SessionPanelExtra({
  segment,
  metrics,
  insightPreviews,
  athleteName,
  athleteId,
}: {
  segment?: { segment_number?: number; segment_start_frame?: number; segment_end_frame?: number; video_clip_count?: number };
  metrics?: Record<string, unknown>;
  insightPreviews?: string[];
  athleteName?: string;
  athleteId?: string;
}) {
  const hasSegment = segment && (segment.segment_number != null || segment.video_clip_count != null || segment.segment_start_frame != null);
  const hasMetrics = metrics && Object.keys(metrics).length > 0 && (
    metrics.acl_risk_score != null || metrics.height_off_floor_meters != null || metrics.body_alignment_degrees != null || metrics.knee_valgus != null
  );
  const insights = insightPreviews ?? [];
  const hasInsights = insights.length > 0;
  const hasAthlete = (athleteName ?? athleteId) != null && (athleteName ?? athleteId) !== '';
  if (!hasSegment && !hasMetrics && !hasInsights && !hasAthlete) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {hasAthlete && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
          <p className="text-slate-700 text-xs font-medium">
            Athlete: {[athleteName, athleteId].filter(Boolean).join(' • ') || '—'}
          </p>
        </div>
      )}
      {hasSegment && segment && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-2">
          <p className="text-gray-700 text-xs font-medium mb-1">Segment</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
            {segment.segment_number != null && <span>#{segment.segment_number}</span>}
            {segment.video_clip_count != null && <span>{segment.video_clip_count} clip(s)</span>}
            {segment.segment_start_frame != null && <span>Frames {segment.segment_start_frame}–{segment.segment_end_frame ?? '—'}</span>}
          </div>
        </div>
      )}
      {hasMetrics && metrics && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
          <p className="text-slate-700 text-xs font-medium mb-2">Metrics</p>
          <div className="flex flex-wrap gap-2">
            {metrics.acl_risk_score != null && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium">
                ACL score: {Number(metrics.acl_risk_score).toFixed(2)}
              </span>
            )}
            {metrics.height_off_floor_meters != null && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium">
                Height: {Number(metrics.height_off_floor_meters).toFixed(2)} m
              </span>
            )}
            {metrics.body_alignment_degrees != null && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium">
                Alignment: {Number(metrics.body_alignment_degrees).toFixed(0)}°
              </span>
            )}
            {metrics.knee_valgus != null && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium">
                Knee valgus: {Number(metrics.knee_valgus).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
      {hasInsights && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5">
          <p className="text-blue-800 text-xs font-medium mb-2">Insights</p>
          <ul className="space-y-2 list-none pl-0">
            {insights.slice(0, 5).map((raw, idx) => {
              const parsed = parseInsightPreview(typeof raw === 'string' ? raw : JSON.stringify(raw));
              const hasParsed = parsed.what != null || parsed.why != null;
              return (
                <li key={idx} className="text-xs border-l-2 border-blue-200 pl-2 py-0.5">
                  {hasParsed ? (
                    <div className="space-y-0.5 break-words">
                      {parsed.priority && <span className="text-blue-600 font-medium">Priority: {parsed.priority}</span>}
                      {parsed.what && <p className="text-gray-800"><span className="font-medium text-gray-700">What: </span>{parsed.what}</p>}
                      {parsed.why && <p className="text-gray-600"><span className="font-medium text-gray-500">Why: </span>{parsed.why}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-600 break-words">{parsed.raw}</p>
                  )}
                </li>
              );
            })}
          </ul>
          {insights.length > 5 && <p className="text-blue-600 text-xs mt-1">+{insights.length - 5} more</p>}
        </div>
      )}
    </div>
  );
}

function isImageFile(file: File): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const imageExt = /\.(jpg|jpeg|png|webp)$/i;
  return imageTypes.includes(file.type) || imageExt.test(file.name);
}

// Screen 6: Record / Upload Video — functional upload + API sessions
export function RecordUploadVideoEnhanced() {
  const ctx = useCoachWebApp();
  const sessions = ctx?.sessions ?? [];
  const sessionsLoading = ctx?.sessionsLoading ?? false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [eventRotation, setEventRotation] = useState('Vault / Bars / Beam / Floor');
  const [sessionType, setSessionType] = useState('Training / Competition');
  const [uploadProgress, setUploadProgress] = useState<{ frameIndex: number; totalFrames: number; currentFile: string } | null>(null);
  const [uploadLiveEvent, setUploadLiveEvent] = useState<LiveCameraSSEEvent | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [useCloudFace, setUseCloudFace] = useState(false);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(false);
  const [sessionFilterAthleteId, setSessionFilterAthleteId] = useState<string | null>(null);

  useEffect(() => {
    ctx?.refreshSessions?.();
  }, [ctx?.refreshSessions]);

  const refreshSummaries = useCallback(async () => {
    setSummariesLoading(true);
    try {
      const res = await getSessionSummaries({ limit: 500 });
      setSessionSummaries(Array.isArray(res?.summaries) ? res.summaries : []);
    } catch {
      setSessionSummaries([]);
    } finally {
      setSummariesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSummaries();
  }, [refreshSummaries]);

  const validateFile = useCallback((file: File, asVideo: boolean): string | null => {
    if (asVideo) {
      if (!isVideoFile(file)) return `"${file.name}" is not a supported video (use MP4, MOV, or AVI).`;
      if (file.size > MAX_FILE_BYTES) return `"${file.name}" is over 500MB.`;
    } else {
      if (!isImageFile(file)) return `"${file.name}" is not a supported image (use JPG, PNG, or WebP).`;
      if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" is over 50MB.`;
    }
    return null;
  }, []);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const next: File[] = [];
      const errors: string[] = [];
      const isVideo = isVideoFile(files[0]);
      const isImage = isImageFile(files[0]);
      if (!isVideo && !isImage) {
        setUploadError(`"${files[0].name}" is not a supported video or image.`);
        return;
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sameType = isVideo ? isVideoFile(file) : isImageFile(file);
        if (!sameType) {
          setUploadError('Select either all videos or all images, not both.');
          return;
        }
        const err = validateFile(file, isVideo);
        if (err) errors.push(err);
        else next.push(file);
      }
      if (errors.length) {
        setUploadError(errors[0]);
        return;
      }
      setUploadError(null);
      setSelectedFiles((prev) => {
        if (prev.length > 0) {
          const prevIsVideo = isVideoFile(prev[0]);
          if (prevIsVideo !== isVideo) {
            setUploadError('Select either all videos or all images, not both.');
            return prev;
          }
        }
        return [...prev, ...next];
      });
      setUploadStatus('idle');
    },
    [validateFile]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
    setUploadStatus('idle');
  }, []);

  const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(e.target.files ?? null);
      e.target.value = '';
    },
    [addFiles]
  );
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleSubmitUpload = useCallback(async () => {
    if (!selectedFiles.length) {
      setUploadError('Select at least one video or image file.');
      return;
    }
    const allVideo = selectedFiles.every(isVideoFile);
    const allImage = selectedFiles.every(isImageFile);
    if (!allVideo && !allImage) {
      setUploadError('Select either all videos or all images, not both.');
      return;
    }
    setUploadError(null);
    setUploadStatus('uploading');
    setUploadProgress({ frameIndex: 0, totalFrames: 0, currentFile: selectedFiles[0].name });
    setUploadLiveEvent(null);
    setCompletedSessionId(null);
    let lastSessionId: string | null = null;
    const selectedAthlete = ctx?.selectedAthleteId
      ? (ctx?.roster ?? []).find((a) => a.athlete_id === ctx?.selectedAthleteId)
      : null;
    const onEvent = (event: LiveCameraSSEEvent) => {
      setUploadLiveEvent(event);
      if (event.frame_index != null || event.total_frames != null) {
        setUploadProgress((p) =>
          p
            ? {
                ...p,
                frameIndex: event.frame_index ?? p.frameIndex,
                totalFrames: event.total_frames ?? p.totalFrames,
              }
            : null
        );
      }
      if (event.session_id) lastSessionId = event.session_id;
    };
    try {
      if (allVideo) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress((p) => (p ? { ...p, currentFile: file.name, frameIndex: 0, totalFrames: 0 } : null));
          setUploadLiveEvent(null);
          const result = await uploadVideoWithSSE(
            {
              video: file,
              session_id: lastSessionId ?? undefined,
              use_cloud_face: useCloudFace,
              athlete_id: selectedAthlete?.athlete_id,
              athlete_name: selectedAthlete?.athlete_name,
            },
            onEvent
          );
          if (result.error) throw new Error(result.error);
          if (result.session_id) lastSessionId = result.session_id;
        }
      } else {
        setUploadProgress((p) => (p ? { ...p, currentFile: `${selectedFiles.length} images` } : null));
        const result = await uploadFramesWithSSE(
          {
            files: selectedFiles,
            session_id: lastSessionId ?? undefined,
            use_cloud_face: useCloudFace,
            athlete_id: selectedAthlete?.athlete_id,
            athlete_name: selectedAthlete?.athlete_name,
          },
          onEvent
        );
        if (result.error) throw new Error(result.error);
        if (result.session_id) lastSessionId = result.session_id;
      }
      setCompletedSessionId(lastSessionId);
      setUploadStatus('success');
      setSelectedFiles([]);
      setUploadProgress(null);
      setUploadLiveEvent(null);
      ctx?.refreshSessions?.();
      refreshSummaries();
    } catch (err) {
      setUploadStatus('error');
      setUploadProgress(null);
      setUploadLiveEvent(null);
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Check live camera service (e.g. port 8010).');
    }
  }, [selectedFiles, useCloudFace, ctx?.selectedAthleteId, ctx?.roster, ctx?.refreshSessions, refreshSummaries]);

  return (
    <WireframeScreen
      annotations={{
        purpose: 'Phase 2: Video ingestion - upload historical or record live sessions',
        kpis: ['Upload vs record ratio', 'Video processing time', 'Session tagging accuracy'],
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
          <div
            role="button"
            tabIndex={0}
            onClick={handleUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => e.key === 'Enter' && handleUploadClick()}
            className={`border-2 rounded-lg p-8 text-center cursor-pointer transition-colors bg-white ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={VIDEO_AND_IMAGE_ACCEPT}
              multiple
              onChange={handleFileChange}
              className="hidden"
              aria-label="Choose video or image files"
            />
            <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Upload Videos or Image Sequence</p>
            <p className="text-gray-600 text-sm mb-3">Drag and drop or click to browse</p>
            <p className="text-gray-500 text-xs">Videos: MP4, MOV, AVI (500MB). Images: JPG, PNG, WebP (50MB each)</p>
          </div>

          <div className="border-2 border-blue-400 rounded-lg p-8 text-center bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
            <Play className="w-16 h-16 text-blue-700 mx-auto mb-4" />
            <p className="text-gray-900 mb-2">Record Live Session</p>
            <p className="text-gray-600 text-sm mb-4">Start in-app recording with camera</p>
            <ButtonEnhanced variant="primary" size="medium" onClick={() => ctx?.setWebScreen?.(6)}>
              Start Recording
            </ButtonEnhanced>
            <p className="text-gray-500 text-xs mt-3">Max clip length: 10 minutes</p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg bg-white">
            <p className="text-gray-900 text-sm font-medium mb-3">
              {selectedFiles.length > 0 && isVideoFile(selectedFiles[0])
                ? `Selected videos (${selectedFiles.length})`
                : `Selected images (${selectedFiles.length})`}
            </p>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useCloudFace}
                onChange={(e) => setUseCloudFace(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Use cloud face recognition</span>
            </label>
            <ul className="space-y-2 mb-3">
              {selectedFiles.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileVideo className="w-5 h-5 text-gray-500 shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{f.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {f.size >= 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : `${(f.size / 1024).toFixed(1)} KB`}
                    </span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} className="p-1 text-gray-500 hover:text-red-600" aria-label="Remove file">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            {uploadError && <p className="text-sm text-red-600 mb-2">{uploadError}</p>}
            {uploadStatus === 'uploading' && (
              <>
                <div className="flex items-center text-blue-600 text-sm mb-2">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {uploadProgress?.currentFile ? `Processing ${uploadProgress.currentFile}…` : 'Uploading…'}
                </div>
                {uploadProgress && uploadProgress.totalFrames > 0 && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Frame {uploadProgress.frameIndex} / {uploadProgress.totalFrames}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(uploadProgress.frameIndex / uploadProgress.totalFrames) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadLiveEvent && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
                    {uploadLiveEvent.phase && <p><span className="font-medium text-gray-700">Phase:</span> {String(uploadLiveEvent.phase)}</p>}
                    {uploadLiveEvent.movement_msg && <p className="text-gray-700">{uploadLiveEvent.movement_msg}</p>}
                    {uploadLiveEvent.visibility_msg && <p className="text-gray-600">{uploadLiveEvent.visibility_msg}</p>}
                    {uploadLiveEvent.form_issues?.length ? (
                      <p><span className="font-medium text-amber-700">Form issues:</span> {uploadLiveEvent.form_issues.join(', ')}</p>
                    ) : null}
                    {(() => {
                      const raw = uploadLiveEvent.recommendations;
                      const list = Array.isArray(raw) ? raw : [];
                      const lines = list.map((r: unknown) => {
                        if (typeof r === 'string') return r;
                        if (r != null && typeof r === 'object') {
                          const o = r as Record<string, unknown>;
                          return (o.text ?? o.message ?? o.recommendation ?? o.detail ?? o.summary ?? JSON.stringify(o)) as string;
                        }
                        return String(r);
                      }).filter(Boolean);
                      return lines.length > 0 ? (
                        <div className="mt-2">
                          <p className="font-medium text-blue-700 mb-1">Recommendations</p>
                          <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                            {lines.map((line, idx) => (
                              <li key={idx} className="break-words">{line}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })()}
                    {uploadLiveEvent.acl_summary && <p><span className="font-medium text-red-700">ACL:</span> {String(uploadLiveEvent.acl_summary)}</p>}
                    {uploadLiveEvent.athlete_name && <p><span className="font-medium text-gray-700">Athlete:</span> {uploadLiveEvent.athlete_name}</p>}
                  </div>
                )}
              </>
            )}
            {uploadStatus === 'success' && (
              <p className="text-sm text-green-600 mb-2">
                Analysis complete.{completedSessionId ? ` Session: ${completedSessionId}` : ''} Sessions will refresh.
              </p>
            )}
            {uploadStatus === 'error' && uploadError && <p className="text-sm text-red-600 mb-2">{uploadError}</p>}
            <ButtonEnhanced variant="primary" size="medium" onClick={handleSubmitUpload} disabled={uploadStatus === 'uploading'}>
              {uploadStatus === 'uploading'
                ? 'Processing…'
                : selectedFiles.length > 0 && isVideoFile(selectedFiles[0])
                  ? 'Upload selected videos'
                  : 'Upload selected images'}
            </ButtonEnhanced>
          </div>
        )}

        <div className="border-2 border-gray-300 rounded-lg p-6 mb-8 bg-white">
          <p className="text-gray-900 text-sm mb-4">Session Details (optional but recommended)</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-gray-700 mb-2">Event / Rotation</label>
              <select
                value={eventRotation}
                onChange={(e) => setEventRotation(e.target.value)}
                className="w-full h-10 border-2 border-gray-300 rounded-lg bg-white px-3 text-gray-900"
              >
                <option value="Vault / Bars / Beam / Floor">Vault / Bars / Beam / Floor</option>
                <option value="Vault">Vault</option>
                <option value="Bars">Bars</option>
                <option value="Beam">Beam</option>
                <option value="Floor">Floor</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full h-10 border-2 border-gray-300 rounded-lg bg-white px-3 text-gray-900"
              >
                <option value="Training / Competition">Training / Competition</option>
                <option value="Training">Training</option>
                <option value="Competition">Competition</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Athletes in Frame</label>
              <div className="h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center px-3">
                <span className="text-gray-400 text-sm">Select athletes...</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-gray-900">
              Recent Sessions (from API)
              {sessionFilterAthleteId && (
                <span className="text-gray-500 font-normal text-sm ml-2">
                  — {ctx?.roster?.find((a) => a.athlete_id === sessionFilterAthleteId)?.athlete_name ?? sessionFilterAthleteId}
                </span>
              )}
            </h4>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Filter by athlete:</span>
              <select
                value={sessionFilterAthleteId ?? ''}
                onChange={(e) => setSessionFilterAthleteId(e.target.value === '' ? null : e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-900 text-sm min-w-[160px]"
              >
                <option value="">All athletes</option>
                {(ctx?.roster ?? []).map((a) => (
                  <option key={a.athlete_id} value={a.athlete_id}>
                    {a.athlete_name || a.athlete_id}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {sessionsLoading || summariesLoading ? (
            <div className="flex items-center text-gray-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading sessions…
            </div>
          ) : (() => {
            const filteredSummaries =
              sessionFilterAthleteId != null && sessionFilterAthleteId !== ''
                ? sessionSummaries.filter((s) => (s.athlete_id ?? '').trim() === sessionFilterAthleteId.trim())
                : sessionSummaries;
            const filteredSessions =
              sessionFilterAthleteId != null && sessionFilterAthleteId !== ''
                ? (sessions as Array<Record<string, unknown>>).filter(
                    (s) => String(s.athlete_id ?? '').trim() === sessionFilterAthleteId.trim()
                  )
                : sessions;
            return filteredSummaries.length > 0 ? (
            <div className="space-y-3">
              {filteredSummaries.map((summary, i) => {
                const sessionId = summary.session_id ?? `session-${i}`;
                const activityLine = [summary.activity, summary.technique].filter(Boolean).join(' • ') || null;
                const issues = summary.issues_summary;
                const streamUrl =
                  summary.cloudflare_stream_url ??
                  (filteredSessions as Array<Record<string, unknown>>).find(
                    (s) => String(s.session_id ?? s._id ?? '').trim() === String(sessionId).trim()
                  )?.cloudflare_stream_url ??
                  (sessions as Array<Record<string, unknown>>).find(
                    (s) => String(s.session_id ?? s._id ?? '').trim() === String(sessionId).trim()
                  )?.cloudflare_stream_url as string | undefined;
                const displayLabel = shortSessionLabel(String(sessionId));
                return (
                  <div key={sessionId} className="border-2 border-gray-300 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-16 h-12 bg-gray-200 rounded shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-medium mb-0.5" title={String(sessionId)}>{displayLabel}</p>
                          {summary.timestamp && (
                            <p className="text-gray-500 text-xs">{new Date(summary.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</p>
                          )}
                          {activityLine && <p className="text-gray-600 text-xs mt-0.5">{activityLine}</p>}
                          {sessionId !== displayLabel && (
                            <p className="text-gray-400 text-xs mt-0.5 truncate" title={String(sessionId)}>{String(sessionId)}</p>
                          )}
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-lg text-xs bg-green-100 text-green-700 shrink-0 font-medium">Complete</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 text-xs font-medium mb-1">Session video / clip</p>
                      {streamUrl ? (
                        <>
                          <a
                            href={streamUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            <FileVideo className="w-3.5 h-3.5" />
                            Watch video
                          </a>
                          <p className="text-gray-500 text-xs mt-1 break-all">{streamUrl}</p>
                        </>
                      ) : (
                        <p className="text-gray-400 text-xs">No stream URL</p>
                      )}
                    </div>
                    <SessionPanelFormIssues
                      formIssues={issues?.form_issues}
                      aclRiskLevel={issues?.acl_risk_level}
                      hasHighRiskAcl={issues?.has_high_risk_acl ?? issues?.acl_risk_level === 'HIGH'}
                      aclHighRiskCount={issues?.acl_high_risk_count}
                    />
                    <SessionPanelExtra
                      segment={summary.segment}
                      metrics={summary.metrics_summary as Record<string, unknown> | undefined}
                      insightPreviews={issues?.insight_previews}
                      athleteName={summary.athlete_name}
                      athleteId={summary.athlete_id}
                    />
                  </div>
                );
              })}
            </div>
          ) : filteredSessions.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">
              {sessionFilterAthleteId ? 'No sessions for this athlete.' : 'No sessions yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((s: unknown, i: number) => {
                const sess = s as Record<string, unknown>;
                const streamUrl = sess.cloudflare_stream_url as string | undefined;
                return (
                  <div key={i} className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-16 h-12 bg-gray-200 rounded shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm mb-1">{String(sess.session_id ?? sess._id ?? 'Session')}</p>
                          <p className="text-gray-500 text-xs">{String(sess.timestamp ?? sess.activity ?? '')}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded text-xs bg-green-100 text-green-700 shrink-0">Complete</div>
                    </div>
                    {streamUrl && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-gray-500 text-xs mb-1">Cloudflare stream</p>
                        <a
                          href={streamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs break-all"
                        >
                          {streamUrl}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
          })()}
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 7: Live Recording View — WebSocket feed with full annotated or pose-only stream (same backend as mobile)
export function LiveRecordingViewHighFi() {
  const ctx = useCoachWebApp();
  const [viewMode, setViewMode] = useState<'full' | 'pose_only'>('full');
  const selectedAthlete = ctx?.selectedAthleteId
    ? ctx?.roster?.find((a) => a.athlete_id === ctx?.selectedAthleteId)
    : null;
  const athleteContext = selectedAthlete
    ? { athlete_id: selectedAthlete.athlete_id, athlete_name: selectedAthlete.athlete_name }
    : undefined;
  const {
    videoRef,
    isStreaming,
    isConnected,
    error,
    frameCount,
    sessionId,
    currentAthlete,
    latestMetrics,
    annotatedFrameUrl,
    poseOnlyImageUrl,
    startStreaming,
    stopStreaming,
  } = useLiveCameraWS(undefined, athleteContext);

  const backToRecord = () => ctx?.setWebScreen?.(5);
  const displayImageUrl = viewMode === 'pose_only' && poseOnlyImageUrl ? poseOnlyImageUrl : annotatedFrameUrl;

  // Build activity log lines from live metrics
  const activityLines: { time: string; msg: string; warn?: boolean }[] = [];
  if (latestMetrics?.movementMsg) activityLines.push({ time: 'Live', msg: latestMetrics.movementMsg });
  if (latestMetrics?.visibilityMsg) activityLines.push({ time: 'Live', msg: latestMetrics.visibilityMsg });
  if (latestMetrics?.phase) activityLines.push({ time: 'Phase', msg: latestMetrics.phase });
  if (latestMetrics?.aclSummary) activityLines.push({ time: 'ACL', msg: latestMetrics.aclSummary, warn: true });
  (latestMetrics?.formIssues ?? []).slice(0, 3).forEach((issue) => activityLines.push({ time: 'Form', msg: issue, warn: true }));
  if (activityLines.length === 0 && isStreaming) activityLines.push({ time: '—', msg: 'Waiting for metrics…' });

  return (
    <WireframeScreen
      annotations={{
        purpose: 'In-app recording with real-time metric display via live camera WebSocket',
        kpis: ['Recording completion rate', 'Metric refresh rate', 'Athlete detection accuracy'],
        dependencies: ['Camera API', 'Live camera WebSocket', 'Real-time ML inference', 'LiveCameraMetricsCards']
      }}
    >
      <TopNavEnhanced
        title="Live Recording"
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <>
            {isStreaming && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-700 text-sm">Recording • Frame {frameCount}</span>
              </div>
            )}
            {ctx && (
              <ButtonEnhanced variant="outline" size="small" onClick={backToRecord}>
                ← Back to Record
              </ButtonEnhanced>
            )}
          </>
        }
      />
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Video Player — live annotated frame or placeholder */}
        <div className="mb-6">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center relative border-4 border-gray-700 shadow-xl overflow-hidden">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain" style={{ display: displayImageUrl ? 'none' : 'block' }} playsInline muted />
            {displayImageUrl && (
              <img
                src={displayImageUrl}
                alt={viewMode === 'pose_only' ? 'Pose only (skeleton)' : 'Annotated frame'}
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            {isStreaming && (
              <div className="absolute top-2 right-2 flex gap-1 rounded-lg bg-black/60 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`px-2 py-1 text-xs font-medium rounded ${viewMode === 'full' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}`}
                >
                  Full
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('pose_only')}
                  className={`px-2 py-1 text-xs font-medium rounded ${viewMode === 'pose_only' ? 'bg-white text-gray-900' : 'text-white hover:bg-white/20'}`}
                >
                  Pose only
                </button>
              </div>
            )}

            {isStreaming && (
              <>
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm">REC {frameCount}</span>
                </div>
                {currentAthlete && (
                  <div className="absolute top-4 right-4 bg-black/60 px-3 py-2 rounded-lg">
                    <p className="text-white text-xs mb-1">Athlete</p>
                    <span className="text-white text-sm">{currentAthlete.athleteName || currentAthlete.athleteId}</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="bg-black/60 px-3 py-1.5 rounded-lg">
                    <p className="text-white text-xs">{sessionId ? `Session: ${sessionId}` : 'Live'}</p>
                  </div>
                  {isConnected && (
                    <div className="bg-green-600/80 px-3 py-1.5 rounded-lg text-white text-xs">Connected</div>
                  )}
                </div>
              </>
            )}

            {!isStreaming && (
              <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-24 h-24 border-8 border-white rounded-full flex items-center justify-center mb-4 bg-red-600">
                  <div className="w-8 h-8 bg-white rounded" />
                </div>
                <p className="text-white text-sm mb-4">Click Start to begin streaming</p>
                <button type="button" onClick={startStreaming} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                  Start
                </button>
              </div>
            )}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button type="button" className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors" aria-label="Pause" />
            {isStreaming ? (
              <button type="button" onClick={stopStreaming} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg" aria-label="Stop">
                <div className="w-6 h-6 bg-white" />
              </button>
            ) : (
              <button type="button" onClick={startStreaming} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg" aria-label="Start">
                <div className="w-6 h-6 bg-white" />
              </button>
            )}
            <button type="button" className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors" aria-label="Settings">
              <span className="text-gray-600 text-xl">⚙</span>
            </button>
          </div>
        </div>

        {/* Real-time Metrics — LiveCameraMetricsCards from WebSocket */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-900">Real-Time Metrics</h4>
            {isStreaming && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live</span>
              </div>
            )}
          </div>
          {latestMetrics ? (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <LiveCameraMetricsCards metrics={latestMetrics} maxMetricCards={6} />
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-500 text-sm">
              {isStreaming ? 'Waiting for metrics from service…' : 'Start streaming to see live metrics.'}
            </div>
          )}
        </div>

        {/* Session Activity Log — from live metrics */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <p className="text-gray-900 text-sm mb-3">Session Activity Log</p>
          <div className="space-y-2 text-xs">
            {activityLines.length ? activityLines.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gray-500 w-14 shrink-0">{line.time}</span>
                <span className={line.warn ? 'text-yellow-700' : 'text-gray-700'}>{line.msg}</span>
              </div>
            )) : (
              <p className="text-gray-500">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 8: Alert Banner Notification — wired to API: getAllAlerts via context; trends for spotlight athlete
export function AlertBannerNotificationEnhanced() {
  const ctx = useCoachWebApp();
  const alerts = ctx?.alerts ?? [];
  const loading = ctx?.alertsLoading ?? false;
  const [trendsData, setTrendsData] = useState<{ trends: TrendItem[]; athlete_name?: string | null } | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  const handleViewAlert = (alertId: string) => {
    ctx?.setSelectedAlertId(alertId);
    ctx?.setWebScreen?.(8);
  };

  const firstAlert = alerts[0];
  const athleteIdFromAlert = firstAlert?.athlete_id;
  const athleteName = firstAlert?.session_metadata?.athlete_name ?? firstAlert?.athlete_id ?? 'Athlete';
  const insightId = firstAlert?.insight_id ?? '';

  useEffect(() => {
    if (!athleteIdFromAlert) {
      setTrendsData(null);
      return;
    }
    let cancelled = false;
    setTrendsLoading(true);
    getAthleteTrends(athleteIdFromAlert, { limit: 20 })
      .then((res) => {
        if (cancelled || res.status !== 'success' || !res.trends?.length) {
          if (!cancelled) setTrendsData(null);
          return;
        }
        setTrendsData({ trends: res.trends, athlete_name: res.athlete_name });
      })
      .catch(() => {
        if (!cancelled) setTrendsData(null);
      })
      .finally(() => {
        if (!cancelled) setTrendsLoading(false);
      });
    return () => { cancelled = true; };
  }, [athleteIdFromAlert]);

  return (
    <WireframeScreen
      annotations={{
        purpose: 'Non-blocking alert notification with CTA to evidence detail',
        kpis: ['Banner click-through rate', 'Time to acknowledgment', 'Dismissal rate'],
        dependencies: ['Alert trigger logic', 'Pattern confirmation', 'Notification queue']
      }}
    >
      <TopNavEnhanced title="Alerts" role="Head Coach" orgName="Central High Gymnastics" />
      <div className="p-6">
        {firstAlert && (
          <div className="mb-6">
            <AlertBannerEnhanced
              athleteName={String(athleteName)}
              deviation={getInsightDisplayLabel(insightId)}
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Active Alerts</p>
            <p className="text-3xl text-gray-900 mb-2">{loading ? '—' : alerts.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Monitoring</p>
            <p className="text-3xl text-gray-900 mb-2">{ctx?.roster.filter((a) => a.status === 'monitor').length ?? '—'}</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">All Clear</p>
            <p className="text-3xl text-gray-900 mb-2">{ctx?.roster.filter((a) => !a.status || a.status === 'normal').length ?? '—'}</p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-gray-900 mb-4">Recent Alerts</h4>
          {loading ? (
            <div className="flex items-center text-gray-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No alerts.</p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 15).map((alert, i) => {
                const id = String(alert._id ?? alert.alert_id ?? i);
                const name = alert.session_metadata?.athlete_name ?? alert.athlete_id ?? 'Athlete';
                const metric = getInsightDisplayLabel(String(alert.insight_id ?? alert.alert_type ?? ''));
                const time = alert.created_at ?? alert.updated_at ?? '';
                const status = alert.status ?? 'New';
                return (
                  <div
                    key={id}
                    className="border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between bg-white hover:border-gray-400 cursor-pointer transition-colors"
                    onClick={() => handleViewAlert(id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleViewAlert(id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div>
                        <p className="text-gray-900 mb-1">{String(name)}</p>
                        <p className="text-gray-600 text-sm">{metric} • {String(time).slice(0, 10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded text-sm ${
                        status === 'New' ? 'bg-red-100 text-red-700' : status === 'Reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {String(status)}
                      </span>
                      <span className="text-gray-500">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {athleteIdFromAlert && (
          <>
            {trendsLoading ? (
              <div className="flex items-center text-gray-500 py-4">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading trends…
              </div>
            ) : trendsData?.trends?.length ? (
              <AthleteTrendsCards
                trends={trendsData.trends}
                athleteName={trendsData.athlete_name ?? athleteName}
                title="Trends for spotlight athlete"
              />
            ) : null}
          </>
        )}
      </div>
    </WireframeScreen>
  );
}

// Screen 9: Evidence Carousel (Alert Detail) — wired to API: getAlert, getClipsForAlert, getSessionsForAlert
export function EvidenceCarouselHighFi() {
  const [selectedClip, setSelectedClip] = useState(0);
  const [showAdjustOptions, setShowAdjustOptions] = useState(false);
  const ctx = useCoachWebApp();
  const alertId = ctx?.selectedAlertId ?? null;
  const [alert, setAlert] = useState<Record<string, unknown> | null>(null);
  const [clips, setClips] = useState<Array<Record<string, unknown>>>([]);
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alertId) {
      setAlert(null);
      setClips([]);
      setSessions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [alertRes, clipsRes, sessionsRes] = await Promise.all([
          getAlert(alertId).then((r) => r.alert as Record<string, unknown> ?? null),
          getClipsForAlert(alertId).then((r) => (r.clips as Array<Record<string, unknown>>) ?? []),
          getSessionsForAlert(alertId).then((r) => (r.sessions as Array<Record<string, unknown>>) ?? []),
        ]);
        if (cancelled) return;
        setAlert(alertRes ?? null);
        setClips(Array.isArray(clipsRes) ? clipsRes : []);
        setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
      } catch {
        if (!cancelled) setAlert(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [alertId]);

  const displayClips = clips.length > 0
    ? clips.map((c) => ({
        timestamp: c.timestamp ?? c.created_at ?? '—',
        metric: getInsightDisplayLabel(String(alert?.insight_id ?? '')),
        deviation: c.metric ?? c.insight_id ?? '—',
      }))
    : [
        { timestamp: '—', metric: getInsightDisplayLabel(String(alert?.insight_id ?? '')), deviation: 'No clips' },
      ];

  const backToAlerts = () => {
    ctx?.setSelectedAlertId(null);
    ctx?.setWebScreen?.(7);
  };

  if (!alertId) {
    return (
      <WireframeScreen annotations={{ purpose: 'Alert evidence', kpis: [], dependencies: [] }}>
        <TopNavEnhanced title="Alert Detail" role="Head Coach" orgName="Central High Gymnastics" actions={<ButtonEnhanced variant="outline" size="small" onClick={backToAlerts}>← Back to Alerts</ButtonEnhanced>} />
        <div className="p-6">
          <p className="text-gray-600 mb-4">Select an alert from the Alerts tab to view evidence.</p>
          <ButtonEnhanced variant="outline" size="medium" onClick={backToAlerts}>← Back to Alerts</ButtonEnhanced>
        </div>
      </WireframeScreen>
    );
  }

  const athleteName = alert?.session_metadata?.athlete_name ?? alert?.athlete_id ?? 'Athlete';

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
        actions={<ButtonEnhanced variant="outline" size="small" onClick={backToAlerts}>← Back to Alerts</ButtonEnhanced>}
      />
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            Loading alert…
          </div>
        ) : (
          <>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-gray-900">{String(athleteName)}</h3>
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <p className="text-gray-600 text-sm">{getInsightDisplayLabel(String(alert?.insight_id ?? ''))}</p>
          </div>
        </div>

        <div className="mb-6">
          <EvidenceBundleHeader
            clipCount={displayClips.length}
            sessionCount={sessions.length}
            dateRange={alert?.created_at ? String(alert.created_at).slice(0, 10) : '—'}
            confidence="high"
          />
        </div>

        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <p className="text-gray-900 mb-2"><strong>Observation:</strong></p>
          <p className="text-gray-700 text-sm mb-3">
            {displayClips.length} clip(s) across {sessions.length} session(s). Review evidence below.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-900">Evidence Clips</h4>
            <p className="text-sm text-gray-600">Clip {selectedClip + 1} of {displayClips.length}</p>
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
                athleteName={`${athleteName} - ${getInsightDisplayLabel(String(alert?.insight_id ?? ''))}`}
                timestamp={displayClips[selectedClip]?.timestamp ?? '—'}
                metric={displayClips[selectedClip]?.metric ?? '—'}
                deviation={displayClips[selectedClip]?.deviation ?? '—'}
                isSelected={true}
              />
            </div>

            <button 
              onClick={() => setSelectedClip(Math.min(displayClips.length - 1, selectedClip + 1))}
              disabled={selectedClip === displayClips.length - 1}
              className="w-12 h-12 border-2 border-gray-300 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayClips.map((_clip, i) => (
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

        <ValidationStatus status="worsening" />
          </>
        )}
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}