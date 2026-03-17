import React, { useState } from 'react';
import { LogOut, User, UserCircle, Dumbbell, Smartphone, Monitor, ArrowLeft } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { useCoachPreferences } from '../contexts/CoachPreferencesContext';
import { CoachWebAppProvider } from '../contexts/CoachWebAppContext';
import { useIsMobile } from './ui/use-mobile';
import { MobileCoachFlow } from './mobile/MobileCoachFlow';
import { MobileAthleteFlow } from './mobile/MobileAthleteFlow';
import { GoogleProfileCompletion } from './mobile/GoogleProfileCompletion';
import { CoachFlowEnhanced } from './CoachFlowEnhanced';

/** Auth protection enabled - users must sign in to navigate */
const SKIP_AUTH_TEMPORARILY = false;

const flows = {
  coach: {
    name: 'Coach Flow (Mobile)',
    screens: [
      'Mobile Login',
      'Team Roster (Mobile)',
      'Athlete Profile (Mobile)',
      'Record Video (Mobile)',
      'Live Recording (Mobile)',
      'Alert Detail (Mobile)',
      'Quick Actions (Mobile)'
    ]
  },
  athlete: {
    name: 'Athlete Flow (Mobile)',
    screens: [
      'Mobile Login',
      'Home (no roster)',
      '—',
      'Record Video',
      'Live Recording',
      'Alerts',
      'Quick Actions'
    ]
  }
};

/** Sign-in role picker: choose Coach or Athlete before seeing the login form */
function SignInRolePicker({
  onSelectCoach,
  onSelectAthlete,
}: {
  onSelectCoach: () => void;
  onSelectAthlete: () => void;
}) {
  const { coachUseWebApp, setCoachUseWebApp } = useCoachPreferences();
  const handleStartFresh = () => {
    const base = window.location.pathname + (window.location.hash || '');
    window.location.href = base + (base.includes('?') ? '&' : '?') + 'clear_auth=1';
  };
  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">MotionLabs AI</h1>
      <p className="text-gray-600 text-sm mb-6">Sign in to continue</p>
      <div className="w-full max-w-xs flex flex-col gap-4">
        <button
          type="button"
          onClick={onSelectCoach}
          className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium hover:border-blue-500 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors"
        >
          <UserCircle className="w-6 h-6 text-blue-600" />
          Sign in as Coach
        </button>
        {/* Web app view option for coach: set before signing in */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Web app view (coach)</p>
              <p className="text-xs text-gray-500">Desktop-style dashboard after sign-in</p>
            </div>
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
        <button
          type="button"
          onClick={onSelectAthlete}
          className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium hover:border-green-500 hover:bg-green-50/50 active:bg-green-100/50 transition-colors"
        >
          <Dumbbell className="w-6 h-6 text-green-600" />
          Sign in as Athlete
        </button>
      </div>
      <button
        type="button"
        onClick={handleStartFresh}
        className="mt-8 text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Start fresh (clear cache & sign out)
      </button>
    </div>
  );
}

/** Coach web app login: same as mobile (Google + email/password) so auth context updates after sign-in */
function CoachWebAppLoginView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged in FirebaseAuthContext will run and set user → isAuthenticated
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'auth/popup-closed-by-user') setError('Sign-in popup was closed. Please try again.');
      else if (e?.code === 'auth/popup-blocked') setError('Popup was blocked. Please allow popups and try again.');
      else if (e?.code === 'auth/operation-not-allowed') setError('Google sign-in is not enabled.');
      else setError(e?.message ?? 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged will run and set user
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password')
        setError('Incorrect email or password. If you use Google, use "Continue with Google" instead.');
      else if (e?.code === 'auth/user-not-found') setError('No account found. Use Google or sign up.');
      else setError(e?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">MotionLabs AI</h1>
          <p className="text-gray-600 text-sm mt-1">Coach web app — sign in</p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
        )}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com"
              className="w-full h-11 border-2 border-gray-300 rounded-lg px-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || googleLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 border-2 border-gray-300 rounded-lg px-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || googleLoading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-11 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in with email'}
          </button>
        </form>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-gray-500 text-xs">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full h-11 bg-white border-2 border-gray-300 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Signing in with Google…' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}

/** Web app (desktop-style) view for coach when "Use web app version" is on (Figma: MotionLabs AI webapp) */
function CoachWebAppView({ onSwitchToMobile }: { onSwitchToMobile: () => void }) {
  const [webScreen, setWebScreen] = useState(3); // 3 = Athlete Roster List (CoachFlowEnhanced)
  const { user, firebaseUser, isAuthenticated, loading } = useAuth();
  const coachId = user?.id ?? firebaseUser?.uid;
  return (
    <CoachWebAppProvider setWebScreen={setWebScreen}>
      <div className="h-full flex flex-col bg-gray-50">
        <header className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 bg-white border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">MotionLabs AI</h1>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 min-w-0 max-w-[200px] sm:max-w-none">
              <div className="font-medium text-gray-700">Auth context</div>
              {loading ? (
                <span>Loading…</span>
              ) : isAuthenticated && (user || firebaseUser) ? (
                <>
                  <div className="truncate" title={user?.fullName ?? (firebaseUser as { displayName?: string })?.displayName ?? ''}>
                    {user?.fullName ?? (firebaseUser as { displayName?: string })?.displayName ?? '—'}
                  </div>
                  <div className="truncate" title={user?.email ?? firebaseUser?.email ?? ''}>
                    {user?.email ?? firebaseUser?.email ?? '—'}
                  </div>
                  <div className="text-gray-500 truncate" title={coachId ?? ''}>ID: {coachId ? `${coachId.slice(0, 8)}…` : '—'}</div>
                </>
              ) : (
                <span>Not signed in</span>
              )}
            </div>
            <button
              type="button"
              onClick={onSwitchToMobile}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Switch to mobile
            </button>
          </div>
        </header>
        <nav className="shrink-0 flex gap-1 px-2 py-2 bg-white border-b border-gray-100 overflow-x-auto">
          {[
            { label: 'Roster', screen: 3 },
            { label: 'Record', screen: 5 },
            { label: 'Alerts', screen: 7 },
            { label: 'Dashboard', screen: 9 },
            { label: 'Settings', screen: 10 },
          ].map(({ label, screen }) => (
            <button
              key={screen}
              type="button"
              onClick={() => setWebScreen(screen)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                webScreen === screen ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-auto">
          <CoachFlowEnhanced currentScreen={webScreen} />
        </div>
      </div>
    </CoachWebAppProvider>
  );
}

/** Inner content shared by both mobile (full viewport) and desktop (frame) layouts */
function MobileAppContent({
  activeFlow,
  currentScreen,
  setCurrentScreen,
  setActiveFlow,
  skipAuth,
  needsProfileCompletion,
}: {
  activeFlow: 'coach' | 'athlete';
  currentScreen: number;
  setCurrentScreen: (n: number) => void;
  setActiveFlow: (f: 'coach' | 'athlete') => void;
  skipAuth: boolean;
  needsProfileCompletion: boolean;
}) {
  if (!skipAuth && needsProfileCompletion) {
    return (
      <GoogleProfileCompletion
        onComplete={(role) => {
          setActiveFlow(role);
          setCurrentScreen(1);
        }}
      />
    );
  }
  if (activeFlow === 'coach') {
    return (
      <MobileCoachFlow
        currentScreen={currentScreen}
        onNavigate={(screen: number) => setCurrentScreen(screen)}
      />
    );
  }
  return (
    <MobileAthleteFlow
      currentScreen={currentScreen}
      onNavigate={(screen: number) => setCurrentScreen(screen)}
    />
  );
}

export function MobileApp() {
  const { user, needsProfileCompletion, needsPhotoCompletion, isAuthenticated, logout, firebaseUser } = useAuth();
  const { coachUseWebApp, setCoachUseWebApp } = useCoachPreferences();
  const skipAuth = SKIP_AUTH_TEMPORARILY;
  const isMobile = useIsMobile();
  const [activeFlow, setActiveFlow] = useState<'coach' | 'athlete'>('coach');
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showSignInRolePicker, setShowSignInRolePicker] = useState(true);

  const hasValidUserInFirestore = !!user && !!user.role && !!user.fullName;
  const showRolePicker =
    !skipAuth &&
    (!isAuthenticated || !hasValidUserInFirestore) &&
    showSignInRolePicker;
  const showCoachWebAppGate = !showRolePicker && activeFlow === 'coach' && coachUseWebApp;

  const handleLogout = async () => {
    const confirmed = confirm('Are you sure you want to log out?');
    if (confirmed) {
      await logout();
      setCurrentScreen(0);
      setShowSignInRolePicker(true);
    }
  };

  const handleFlowChange = (flow: 'coach' | 'athlete') => {
    setActiveFlow(flow);
    setCurrentScreen(0);
  };

  /* Mobile: coach web app = login (if not signed in) → web app. Coach does not need profile completion. */
  if (isMobile) {
    if (showCoachWebAppGate) {
      const notSignedIn = !firebaseUser && !user;
      if (notSignedIn) {
        return (
          <div className="min-h-screen min-h-[100dvh] w-full bg-gray-50" style={{ paddingTop: 'var(--safe-area-inset-top, 0px)' }}>
            <CoachWebAppLoginView onBack={() => setShowSignInRolePicker(true)} />
          </div>
        );
      }
      return (
        <div
          className="min-h-screen min-h-[100dvh] w-full bg-gray-50 flex flex-col"
          style={{
            paddingTop: 'var(--safe-area-inset-top, 0px)',
            paddingRight: 'var(--safe-area-inset-right, 0px)',
            paddingBottom: 'var(--safe-area-inset-bottom, 0px)',
            paddingLeft: 'var(--safe-area-inset-left, 0px)',
          }}
        >
          <div className="flex-1 overflow-auto">
            <CoachWebAppView onSwitchToMobile={() => setCoachUseWebApp(false)} />
          </div>
        </div>
      );
    }
    return (
      <div
        className="min-h-screen min-h-[100dvh] bg-white flex flex-col"
        style={{
          paddingTop: 'var(--safe-area-inset-top, 0px)',
          paddingRight: 'var(--safe-area-inset-right, 0px)',
          paddingBottom: 'var(--safe-area-inset-bottom, 0px)',
          paddingLeft: 'var(--safe-area-inset-left, 0px)',
        }}
      >
        {/* Top bar: hidden on role picker; Coach/Athlete tabs + user info when signed in */}
        {!showRolePicker && (
        <div className="shrink-0 border-b border-gray-200 bg-gray-50">
          {isAuthenticated && (firebaseUser || user) && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <User className="w-4 h-4 text-gray-600 shrink-0" />
                <span className="text-sm text-gray-700 truncate">
                  {user?.fullName || firebaseUser?.displayName || firebaseUser?.email || 'User'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const base = window.location.pathname + (window.location.hash || '');
                  window.location.href = base + (base.includes('?') ? '&' : '?') + 'clear_auth=1';
                }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Start fresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
          {!showRolePicker && (
            <div className="flex">
              <button
                type="button"
                onClick={() => handleFlowChange('coach')}
                className={`flex-1 min-h-[44px] px-4 py-3 text-sm font-medium transition-colors ${
                  activeFlow === 'coach'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Coach
              </button>
              <button
                type="button"
                onClick={() => handleFlowChange('athlete')}
                className={`flex-1 min-h-[44px] px-4 py-3 text-sm font-medium transition-colors ${
                  activeFlow === 'athlete'
                    ? 'bg-white text-green-600 border-b-2 border-green-600 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Athlete
              </button>
            </div>
          )}
        </div>
        )}
        <div className="flex-1 overflow-auto">
          {showRolePicker ? (
            <SignInRolePicker
              onSelectCoach={() => {
                setActiveFlow('coach');
                setShowSignInRolePicker(false);
              }}
              onSelectAthlete={() => {
                setActiveFlow('athlete');
                setShowSignInRolePicker(false);
              }}
            />
          ) : (
            <MobileAppContent
              activeFlow={activeFlow}
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              setActiveFlow={setActiveFlow}
              skipAuth={skipAuth}
              needsProfileCompletion={!!needsProfileCompletion}
            />
          )}
        </div>
      </div>
    );
  }

  /* Coach web app: login (same as mobile) → web app. Coach does not need profile completion. */
  if (showCoachWebAppGate) {
    const notSignedIn = !firebaseUser && !user;
    if (notSignedIn) {
      return (
        <div className="min-h-screen min-h-[100dvh] w-full bg-gray-50 flex flex-col">
          <CoachWebAppLoginView onBack={() => setShowSignInRolePicker(true)} />
        </div>
      );
    }
    return (
      <div className="min-h-screen min-h-[100dvh] w-full bg-gray-50 flex flex-col">
        <div className="flex-1 overflow-auto">
          <CoachWebAppView onSwitchToMobile={() => setCoachUseWebApp(false)} />
        </div>
      </div>
    );
  }

  /* Desktop: device frame (iPhone mockup) for mobile-style content only */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="relative">
        <div className="w-[390px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10" />
          <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ height: '844px' }}>
            {showRolePicker ? (
              <SignInRolePicker
                onSelectCoach={() => {
                  setActiveFlow('coach');
                  setShowSignInRolePicker(false);
                }}
                onSelectAthlete={() => {
                  setActiveFlow('athlete');
                  setShowSignInRolePicker(false);
                }}
              />
            ) : (
              <MobileAppContent
                activeFlow={activeFlow}
                currentScreen={currentScreen}
                setCurrentScreen={setCurrentScreen}
                setActiveFlow={setActiveFlow}
                skipAuth={skipAuth}
                needsProfileCompletion={!!needsProfileCompletion}
              />
            )}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
