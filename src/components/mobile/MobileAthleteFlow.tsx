import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Play,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Settings,
  User,
  Video,
  Home,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/FirebaseAuthContext';

/** Screens that require login - temporarily disabled for dev */
const ATHLETE_PROTECTED_SCREENS: number[] = [];

export function MobileAthleteFlow({ currentScreen, onNavigate }: { currentScreen: number; onNavigate?: (screen: number) => void }) {
  const { isAuthenticated } = useAuth();

  const wrappedOnNavigate = (screen: number) => {
    if (!isAuthenticated && ATHLETE_PROTECTED_SCREENS.includes(screen)) {
      onNavigate?.(0);
    } else {
      onNavigate?.(screen);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && ATHLETE_PROTECTED_SCREENS.includes(currentScreen) && onNavigate) {
      onNavigate(0);
    }
  }, [isAuthenticated, currentScreen, onNavigate]);

  const effectiveScreen = !isAuthenticated && ATHLETE_PROTECTED_SCREENS.includes(currentScreen)
    ? 0
    : currentScreen;

  const screens = [
    <MobileAthleteLogin key="login" />,
    <MobileAthleteProfile key="profile" />,
    <MobileMyClips key="clips" />,
    <MobileClipConfirmation key="confirmation" />
  ];

  return screens[effectiveScreen];
}

// Mobile Athlete Login
function MobileAthleteLogin() {
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
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Google login successful:', user.email);
      
      // Store user info
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userName', user.displayName || '');
      
      // You can navigate to athlete dashboard here if needed
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
      
      // You can navigate to athlete dashboard here if needed
      // For now, just show success
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
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* Status Bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex justify-between items-center text-xs text-gray-700">
          <span>9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 border border-gray-400 rounded-sm" />
            <div className="w-4 h-3 border border-gray-400 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-green-600 rounded-3xl mb-6 flex items-center justify-center shadow-lg">
          <User className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl text-gray-900 mb-2 text-center">MotionLabs</h1>
        <p className="text-gray-600 text-sm mb-8 text-center">Athlete Portal</p>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="w-full space-y-4">
          <div>
            <label className="block text-gray-700 text-sm mb-2">Email or Student ID</label>
            <input 
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.j@school.edu"
              className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base bg-white"
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
              className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base bg-white"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-12 bg-green-600 text-white rounded-xl font-medium mt-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full h-12 bg-white border-2 border-gray-300 rounded-xl font-medium flex items-center justify-center gap-3 active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
            className="w-full text-green-600 text-sm mt-4"
            disabled={loading || googleLoading}
          >
            Need Help Signing In?
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            First time? Ask your coach for login details
          </p>
        </div>
      </div>
    </div>
  );
}

// Mobile Athlete Profile
function MobileAthleteProfile() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-gray-900">My Profile</h1>
          <button className="w-10 h-10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="bg-white px-4 py-5 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <h2 className="text-xl text-gray-900 mb-1">Sarah Johnson</h2>
              <p className="text-gray-600 text-sm mb-1">16 • Central HS</p>
              <p className="text-gray-500 text-xs">Level 9 • Vault/Floor</p>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-blue-900 text-sm">
              <strong>Your Status:</strong> Your coach is monitoring some movement patterns. Keep up the good work!
            </p>
          </div>
        </div>

        {/* Ask Coach CTA */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <button className="w-full py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Ask Coach a Question
          </button>
        </div>

        {/* Performance Trends */}
        <div className="bg-white px-4 py-4 border-b border-gray-200">
          <p className="text-gray-900 text-sm mb-3 font-medium">Your Performance Trends</p>
          
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 text-xs">Knee Alignment</p>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="h-16 flex items-end gap-1">
                {[45, 48, 50, 55, 60, 58, 55].map((height, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${(height / 60) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-700 text-xs">Landing Form</p>
                <div className="w-4 h-4 rounded-full bg-blue-500" />
              </div>
              <div className="h-16 flex items-end gap-1">
                {[60, 58, 62, 60, 58, 60, 62].map((height, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-blue-400 rounded-t"
                    style={{ height: `${(height / 65) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-3 italic">
            These metrics show your movement patterns over time. They do not indicate injury or medical conditions.
          </p>
        </div>

        {/* Recent Activity */}
        <div className="bg-white px-4 py-4">
          <p className="text-gray-900 text-sm mb-3 font-medium">Recent Activity</p>
          <div className="space-y-2">
            {[
              { icon: '📹', activity: 'Practice session recorded', time: 'Today, 3:00 PM' },
              { icon: '🎬', activity: '3 new clips available', time: 'Today, 3:45 PM' },
              { icon: '👀', activity: 'Coach reviewed your vault form', time: 'Yesterday' },
              { icon: '✓', activity: 'Confirmed clips from practice', time: '3 days ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm">{item.activity}</p>
                  <p className="text-gray-500 text-xs">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-20" />
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center py-2 text-green-600">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Video className="w-6 h-6 mb-1" />
            <span className="text-xs">My Clips</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile My Clips
function MobileMyClips() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl text-gray-900 mb-3">My Clips</h1>
        <p className="text-gray-600 text-sm mb-3">
          Review clips from your practice sessions
        </p>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="flex-shrink-0 px-4 py-2 bg-green-600 text-white rounded-full text-sm">
            All Clips
          </button>
          <button className="flex-shrink-0 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full text-sm flex items-center gap-1">
            Need Review
            <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">3</span>
          </button>
          <button className="flex-shrink-0 px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm">
            Confirmed
          </button>
        </div>
      </div>

      {/* Clips Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { event: 'Vault Landing', time: 'Today, 2:34 PM', status: 'needs-review' },
            { event: 'Vault Approach', time: 'Today, 2:28 PM', status: 'needs-review' },
            { event: 'Floor Routine', time: 'Today, 2:15 PM', status: 'confirmed' },
            { event: 'Beam Dismount', time: 'Yesterday, 3:45 PM', status: 'confirmed' },
            { event: 'Vault Landing', time: '2 days ago, 4:20 PM', status: 'needs-review' },
            { event: 'Floor Tumbling', time: '3 days ago, 2:10 PM', status: 'confirmed' },
          ].map((clip, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="aspect-video bg-gray-200 flex items-center justify-center relative">
                <Play className="w-8 h-8 text-gray-500" />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  0:08
                </div>
                {clip.status === 'needs-review' && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Review
                  </div>
                )}
                {clip.status === 'confirmed' && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    ✓
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-gray-900 text-sm mb-1 truncate">{clip.event}</p>
                <p className="text-gray-500 text-xs mb-2">{clip.time}</p>
                {clip.status === 'needs-review' ? (
                  <button className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-medium">
                    Review
                  </button>
                ) : (
                  <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg text-xs">
                    View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Callout */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-blue-900 text-xs mb-1"><strong>Why confirm clips?</strong></p>
          <p className="text-blue-800 text-xs">
            Confirming your clips helps ensure accurate tracking of your movement patterns.
          </p>
        </div>

        <div className="h-20" />
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
          <button className="flex flex-col items-center py-2 text-green-600">
            <Video className="w-6 h-6 mb-1" />
            <span className="text-xs">My Clips</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Mobile Clip Confirmation with Skeletal Overlay
function MobileClipConfirmation() {
  const [skeletalOverlay, setSkeletalOverlay] = useState(true);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg text-gray-900">Is this you?</h1>
            <p className="text-gray-600 text-xs">Vault Landing • Jan 2, 2:34 PM</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Video Player */}
        <div className="bg-white px-4 py-4">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-white opacity-80" />
            </div>

            {/* Skeletal Overlay Indicator */}
            {skeletalOverlay && (
              <>
                {/* Simulated skeleton overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-32 h-48">
                    {/* Head */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-green-400 rounded-full" />
                    {/* Spine */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-32 bg-green-400" />
                    {/* Shoulders */}
                    <div className="absolute top-8 left-0 right-0 h-0.5 bg-green-400" />
                    {/* Left arm */}
                    <div className="absolute top-8 left-0 w-0.5 h-16 bg-green-400 -rotate-45" />
                    {/* Right arm */}
                    <div className="absolute top-8 right-0 w-0.5 h-16 bg-green-400 rotate-45" />
                    {/* Hips */}
                    <div className="absolute bottom-8 left-1/4 right-1/4 h-0.5 bg-green-400" />
                    {/* Left leg */}
                    <div className="absolute bottom-0 left-1/4 w-0.5 h-8 bg-yellow-400" />
                    {/* Right leg */}
                    <div className="absolute bottom-0 right-1/4 w-0.5 h-8 bg-yellow-400" />
                    {/* Knee markers */}
                    <div className="absolute bottom-4 left-1/4 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
                    <div className="absolute bottom-4 right-1/4 translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 bg-opacity-90 rounded text-white text-xs font-medium">
                  Skeletal Tracking ON
                </div>
              </>
            )}

            {/* Toggle Button */}
            <button 
              onClick={() => setSkeletalOverlay(!skeletalOverlay)}
              className="absolute top-3 right-3 w-9 h-9 bg-black bg-opacity-60 rounded-lg flex items-center justify-center"
            >
              {skeletalOverlay ? (
                <Eye className="w-5 h-5 text-white" />
              ) : (
                <EyeOff className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Time indicator */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black bg-opacity-70 rounded text-white text-xs">
              0:08
            </div>
          </div>

          {/* Overlay Toggle Info */}
          <div className="mt-3 flex items-center justify-between px-1">
            <p className="text-gray-600 text-xs">
              {skeletalOverlay ? 'Showing movement tracking' : 'Skeletal overlay hidden'}
            </p>
            <button 
              onClick={() => setSkeletalOverlay(!skeletalOverlay)}
              className="text-blue-600 text-xs font-medium"
            >
              {skeletalOverlay ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white px-4 py-4 border-t border-gray-200">
          <p className="text-gray-900 text-sm mb-3 font-medium">Session Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Date</p>
              <p className="text-gray-900">January 2, 2026</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Time</p>
              <p className="text-gray-900">2:34 PM</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Event</p>
              <p className="text-gray-900">Vault Landing</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Location</p>
              <p className="text-gray-900">Main Gym</p>
            </div>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="bg-white px-4 py-6 border-t border-gray-200">
          <p className="text-gray-900 text-sm mb-4 font-medium">Confirm this clip</p>
          <div className="space-y-3">
            <button className="w-full py-4 bg-green-600 text-white rounded-2xl font-medium flex items-center justify-center gap-3 active:bg-green-700">
              <ThumbsUp className="w-6 h-6" />
              <div className="text-left">
                <p className="text-sm">Yes, this is me</p>
              </div>
            </button>
            <button className="w-full py-4 bg-white border-2 border-red-300 text-red-700 rounded-2xl font-medium flex items-center justify-center gap-3 active:bg-red-50">
              <ThumbsDown className="w-6 h-6" />
              <div className="text-left">
                <p className="text-sm">Not me - Report</p>
              </div>
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-4">
          <p className="text-blue-900 text-xs mb-1"><strong>Privacy & Accuracy</strong></p>
          <p className="text-blue-800 text-xs">
            Your confirmation helps ensure accurate tracking. If you mark "Not me," your coach will be notified to review the athlete identification.
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <button className="text-gray-600">← Back to Clips</button>
            <p className="text-gray-500 text-xs">3 clips remaining</p>
            <button className="text-blue-600">Skip</button>
          </div>
        </div>

        <div className="h-20" />
      </div>

      {/* Bottom Tab Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
          <button className="flex flex-col items-center py-2 text-green-600">
            <Video className="w-6 h-6 mb-1" />
            <span className="text-xs">My Clips</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-400">
            <Settings className="w-6 h-6 mb-1" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
