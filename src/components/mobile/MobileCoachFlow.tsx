import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Camera, 
  Video, 
  Home,
  Users,
  Settings,
  ChevronRight,
  Play,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Mail
} from 'lucide-react';
import { 
  MobileRecordVideo, 
  MobileLiveRecording, 
  MobileAlertsList, 
  MobileQuickActions,
  MobileAthleteDetail 
} from './MobileCoachFlowPart2';
import { MobileLiveSession } from './MobileLiveSession';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { BrevoService } from '../../services/brevo';
import { getAllAthletes } from '../../services/athleteCoachService';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useUser } from '../../contexts/UserContext';

/** Screens that require login - temporarily disabled for dev */
const PROTECTED_SCREENS: number[] = [];

export function MobileCoachFlow({ 
  currentScreen, 
  onNavigate 
}: { 
  currentScreen: number;
  onNavigate: (screen: number) => void;
}) {
  const { isAuthenticated } = useAuth();
  const [showLiveSession, setShowLiveSession] = useState(false);
  const [liveSessionCallId, setLiveSessionCallId] = useState<string | null>(null);
  const [liveSessionAthleteId, setLiveSessionAthleteId] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<{ athlete_id: string; athlete_name: string } | null>(null);
  const [rosterAthletes, setRosterAthletes] = useState<Array<{ athlete_id: string; athlete_name: string }>>([]);

  const handleStartLiveSession = useCallback(async () => {
    const athleteId = selectedAthlete?.athlete_id ?? rosterAthletes[0]?.athlete_id ?? 'athlete_001';
    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setLiveSessionCallId(callId);
    setLiveSessionAthleteId(athleteId);
    setShowLiveSession(true);
  }, [selectedAthlete?.athlete_id, rosterAthletes]);

  const handleCloseLiveSession = () => {
    setShowLiveSession(false);
    setLiveSessionCallId(null);
    setLiveSessionAthleteId(null);
  };

  const wrappedOnNavigate = (screen: number) => {
    if (!isAuthenticated && PROTECTED_SCREENS.includes(screen)) {
      onNavigate(0);
    } else {
      if (screen !== 2) setSelectedAthlete(null);
      onNavigate(screen);
    }
  };

  const handleSelectAthlete = (athlete: { athlete_id: string; athlete_name: string }) => {
    setSelectedAthlete(athlete);
    onNavigate(2);
  };

  useEffect(() => {
    if (!isAuthenticated && PROTECTED_SCREENS.includes(currentScreen)) {
      onNavigate(0);
    }
  }, [isAuthenticated, currentScreen, onNavigate]);

  const effectiveScreen = !isAuthenticated && PROTECTED_SCREENS.includes(currentScreen)
    ? 0
    : currentScreen;

  if (showLiveSession) {
    return (
      <MobileLiveSession
        callId={liveSessionCallId}
        athleteId={liveSessionAthleteId}
        onClose={handleCloseLiveSession}
      />
    );
  }

  const screens = [
    <MobileCoachLogin key="login" onNavigate={wrappedOnNavigate} />,
    <MobileTeamRoster
      key="roster"
      onNavigate={wrappedOnNavigate}
      onSelectAthlete={handleSelectAthlete}
      onRosterLoaded={setRosterAthletes}
    />,
    selectedAthlete ? (
      <MobileAthleteDetail
        key="athlete-detail"
        athlete={selectedAthlete}
        athletes={rosterAthletes}
        onBack={() => {
          setSelectedAthlete(null);
          onNavigate(1);
        }}
        onNavigate={wrappedOnNavigate}
      />
    ) : (
      <MobileAthleteProfile key="profile" onNavigate={wrappedOnNavigate} />
    ),
    <MobileRecordVideo key="record" onStartLiveSession={handleStartLiveSession} onNavigate={wrappedOnNavigate} />,
    <MobileLiveRecording key="live" onNavigate={wrappedOnNavigate} />,
    <MobileAlertsList key="alert" onNavigate={wrappedOnNavigate} />,
    <MobileQuickActions key="actions" onStartLiveSession={handleStartLiveSession} onNavigate={wrappedOnNavigate} />
  ];

  return screens[effectiveScreen];
}

// Mobile Coach Login
function MobileCoachLogin({ onNavigate }: { onNavigate: (screen: number) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Google login successful:', user.email);
      
      // Store user info
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userName', user.displayName || '');
      
      // Navigate to Team Roster after successful login
      onNavigate(1);
    } catch (err: any) {
      console.error('Google login error:', err);
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Login successful:', user.email);
      
      // Store user info if needed
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('userId', user.uid);
      
      // Navigate to Team Roster after successful login
      onNavigate(1);
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = err.message || 'Login failed. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Status Bar */}
      <div className="bg-white px-6 pt-4 pb-2">
        <div className="flex justify-between items-center text-xs">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 border border-gray-400 rounded-sm" />
            <div className="w-4 h-3 border border-gray-400 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-gray-900 rounded-2xl mb-6 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">ML</span>
        </div>
        <h1 className="text-2xl text-gray-900 mb-2 text-center">MotionLabs</h1>
        <p className="text-gray-600 text-sm mb-8 text-center">Coach Portal</p>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="w-full space-y-4">
          <div>
            <label className="block text-gray-700 text-sm mb-2">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@school.edu"
              className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-2">Organization</label>
            <div className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 flex items-center justify-between">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Select your school"
                className="flex-1 outline-none bg-transparent text-gray-400"
                disabled={loading}
              />
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-12 bg-blue-600 text-white rounded-xl font-medium mt-6 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full h-12 bg-white border-2 border-gray-300 rounded-xl font-medium flex items-center justify-center gap-3 active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              'Signing in with Google...'
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700">Continue with Google</span>
              </>
            )}
          </button>

          <button 
            type="button"
            className="w-full text-blue-600 text-sm mt-4 active:opacity-70"
            disabled={loading || googleLoading}
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}

interface RosterAthlete {
  athlete_id: string;
  athlete_name: string;
  status?: 'alert' | 'monitor' | 'normal';
  activity?: string;
}

// Mobile Team Roster — fetches athletes from API
function MobileTeamRoster({
  onNavigate,
  onSelectAthlete,
  onRosterLoaded,
}: {
  onNavigate: (screen: number) => void;
  onSelectAthlete?: (athlete: { athlete_id: string; athlete_name: string }) => void;
  onRosterLoaded?: (athletes: Array<{ athlete_id: string; athlete_name: string }>) => void;
}) {
  const { user: authUser } = useAuth();
  const { user } = useUser();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [athleteEmail, setAthleteEmail] = useState('');
  const [athleteName, setAthleteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [athletes, setAthletes] = useState<RosterAthlete[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);

  const fetchRoster = useCallback(async () => {
    setLoadingRoster(true);
    try {
      const res = (await getAllAthletes({ limit: 100 })) as
        | { athletes?: Array<{ athlete_id?: string; athlete_name?: string; status?: string }> }
        | Array<{ athlete_id?: string; athlete_name?: string }>;
      const raw = Array.isArray((res as { athletes?: unknown[] })?.athletes)
        ? (res as { athletes: Array<{ athlete_id?: string; athlete_name?: string; status?: string }> }).athletes
        : Array.isArray(res)
          ? (res as Array<{ athlete_id?: string; athlete_name?: string }>)
          : [];
      const list = raw.map((a) => ({
        athlete_id: a.athlete_id ?? '',
        athlete_name: a.athlete_name ?? a.athlete_id ?? 'Unknown',
        status: (a as { status?: string }).status as 'alert' | 'monitor' | 'normal' | undefined,
        activity: (a as { activity?: string }).activity,
      }));
      setAthletes(list);
      onRosterLoaded?.(list.map(({ athlete_id, athlete_name }) => ({ athlete_id, athlete_name })));
    } catch {
      setAthletes([]);
      onRosterLoaded?.([]);
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleSendInvite = async () => {
    if (!athleteEmail) {
      setError('Please enter an athlete email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(athleteEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!authUser || !user) {
      setError('User information not available');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Generate invitation link
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      const invitationLink = `${baseUrl}/?invite=${invitationToken}&mode=signup`;

      // Send invitation via Brevo
      const result = await BrevoService.sendAthleteInvitation({
        coachName: user.fullName || authUser.fullName || 'Coach',
        coachEmail: user.email || authUser.email || '',
        athleteEmail: athleteEmail.trim(),
        athleteName: athleteName.trim() || undefined,
        institution: user.institution || undefined,
        invitationLink
      });

      if (result.success) {
        setSuccess(true);
        setAthleteEmail('');
        setAthleteName('');
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowInviteModal(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to send invitation. Please try again.');
      }
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl text-gray-900">Team Roster</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate(5)}
              className="w-10 h-10 flex items-center justify-center relative active:bg-gray-100 rounded-lg"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="w-10 h-10 flex items-center justify-center active:bg-gray-100 rounded-lg"
            >
              <Plus className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search athletes..."
            className="w-full h-10 border border-gray-300 rounded-lg pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      {/* Stats Pills */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2">
          <div className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white rounded-full text-sm">
            All ({athletes.length})
          </div>
          <div className="flex-shrink-0 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm">
            Alert ({athletes.filter((a) => a.status === 'alert').length})
          </div>
          <div className="flex-shrink-0 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full text-sm">
            Monitor ({athletes.filter((a) => a.status === 'monitor').length})
          </div>
          <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm">
            Normal ({athletes.filter((a) => a.status === 'normal' || !a.status).length})
          </div>
        </div>
      </div>

      {/* Athlete Cards - from API */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {loadingRoster ? (
            <div className="py-8 text-center text-gray-500 text-sm">Loading roster...</div>
          ) : athletes.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No athletes in roster. Add athletes via the API or invite flow.
            </div>
          ) : (
            athletes.map((a) => {
              const isAlert = a.status === 'alert';
              const isMonitor = a.status === 'monitor';
              const borderClass = isAlert
                ? 'border-red-300'
                : isMonitor
                  ? 'border-yellow-300'
                  : 'border-blue-200';
              const statusColor = isAlert ? 'bg-red-500' : isMonitor ? 'bg-yellow-500' : 'bg-blue-500';
              const bgClass = isAlert ? 'active:bg-red-50' : isMonitor ? 'active:bg-yellow-50' : 'active:bg-blue-50';
              return (
                <button
                  key={a.athlete_id}
                  onClick={() => onSelectAthlete?.({ athlete_id: a.athlete_id, athlete_name: a.athlete_name }) ?? onNavigate(2)}
                  className={`w-full bg-white border-2 ${borderClass} rounded-2xl p-4 ${bgClass} text-left`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-900 font-medium truncate">{a.athlete_name || a.athlete_id}</p>
                        <div className={`w-2 h-2 ${statusColor} rounded-full flex-shrink-0`} />
                      </div>
                      <p className="text-gray-600 text-sm">{a.activity || a.athlete_id}</p>
                      {!isAlert && !isMonitor && (
                        <p className="text-blue-600 text-xs mt-1">All metrics normal</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                  {isAlert && (
                    <div className="bg-red-50 rounded-lg px-3 py-2 mt-3">
                      <p className="text-red-800 text-xs">Needs review</p>
                    </div>
                  )}
                  {isMonitor && (
                    <div className="bg-yellow-50 rounded-lg px-3 py-2 mt-3">
                      <p className="text-yellow-800 text-xs">Monitor metrics</p>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Padding for Tab Bar */}
        <div className="h-20" />
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 safe-area-bottom">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => onNavigate(1)}
            className="flex flex-col items-center py-2 text-blue-600 active:opacity-70"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Roster</span>
          </button>
          <button 
            onClick={() => onNavigate(3)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button 
            onClick={() => onNavigate(5)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button 
            onClick={() => onNavigate(6)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>

      {/* Invite Athlete Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Invite Athlete</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setError(null);
                  setSuccess(false);
                  setAthleteEmail('');
                  setAthleteName('');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation Sent!</h3>
                <p className="text-gray-600 text-sm">
                  An invitation email has been sent to {athleteEmail}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Athlete Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={athleteEmail}
                      onChange={(e) => setAthleteEmail(e.target.value)}
                      placeholder="athlete@example.com"
                      className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Athlete Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={athleteName}
                      onChange={(e) => setAthleteName(e.target.value)}
                      placeholder="First Last"
                      className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowInviteModal(false);
                        setError(null);
                        setAthleteEmail('');
                        setAthleteName('');
                      }}
                      className="flex-1 h-12 border-2 border-gray-300 rounded-xl font-medium text-gray-700 active:bg-gray-50 disabled:opacity-50"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendInvite}
                      disabled={loading || !athleteEmail}
                      className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-medium active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Invite
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Athlete Profile
function MobileAthleteProfile({ onNavigate }: { onNavigate: (screen: number) => void }) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => onNavigate(1)}
            className="w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg text-gray-900 flex-1">Athlete Profile</h1>
          <button className="text-blue-600 text-sm font-medium active:opacity-70">
            Edit
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Athlete Header Card */}
        <div className="bg-white px-4 py-5 border-b border-gray-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl text-gray-900">Sarah Johnson</h2>
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </div>
              <p className="text-gray-600 text-sm mb-1">16 • Central HS</p>
              <p className="text-gray-500 text-xs">Level 9 • Vault/Floor</p>
            </div>
          </div>

          {/* Status Banner */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
            <p className="text-yellow-900 text-sm">
              <strong>Status:</strong> Monitoring knee valgus deviation
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <p className="text-gray-700 text-sm mb-3 font-medium">Quick Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-700 text-xs mb-1">Knee Valgus</p>
              <p className="text-red-900 text-xl font-semibold">18°</p>
              <p className="text-red-600 text-xs">↑50% baseline</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-700 text-xs mb-1">Landing Bend</p>
              <p className="text-blue-900 text-xl font-semibold">45°</p>
              <p className="text-blue-600 text-xs">Normal</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-700 text-xs mb-1">Hip Flexion</p>
              <p className="text-blue-900 text-xl font-semibold">82°</p>
              <p className="text-blue-600 text-xs">Normal</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-700 text-xs mb-1">Jump Height</p>
              <p className="text-blue-900 text-xl font-semibold">24"</p>
              <p className="text-blue-600 text-xs">Normal</p>
            </div>
          </div>
        </div>

        {/* Trend Charts */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <p className="text-gray-700 text-sm mb-3 font-medium">7-Day Trends</p>
          
          {/* Simplified Mobile Chart */}
          <div className="bg-gray-50 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-700 text-xs">Knee Valgus</p>
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
            <div className="h-20 flex items-end gap-1">
              {[45, 48, 50, 55, 60, 70, 75].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-red-400 rounded-t"
                  style={{ height: `${(height / 75) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>7d ago</span>
              <span className="text-red-600">↑ Worsening</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-700 text-xs">Landing Quality</p>
              <div className="w-4 h-4 rounded-full bg-blue-500" />
            </div>
            <div className="h-20 flex items-end gap-1">
              {[60, 58, 62, 60, 58, 60, 62].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-blue-400 rounded-t"
                  style={{ height: `${(height / 70) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>7d ago</span>
              <span className="text-blue-600">→ Stable</span>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white px-4 py-4">
          <p className="text-gray-700 text-sm mb-3 font-medium">Recent Alerts</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm mb-1">Knee valgus deviation</p>
                <p className="text-gray-600 text-xs">2 days ago • 6 clips</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm mb-1">Form improvement noted</p>
                <p className="text-gray-600 text-xs">5 days ago • Resolved</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => onNavigate(1)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Roster</span>
          </button>
          <button 
            onClick={() => onNavigate(3)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Record</span>
          </button>
          <button 
            onClick={() => onNavigate(5)}
            className="flex flex-col items-center py-2 text-gray-400 active:opacity-70"
          >
            <Bell className="w-6 h-6 mb-1" />
            <span className="text-xs">Alerts</span>
          </button>
          <button 
            onClick={() => onNavigate(6)}
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