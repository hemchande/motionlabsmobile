import React, { useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { getAthleteCoachApiUrl } from '../lib/athleteCoachApiUrl';

interface LiveCameraFeedProps {
  /** Additional CSS classes for the container */
  className?: string;
  /** Aspect ratio class, e.g. "aspect-video". Use "min-h-0 flex-1" for fill mode. */
  aspectRatio?: string;
  /** Show a label above the feed */
  showLabel?: boolean;
  /** Fill parent (object-cover, no aspect constraint) */
  fill?: boolean;
  /** If true, feed is paused/stopped (no request made) */
  stopped?: boolean;
}

/**
 * Displays the live camera video feed from the Athlete Coach API.
 * Requires the API to be running with /api/live-camera/video_feed enabled.
 */
export function LiveCameraFeed({
  className = '',
  aspectRatio = 'aspect-video',
  showLabel = true,
  fill = false,
  stopped = false,
}: LiveCameraFeedProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    setError(
      'Cannot load feed. Ensure Athlete Coach API is running on port 8004 with /api/live-camera/video_feed enabled.'
    );
  };

  const handleLoad = () => {
    setError(null);
    setLoaded(true);
  };

  return (
    <div className={className}>
      {showLabel && (
        <p className="text-gray-700 text-sm font-medium mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Live Camera Feed
        </p>
      )}
      <div className={`overflow-hidden bg-black relative ${!fill ? `rounded-xl ${aspectRatio}` : 'absolute inset-0 w-full h-full'}`}>
        {stopped ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-900 text-gray-400 text-center">
            <Camera className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">Camera stopped</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-900 text-white text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <img
            src={`${getAthleteCoachApiUrl().replace(/\/$/, '')}/api/live-camera/video_feed`}
            alt="Live camera"
            className={`w-full h-full ${fill ? 'object-cover' : 'object-contain'}`}
            onError={handleError}
            onLoad={handleLoad}
          />
        )}
        {loaded && !error && !stopped && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-white text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>
    </div>
  );
}
