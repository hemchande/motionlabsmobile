/**
 * Video player for Cloudflare Stream / HLS URLs.
 * Uses iframe for Cloudflare Stream, or hls.js for generic HLS (.m3u8).
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play } from 'lucide-react';

/** Convert Cloudflare m3u8 URL to iframe embed URL */
function toCloudflareIframeUrl(m3u8Url: string): string | null {
  const match = m3u8Url.match(/https:\/\/customer-([^.]+)\.cloudflarestream\.com\/([^/]+)\//);
  if (match) {
    return `https://customer-${match[1]}.cloudflarestream.com/${match[2]}/iframe`;
  }
  return null;
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8') || url.includes('manifest/video');
}

interface StreamVideoPlayerProps {
  url: string;
  className?: string;
  title?: string;
}

export function StreamVideoPlayer({ url, className = '', title }: StreamVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useHls, setUseHls] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iframeUrl = toCloudflareIframeUrl(url);

  useEffect(() => {
    if (!url || iframeUrl) return;

    if (isHlsUrl(url) && Hls.isSupported() && videoRef.current) {
      setUseHls(true);
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('Failed to load video');
      });
      return () => hls.destroy();
    }

    if (isHlsUrl(url) && videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      setUseHls(true);
      if (videoRef.current) videoRef.current.src = url;
    }
  }, [url, iframeUrl]);

  if (!url) {
    return (
      <div className={`bg-gray-900 aspect-video rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">No video URL</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900 aspect-video rounded-lg flex items-center justify-center ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Open video in new tab
        </a>
      </div>
    );
  }

  if (iframeUrl) {
    return (
      <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
        <iframe
          src={iframeUrl}
          title={title ?? 'Session video'}
          className="w-full aspect-video"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (useHls) {
    return (
      <div className={`rounded-lg overflow-hidden bg-black ${className}`}>
        <video
          ref={videoRef}
          controls
          playsInline
          className="w-full aspect-video"
          src={url}
        />
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 aspect-video rounded-lg flex items-center justify-center ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 text-blue-500 hover:text-blue-400"
      >
        <Play className="w-12 h-12" />
        <span>Play video</span>
      </a>
    </div>
  );
}
