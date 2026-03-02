/**
 * Network debugging for Capacitor/iOS when requests don't reach the backend.
 *
 * In Safari Web Inspector (Develop → Simulator/Device → Your App):
 * 1. Enable request logging:   window.__CAPACITOR_NETWORK_DEBUG = true
 * 2. Test if any request leaves:   await window.__testBackendHealth()
 * 3. Check Console for [AthleteCoachAPI] and Network tab for the request.
 */
import { getAthleteCoachApiUrl } from './athleteCoachApiUrl';

export function enableNetworkDebug(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as { __CAPACITOR_NETWORK_DEBUG?: boolean }).__CAPACITOR_NETWORK_DEBUG = true;
    console.log('[NetworkDebug] Enabled. Athlete Coach API requests will log [AthleteCoachAPI] fetch START/DONE/FAILED.');
  }
}

export async function testBackendHealth(): Promise<{ ok: boolean; url: string; status?: number; error?: string }> {
  const base = getAthleteCoachApiUrl().replace(/\/$/, '');
  const url = `${base}/health`;
  console.log('[NetworkDebug] Testing backend reachability:', url);
  try {
    const start = Date.now();
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const elapsed = Date.now() - start;
    console.log('[NetworkDebug] Backend health response:', res.status, `${elapsed}ms`);
    if (!res.ok) {
      const text = await res.text();
      console.warn('[NetworkDebug] Non-OK response:', text?.slice(0, 200));
    }
    return { ok: res.ok, url, status: res.status };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.warn('[NetworkDebug] Backend health FAILED:', err);
    return { ok: false, url, error: err };
  }
}

declare global {
  interface Window {
    __CAPACITOR_NETWORK_DEBUG?: boolean;
    __testBackendHealth?: () => Promise<{ ok: boolean; url: string; status?: number; error?: string }>;
    __enableNetworkDebug?: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.__testBackendHealth = testBackendHealth;
  window.__enableNetworkDebug = enableNetworkDebug;
}
