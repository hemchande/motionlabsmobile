/**
 * Base URL for the Athlete Coach API (port 8004).
 * - If VITE_ATHLETE_COACH_API_URL is set, use it.
 * - Otherwise use the same host as the current page with port 8004.
 *   So when the app is opened on a phone at http://192.168.x.x:3000,
 *   the API is called at http://192.168.x.x:8004 (your computer).
 */
export function getAthleteCoachApiUrl(): string {
  const env = (import.meta as unknown as { env?: { VITE_ATHLETE_COACH_API_URL?: string } }).env;
  if (env?.VITE_ATHLETE_COACH_API_URL) return env.VITE_ATHLETE_COACH_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8004`;
  }
  return 'http://localhost:8004';
}
