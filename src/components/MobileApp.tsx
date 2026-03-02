import React, { useState } from 'react';
import { LogOut, User, UserCircle, Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { useIsMobile } from './ui/use-mobile';
import { MobileCoachFlow } from './mobile/MobileCoachFlow';
import { MobileAthleteFlow } from './mobile/MobileAthleteFlow';
import { GoogleProfileCompletion } from './mobile/GoogleProfileCompletion';

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
  const handleStartFresh = () => {
    const base = window.location.pathname + (window.location.hash || '');
    window.location.href = base + (base.includes('?') ? '&' : '?') + 'clear_auth=1';
  };
  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">MotionLabs AI</h1>
      <p className="text-gray-600 text-sm mb-8">Sign in to continue</p>
      <div className="w-full max-w-xs flex flex-col gap-4">
        <button
          type="button"
          onClick={onSelectCoach}
          className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 font-medium hover:border-blue-500 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors"
        >
          <UserCircle className="w-6 h-6 text-blue-600" />
          Sign in as Coach
        </button>
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

  if (isMobile) {
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
          {/* User info and logout (if authenticated) */}
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
          
          {/* Coach / Athlete switcher - hidden when showing role picker */}
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

  /* Desktop: device frame + development controls */
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
