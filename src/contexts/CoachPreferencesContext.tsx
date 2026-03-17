'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'motionlabs_coach_webapp_version';

interface CoachPreferencesContextType {
  /** When true, coach sees the web app (desktop) version instead of mobile. */
  coachUseWebApp: boolean;
  setCoachUseWebApp: (value: boolean) => void;
}

const CoachPreferencesContext = createContext<CoachPreferencesContextType | undefined>(undefined);

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function CoachPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [coachUseWebApp, setCoachUseWebAppState] = useState(readStored);

  const setCoachUseWebApp = useCallback((value: boolean) => {
    setCoachUseWebAppState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch (_) {}
  }, []);

  useEffect(() => {
    const stored = readStored();
    if (stored !== coachUseWebApp) setCoachUseWebAppState(stored);
  }, []);

  return (
    <CoachPreferencesContext.Provider value={{ coachUseWebApp, setCoachUseWebApp }}>
      {children}
    </CoachPreferencesContext.Provider>
  );
}

export function useCoachPreferences(): CoachPreferencesContextType {
  const ctx = useContext(CoachPreferencesContext);
  if (ctx === undefined) {
    throw new Error('useCoachPreferences must be used within CoachPreferencesProvider');
  }
  return ctx;
}
