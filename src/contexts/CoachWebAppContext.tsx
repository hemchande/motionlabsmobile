/**
 * Coach Web App Context — provides roster, alerts, and selection state for the
 * web app view (CoachFlowEnhanced), wired to the Athlete Coach API and Firestore.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './FirebaseAuthContext';
import {
  getAllAthletes,
  getAllAlerts,
  getAllSessions,
  type AlertPayload,
} from '../services/athleteCoachService';

export interface RosterAthlete {
  athlete_id: string;
  athlete_name: string;
  status?: 'alert' | 'monitor' | 'normal';
  activity?: string;
  email?: string;
}

interface CoachWebAppState {
  coachId: string | undefined;
  roster: RosterAthlete[];
  rosterLoading: boolean;
  refreshRoster: () => Promise<void>;
  alerts: AlertPayload[];
  alertsLoading: boolean;
  refreshAlerts: () => Promise<void>;
  sessions: unknown[];
  sessionsLoading: boolean;
  refreshSessions: () => Promise<void>;
  selectedAthleteId: string | null;
  setSelectedAthleteId: (id: string | null) => void;
  selectedAlertId: string | null;
  setSelectedAlertId: (id: string | null) => void;
  setWebScreen: ((screen: number) => void) | null;
}

const CoachWebAppContext = createContext<CoachWebAppState | null>(null);

export function useCoachWebApp(): CoachWebAppState | null {
  return useContext(CoachWebAppContext);
}

export function CoachWebAppProvider({
  children,
  setWebScreen,
}: {
  children: React.ReactNode;
  setWebScreen: (screen: number) => void;
}) {
  const { user: authUser, firebaseUser } = useAuth();
  const coachIdFromAuth = authUser?.id ?? firebaseUser?.uid;
  const [roster, setRoster] = useState<RosterAthlete[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertPayload[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const refreshRoster = useCallback(async () => {
    setRosterLoading(true);
    try {
      const res = (await getAllAthletes({ limit: 100 })) as
        | { athletes?: Array<{ athlete_id?: string; athlete_name?: string; status?: string; email?: string; activity?: string }> }
        | Array<{ athlete_id?: string; athlete_name?: string; email?: string }>;
      const raw = Array.isArray((res as { athletes?: unknown[] })?.athletes)
        ? (res as { athletes: Array<{ athlete_id?: string; athlete_name?: string; status?: string; email?: string; activity?: string }> }).athletes
        : Array.isArray(res)
          ? (res as Array<{ athlete_id?: string; athlete_name?: string; email?: string; status?: string; activity?: string }>)
          : [];
      const apiEmails = new Set(
        raw.map((a) => ((a as { email?: string }).email ?? '').trim().toLowerCase()).filter(Boolean)
      );
      const list: RosterAthlete[] = raw.map((a) => ({
        athlete_id: a.athlete_id ?? '',
        athlete_name: a.athlete_name ?? a.athlete_id ?? 'Unknown',
        status: (a as { status?: string }).status as 'alert' | 'monitor' | 'normal' | undefined,
        activity: (a as { activity?: string }).activity,
        email: (a as { email?: string }).email,
      }));

      if (coachIdFromAuth) {
        try {
          const coachAthletesRef = collection(db, 'coaches', coachIdFromAuth, 'athletes');
          const snap = await getDocs(coachAthletesRef);
          for (const d of snap.docs) {
            const data = d.data();
            const email = (data.athleteEmail ?? '').trim().toLowerCase();
            const name = data.athleteName || data.athleteEmail || d.id;
            const fid = d.id;
            const backendAthleteId = (data.athleteId as string) || fid;
            const alreadyInList = list.some(
              (a) => a.athlete_id === fid || a.athlete_id === backendAthleteId || (email && apiEmails.has(email))
            );
            if (!alreadyInList) {
              list.push({
                athlete_id: backendAthleteId,
                athlete_name: name,
                status: 'normal',
                activity: undefined,
              });
              if (email) apiEmails.add(email);
            }
          }
        } catch {
          /* ignore */
        }
      }

      setRoster(list);
    } catch {
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  }, [coachIdFromAuth]);

  const refreshAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = (await getAllAlerts({ limit: 50 })) as { alerts?: AlertPayload[]; count?: number };
      setAlerts(Array.isArray(res?.alerts) ? res.alerts : []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await getAllSessions({ limit: 30 });
      const sess = (res?.sessions as unknown[]) ?? (Array.isArray(res) ? res : []);
      setSessions(sess);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRoster();
  }, [refreshRoster]);

  useEffect(() => {
    refreshAlerts();
  }, [refreshAlerts]);

  const state: CoachWebAppState = {
    coachId: coachIdFromAuth,
    roster,
    rosterLoading,
    refreshRoster,
    alerts,
    alertsLoading,
    refreshAlerts,
    sessions,
    sessionsLoading,
    refreshSessions,
    selectedAthleteId,
    setSelectedAthleteId,
    selectedAlertId,
    setSelectedAlertId,
    setWebScreen,
  };

  return (
    <CoachWebAppContext.Provider value={state}>
      {children}
    </CoachWebAppContext.Provider>
  );
}
