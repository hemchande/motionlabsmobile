import React, { useState } from 'react';
import { Smartphone, X } from 'lucide-react';

const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/** Shown only in dev when viewing on computer (localhost) to help with "can't connect" on phone */
export function PhoneTestBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (!isDev || !isLocalhost || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 text-sm shadow-md">
      <div className="flex items-start gap-2 p-3 max-w-xl mx-auto">
        <Smartphone className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Testing on your phone?</p>
          <p className="mt-1">
            In the project folder run: <code className="bg-amber-600/30 px-1 rounded">npm run phone-url</code> — then
            open that URL on your phone (same Wi‑Fi).
          </p>
          <p className="mt-1">
            <strong>Phone says &quot;can&apos;t connect&quot;?</strong> On this Mac: System Settings → Network →
            Firewall → Options → set <strong>Terminal</strong> to &quot;Allow incoming connections&quot;.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-amber-600/30 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
