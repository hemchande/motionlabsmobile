import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { useIsMobile } from './ui/use-mobile';
import { MobileCoachFlow } from './mobile/MobileCoachFlow';
import { MobileAthleteFlow } from './mobile/MobileAthleteFlow';
import { GoogleProfileCompletion } from './mobile/GoogleProfileCompletion';

/** Temporarily skip auth - allows navigation to all tabs without login. Set to false when auth is required. */
const SKIP_AUTH_TEMPORARILY = true;

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
      'My Profile (Mobile)',
      'My Clips (Mobile)',
      'Clip Confirmation (Mobile)'
    ]
  }
};

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
  const { needsProfileCompletion } = useAuth();
  const skipAuth = SKIP_AUTH_TEMPORARILY;
  const isMobile = useIsMobile();
  const [activeFlow, setActiveFlow] = useState<'coach' | 'athlete'>('coach');
  const [currentScreen, setCurrentScreen] = useState(0);

  const handlePrevScreen = () => {
    setCurrentScreen((prev) => Math.max(0, prev - 1));
  };

  const handleNextScreen = () => {
    const maxScreens = flows[activeFlow].screens.length;
    setCurrentScreen((prev) => Math.min(maxScreens - 1, prev + 1));
  };

  const handleFlowChange = (flow: 'coach' | 'athlete') => {
    setActiveFlow(flow);
    setCurrentScreen(0);
  };

  /* Mobile: full viewport with safe areas; dev controls only in development */
  const showMobileDevControls = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
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
        {/* Coach / Athlete switcher - min 44px touch targets */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
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
        <div className="flex-1 overflow-auto">
          <MobileAppContent
            activeFlow={activeFlow}
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
            setActiveFlow={setActiveFlow}
            skipAuth={skipAuth}
            needsProfileCompletion={!!needsProfileCompletion}
          />
        </div>

        {/* Development Controls - mobile: only in dev (npm run dev) */}
        {showMobileDevControls && (
          <div className="shrink-0 border-t border-gray-200 bg-gray-100 p-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Development Controls</h3>
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                type="button"
                onClick={handlePrevScreen}
                disabled={currentScreen === 0}
                className="min-h-[44px] px-3 py-2 rounded text-sm text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed bg-white border border-gray-300"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Prev
              </button>
              <div className="text-center min-w-0 flex-1">
                <p className="text-xs text-gray-500 truncate">
                  Screen {currentScreen + 1} of {flows[activeFlow].screens.length}
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">{flows[activeFlow].screens[currentScreen]}</p>
              </div>
              <button
                type="button"
                onClick={handleNextScreen}
                disabled={currentScreen === flows[activeFlow].screens.length - 1}
                className="min-h-[44px] px-3 py-2 rounded text-sm text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed bg-white border border-gray-300"
              >
                Next <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {flows[activeFlow].screens.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentScreen(index)}
                  className={`min-h-[44px] min-w-[44px] rounded-full transition-colors ${
                    index === currentScreen ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to screen ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
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
            <MobileAppContent
              activeFlow={activeFlow}
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              setActiveFlow={setActiveFlow}
              skipAuth={skipAuth}
              needsProfileCompletion={!!needsProfileCompletion}
            />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Development Controls - desktop only */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Development Controls</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleFlowChange('coach')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  activeFlow === 'coach'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Coach
              </button>
              <button
                onClick={() => handleFlowChange('athlete')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  activeFlow === 'athlete'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Athlete
              </button>
            </div>
          </div>

          {/* Screen Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevScreen}
              disabled={currentScreen === 0}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">
                Screen {currentScreen + 1} of {flows[activeFlow].screens.length}
              </p>
              <p className="text-sm text-gray-900 font-medium">{flows[activeFlow].screens[currentScreen]}</p>
            </div>

            <button
              onClick={handleNextScreen}
              disabled={currentScreen === flows[activeFlow].screens.length - 1}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed hover:text-gray-900 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Screen Dots */}
          <div className="flex justify-center gap-1.5">
            {flows[activeFlow].screens.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreen(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentScreen ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                aria-label={`Go to screen ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
