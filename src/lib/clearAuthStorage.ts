/**
 * Clear all auth-related browser storage and sign out Firebase.
 * Use ?clear_auth=1 in the URL to run this and reload for a fresh start.
 */
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

const LOCAL_STORAGE_KEYS = [
  'userEmail',
  'userId',
  'userName',
  'mcpUser',
] as const;

const SESSION_STORAGE_KEYS = [
  'stream_user_id',
] as const;

export async function clearAuthAndStorage(): Promise<void> {
  try {
    for (const key of LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    for (const key of SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
    await signOut(auth);
  } catch (e) {
    console.warn('clearAuthAndStorage:', e);
  }
}

/**
 * If URL has ?clear_auth=1, clear storage + sign out, remove param and reload.
 * Call once at app entry so user can start completely fresh.
 */
export function clearAuthAndReloadIfRequested(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('clear_auth') !== '1') return false;

  params.delete('clear_auth');
  const newSearch = params.toString();
  const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
  clearAuthAndStorage().then(() => {
    window.history.replaceState(null, '', newUrl);
    window.location.reload();
  });
  return true;
}
