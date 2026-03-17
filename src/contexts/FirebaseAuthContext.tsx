'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../lib/firebase';
import { getAthleteCoachApiUrl } from '../lib/athleteCoachApiUrl';
import { createAthleteCoachClient, type CreateUserResponse } from '../services/athleteCoachFastApiClient';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
  athleteId?: string;  // athlete_id from MCP server
  createdAt: string;
  lastLogin: string;
  profileImage?: string;
  emailVerified: boolean;
}

export interface GoogleProfileCompletionData {
  role: 'coach' | 'athlete';
  institution?: string;
  age?: number;
  weight?: number;
  height?: string;
  pastInjuries?: string;
  photoFile?: File;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  userRole: "coach" | "athlete";
  needsProfileCompletion: boolean;
  needsPhotoCompletion: boolean;
  firebaseUserPendingProfile: FirebaseUser | null;
  completeProfile: (data: GoogleProfileCompletionData) => Promise<{ success: boolean; error?: string }>;
  clearPhotoCompletion: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  sendEmailVerification: () => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseUserPendingProfile, setFirebaseUserPendingProfile] = useState<FirebaseUser | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [needsPhotoCompletion, setNeedsPhotoCompletion] = useState(false);
  const [userRole, setUserRole] = useState<"coach" | "athlete">("coach");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const clearPhotoCompletion = () => setNeedsPhotoCompletion(false);

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          console.log('Fetching user profile for:', firebaseUser.uid);
          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User document found:', userData);
            
            // TEMPORARY: Allow access if Firebase UID detected (skip photo requirement)
            // TODO: Re-enable photo requirement later by checking athleteId
            const hasBasicInfo = userData.role && userData.fullName;
            
            if (hasBasicInfo) {
              // If user doc has role + fullName, always redirect to dashboard (existing user).
              // Optionally correct role when their email is in invitations (coach → athlete).
              const userEmailNorm = (firebaseUser.email || '').trim().toLowerCase();
              let isInvitedAthlete = false;
              if (userEmailNorm) {
                try {
                  const invitationsRef = collection(db, 'invitations');
                  const qLower = query(invitationsRef, where('athleteEmailLower', '==', userEmailNorm));
                  const qExact = query(invitationsRef, where('athleteEmail', '==', userEmailNorm));
                  const rawEmail = (firebaseUser.email || '').trim();
                  const qRaw = rawEmail && rawEmail !== userEmailNorm
                    ? query(invitationsRef, where('athleteEmail', '==', rawEmail))
                    : null;
                  const [snapLower, snapExact, snapRaw] = await Promise.all([
                    getDocs(qLower),
                    getDocs(qExact),
                    qRaw ? getDocs(qRaw) : Promise.resolve(null)
                  ]);
                  const rawMatches = snapRaw && 'empty' in snapRaw && !(snapRaw as { empty: boolean }).empty;
                  isInvitedAthlete = !snapLower.empty || !snapExact.empty || !!rawMatches;
                } catch (inviteCheckErr) {
                  console.warn('Invited-athlete check failed:', inviteCheckErr);
                }
              }

              // Profile complete - authenticate and redirect to dashboard
              console.log(`✅ User has profile (role + fullName), granting access`);
              let effectiveRole = userData.role as 'coach' | 'athlete';
              if (effectiveRole === 'coach' && isInvitedAthlete) {
                console.log('✅ Invited athlete detected (email in invitations) – correcting role to athlete');
                await updateDoc(doc(db, 'users', firebaseUser.uid), { role: 'athlete' });
                effectiveRole = 'athlete';
              }
              
              const userProfile: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                fullName: userData.fullName,
                role: effectiveRole,
                institution: userData.institution,
                athleteCount: userData.athleteCount,
                athleteId: userData.athleteId,
                createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                profileImage: userData.profileImage,
                emailVerified: firebaseUser.emailVerified
              };
              
              console.log('Setting user profile and authenticating:', userProfile);
              setUser(userProfile);
              setUserRole(userProfile.role);
              setNeedsProfileCompletion(false);
              setFirebaseUserPendingProfile(null);
              setIsAuthenticated(true);
              setFirebaseUser(firebaseUser);
              
              // Update last login
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                lastLogin: serverTimestamp()
              });
              setLoading(false);
            } else {
              // Profile incomplete - need basic info (e.g. invited athlete who just signed in)
              console.log(`⚠️ Incomplete profile (missing basic info), showing profile completion`);
              setFirebaseUserPendingProfile(firebaseUser);
              setNeedsProfileCompletion(true);
              setUser(null);
              setFirebaseUser(firebaseUser);
              setIsAuthenticated(false);
              setLoading(false);
            }
          } else {
            // No user doc in Firestore (e.g. new Google sign-up or invited athlete first sign-in)
            console.log('User document not found - needs profile completion (Google sign-up)');
            setFirebaseUserPendingProfile(firebaseUser);
            setNeedsProfileCompletion(true);
            setUser(null);
            setFirebaseUser(firebaseUser);
            setIsAuthenticated(false);
            setLoading(false);
          }
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          // On any error reading user doc (permission, network, missing), show profile completion
          // so invited athletes and new sign-ups can complete profile instead of being signed out.
          console.warn('Error fetching user profile – showing profile completion:', err?.message || error);
          setFirebaseUserPendingProfile(firebaseUser);
          setNeedsProfileCompletion(true);
          setUser(null);
          setFirebaseUser(firebaseUser);
          setIsAuthenticated(false);
          setLoading(false);
        }
      } else {
        console.log('No user, setting unauthenticated state');
        setUser(null);
        setFirebaseUser(null);
        setFirebaseUserPendingProfile(null);
        setNeedsProfileCompletion(false);
        setUserRole("coach");
        setIsAuthenticated(false);
        try {
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('mcpUser');
        } catch (_) {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // When athlete has athlete_id, check if profile has photo (GET details → 403 means add photo required)
  useEffect(() => {
    if (!user || user.role !== 'athlete' || !user.athleteId) {
      setNeedsPhotoCompletion(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const client = createAthleteCoachClient(getAthleteCoachApiUrl());
        await client.getAthleteDetails(user.athleteId!);
        if (!cancelled) setNeedsPhotoCompletion(false);
      } catch (e: unknown) {
        const err = e as { status?: number; data?: { profile_complete?: boolean } };
        if (!cancelled && err?.status === 403 && err?.data?.profile_complete === false) {
          // Backend indicates athlete has no photo yet.
          // Unify photo upload into the full profile completion screen (GoogleProfileCompletion).
          setNeedsPhotoCompletion(false);
          if (firebaseUser) setFirebaseUserPendingProfile(firebaseUser);
          setNeedsProfileCompletion(true);
        } else if (!cancelled) {
          setNeedsPhotoCompletion(false);
        }
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user?.id, user?.role, user?.athleteId, firebaseUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      // Backend login: get athlete_id (and token) so Firestore has it for profile/details/add-photo (ATHLETE_COACH_BACKEND_REQUIREMENTS.md)
      try {
        const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
        const loginRes = await apiClient.login({ email, password, role: 'athlete' });
        const athleteId = loginRes.user?.athlete_id;
        if (athleteId) {
          await setDoc(doc(db, 'users', uid), { athleteId, lastLogin: serverTimestamp() }, { merge: true });
        }
      } catch (apiErr) {
        console.warn('Backend login (athlete_id sync) failed, continuing with Firebase auth:', apiErr);
      }
      // Don't set loading to false here - let the auth state change handler manage it
      return { success: true };
    } catch (error: any) {
      const code = error?.code ?? error?.data?.error?.message ?? '';
      console.error('Login error:', { code, message: error?.message, full: error });
      let errorMessage = "Login failed. Please try again.";
      const backendMsg = error?.data?.error?.message;

      if (backendMsg === 'INVALID_LOGIN_CREDENTIALS' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        errorMessage = "Incorrect email or password. If you signed up with Google, use Sign in with Google instead.";
      } else {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this email address. Use Sign in with Google if you created the account with Google.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid email address.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many failed attempts. Please try again later.";
            break;
          case 'auth/operation-not-allowed':
            errorMessage = "Email/password sign-in is not enabled. Use Sign in with Google or contact support.";
            break;
          default:
            errorMessage = error?.message || errorMessage;
            break;
        }
      }

      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const completeProfile = async (data: GoogleProfileCompletionData): Promise<{ success: boolean; error?: string }> => {
    const fbUser = firebaseUserPendingProfile;
    if (!fbUser) return { success: false, error: 'No pending user' };

    setLoading(true);
    try {
      // Single source of truth for profile photo:
      // - Photo is uploaded ONLY via FastAPI `/api/athlete/add-photo-upload` from this profile completion flow.
      // - We do not upload to Firebase Storage here to avoid CORS issues + duplicate photo flows.
      if (data.role === 'athlete' && !data.photoFile) {
        return { success: false, error: 'Please upload a profile photo to continue.' };
      }

      const fullName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
      const email = fbUser.email || '';

      // Create or update user via FastAPI (generates athlete_id for athletes)
      let apiUserData: { user?: { athlete_id?: string; id?: string } } | null = null;
      const googlePlaceholderPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      try {
        const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
        
        // Try to create user
        const apiResult = await apiClient.createUser({
          email,
          password: googlePlaceholderPassword,
          full_name: fullName,
          role: data.role,
          institution: data.institution,
          firebase_uid: fbUser.uid,
        }) as CreateUserResponse;
        
        if (apiResult?.status === 'success' && apiResult?.user) {
          apiUserData = { user: apiResult.user };
          console.log('✅ User created via FastAPI with athlete_id:', apiUserData?.user?.athlete_id);
        } else if (apiResult?.status === 'error' && apiResult?.message?.includes('already exists')) {
          // User already exists in backend - this is OK!
          console.log('✅ User already exists in backend, using existing data');
          
          // Get existing data from Firestore
          try {
            const existingDoc = await getDoc(doc(db, 'users', fbUser.uid));
            if (existingDoc.exists()) {
              const existingData = existingDoc.data();
              console.log('✅ Found existing Firestore data:', existingData);
              
              // Use existing athlete_id
              if (existingData.athleteId) {
                apiUserData = { user: { athlete_id: existingData.athleteId, id: existingData.mcpUserId } };
                console.log('✅ Using existing athlete_id:', existingData.athleteId);
              }
              
              // Update profile with new data (if user changed anything)
              await updateDoc(doc(db, 'users', fbUser.uid), {
                fullName: data.role === 'athlete' ? fullName : existingData.fullName,
                role: data.role,
                institution: data.institution || existingData.institution,
                ...(data.role === 'athlete' && {
                  age: data.age,
                  weight: data.weight,
                  height: data.height,
                  pastInjuries: data.pastInjuries,
                }),
                lastLogin: serverTimestamp(),
              });

              // Upload photo and call add-photo so embedding is stored in local index.
              const existingAthleteId = existingData.athleteId as string | undefined;
              if (data.role === 'athlete' && existingAthleteId && data.photoFile) {
                const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
                try {
                  await apiClient.addPhotoUpload({
                    athlete_id: existingAthleteId,
                    photo: data.photoFile,
                    athlete_name: fullName,
                  });
                  console.log('✅ Profile photo uploaded to backend (add-photo-upload)');
                } catch (photoError) {
                  console.warn('⚠️ Failed to upload profile photo to backend:', photoError);
                }
                try {
                  const photoRef = ref(storage, `profile_photos/${fbUser.uid}/${Date.now()}.jpg`);
                  await uploadBytes(photoRef, data.photoFile);
                  const photoUrl = await getDownloadURL(photoRef);
                  await apiClient.addUserPhoto({
                    athlete_id: existingAthleteId,
                    photo_url: photoUrl,
                    athlete_name: fullName,
                  });
                  console.log('✅ add-photo called so embedding can be stored in local index');
                } catch (addPhotoErr) {
                  console.warn('⚠️ add-photo (embedding) failed:', addPhotoErr);
                }
              }
              
              // Set auth state for immediate redirect
              setUser({
                id: fbUser.uid,
                email: existingData.email || email,
                fullName: existingData.fullName || fullName,
                role: data.role as "coach" | "athlete",
                institution: data.institution || existingData.institution,
                athleteCount: existingData.athleteCount,
                athleteId: existingData.athleteId,
                createdAt: existingData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                profileImage: existingData.profileImage,
                emailVerified: fbUser.emailVerified,
              });
              setUserRole(data.role as "coach" | "athlete");
              setNeedsProfileCompletion(false);
              setFirebaseUser(fbUser);
              setFirebaseUserPendingProfile(null);
              setIsAuthenticated(true);
              setLoading(false);
              
              console.log('✅ Existing user profile updated, redirecting to dashboard');
              
              // Return success - triggers redirect to dashboard
              return { success: true };
            }
          } catch (firestoreErr) {
            console.warn('⚠️ Could not fetch/update existing Firestore data:', firestoreErr);
            // Fall through to normal profile completion
          }
        }
      } catch (apiError) {
        console.warn('⚠️ FastAPI create-user failed (continuing with profile completion):', apiError);
      }

      const athleteId = apiUserData?.user?.athlete_id;

      const userDoc: Record<string, unknown> = {
        email,
        fullName,
        role: data.role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: fbUser.emailVerified,
        ...(data.institution && { institution: data.institution }),
        ...(athleteId && { athleteId }),
        ...(apiUserData?.user?.id && { mcpUserId: apiUserData.user.id }),
        ...(data.role === 'athlete' && {
          age: data.age,
          weight: data.weight,
          height: data.height,
          pastInjuries: data.pastInjuries || null,
        }),
      };

      await setDoc(doc(db, 'users', fbUser.uid), userDoc);

      // Upload profile photo and call add-photo so embedding is stored in local index (invited athletes).
      if (data.role === 'athlete' && athleteId && data.photoFile) {
        const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
        try {
          await apiClient.addPhotoUpload({
            athlete_id: athleteId,
            photo: data.photoFile,
            athlete_name: fullName,
          });
          console.log('✅ Profile photo uploaded to backend (add-photo-upload)');
        } catch (photoError) {
          console.warn('⚠️ Failed to upload profile photo to backend:', photoError);
        }
        try {
          const photoRef = ref(storage, `profile_photos/${fbUser.uid}/${Date.now()}.jpg`);
          await uploadBytes(photoRef, data.photoFile);
          const photoUrl = await getDownloadURL(photoRef);
          await apiClient.addUserPhoto({
            athlete_id: athleteId,
            photo_url: photoUrl,
            athlete_name: fullName,
          });
          console.log('✅ add-photo called so embedding can be stored in local index');
        } catch (addPhotoErr) {
          console.warn('⚠️ add-photo (embedding) failed:', addPhotoErr);
        }
      }

      // Check for pending invitations and auto-accept (same as email signup)
      if (data.role === 'athlete') {
        try {
          const invitationsRef = collection(db, 'invitations');
          const emailLower = email.trim().toLowerCase();
          const qLower = query(
            invitationsRef,
            where('athleteEmailLower', '==', emailLower),
            where('status', '==', 'pending')
          );
          const qExact = query(
            invitationsRef,
            where('athleteEmail', '==', email.trim()),
            where('status', '==', 'pending')
          );
          const [snapLower, snapExact] = await Promise.all([getDocs(qLower), getDocs(qExact)]);
          const querySnapshot = snapLower.empty ? snapExact : snapLower;
          for (const invitationDoc of querySnapshot.docs) {
            const invitation = invitationDoc.data();
            await setDoc(
              doc(db, 'coaches', invitation.coachId, 'athletes', fbUser.uid),
              {
                athleteId: athleteId || fbUser.uid,
                athleteEmail: email,
                athleteName: fullName,
                joinedAt: serverTimestamp(),
                status: 'active',
                coachId: invitation.coachId,
              }
            );
            await updateDoc(doc(db, 'invitations', invitationDoc.id), {
              status: 'accepted',
              acceptedAt: serverTimestamp(),
            });
          }
        } catch (invitationError) {
          console.warn('Error processing pending invitations:', invitationError);
        }
      }

      setNeedsProfileCompletion(false);
      setFirebaseUserPendingProfile(null);

      const userProfile: User = {
        id: fbUser.uid,
        email: fbUser.email!,
        fullName,
        role: data.role,
        institution: data.institution,
        athleteCount: undefined,
        athleteId,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileImage: undefined,
        emailVerified: fbUser.emailVerified,
      };

      setUser(userProfile);
      setUserRole(data.role);
      setIsAuthenticated(true);
      setFirebaseUser(fbUser);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete profile';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string; user?: User }> => {
    setLoading(true);
    
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: userData.fullName
      });
      
      // Create user via FastAPI (generates athlete_id for athletes)
      let apiUserData: { user?: { athlete_id?: string; id?: string } } | null = null;
      try {
        const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
        const apiResult = await apiClient.createUser({
          email: userData.email,
          password: userData.password,
          full_name: userData.fullName,
          role: userData.role,
          institution: userData.institution,
          firebase_uid: firebaseUser.uid,
        }) as CreateUserResponse;
        if (apiResult?.status === 'success' && apiResult?.user) {
          apiUserData = { user: apiResult.user };
          console.log('✅ User created via FastAPI with athlete_id:', apiUserData?.user?.athlete_id);
        }
      } catch (apiError) {
        console.warn('⚠️ FastAPI create-user failed (continuing with Firebase signup):', apiError);
      }

      // Create user document in Firestore
      const userDoc = {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        profileImage: null,
        emailVerified: false,
        ...(userData.institution && { institution: userData.institution }),
        ...(userData.athleteCount && { athleteCount: userData.athleteCount }),
        ...(apiUserData?.user?.athlete_id && { athleteId: apiUserData.user.athlete_id }),
        ...(apiUserData?.user?.id && { mcpUserId: apiUserData.user.id })
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);
      
      // Check for pending invitations and auto-accept them
      if (userData.role === 'athlete') {
        try {
          const invitationsRef = collection(db, 'invitations');
          const emailLower = (userData.email || '').trim().toLowerCase();
          const qLower = query(
            invitationsRef,
            where('athleteEmailLower', '==', emailLower),
            where('status', '==', 'pending')
          );
          const qExact = query(
            invitationsRef,
            where('athleteEmail', '==', (userData.email || '').trim()),
            where('status', '==', 'pending')
          );
          const [snapLower, snapExact] = await Promise.all([getDocs(qLower), getDocs(qExact)]);
          const querySnapshot = snapLower.empty ? snapExact : snapLower;
          
          for (const invitationDoc of querySnapshot.docs) {
            const invitation = invitationDoc.data();
            
            // Add athlete to coach's roster (use backend athlete_id when available so API/embeddings work)
            const backendAthleteId = apiUserData?.user?.athlete_id;
            await setDoc(
              doc(db, 'coaches', invitation.coachId, 'athletes', firebaseUser.uid),
              {
                athleteId: backendAthleteId || firebaseUser.uid,
                athleteEmail: userData.email,
                athleteName: userData.fullName,
                joinedAt: serverTimestamp(),
                status: 'active',
                coachId: invitation.coachId
              }
            );
            
            // Update invitation status
            await updateDoc(doc(db, 'invitations', invitationDoc.id), {
              status: 'accepted',
              acceptedAt: serverTimestamp()
            });
            
            console.log('✅ Auto-accepted invitation from:', invitation.coachName);
          }
        } catch (invitationError) {
          console.error('Error processing pending invitations:', invitationError);
          // Don't fail signup if invitation processing fails
        }
      }
      
      // Send email verification
      await firebaseSendEmailVerification(firebaseUser);
      
      // Create user object for return (include athlete_id from FastAPI if available)
      const newUser: User = {
        id: firebaseUser.uid,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        institution: userData.institution,
        athleteCount: userData.athleteCount,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        emailVerified: false,
        ...(apiUserData?.user?.athlete_id && { athleteId: apiUserData.user.athlete_id })
      };
      
      setLoading(false);
      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "Signup failed. Please try again.";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "An account with this email already exists.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
      }
      
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear auth state immediately so UI shows logged-out and next login isn't confused with previous user
      setUser(null);
      setFirebaseUser(null);
      setFirebaseUserPendingProfile(null);
      setNeedsProfileCompletion(false);
      setNeedsPhotoCompletion(false);
      setUserRole('coach');
      setIsAuthenticated(false);
      // Clear localStorage so no stale user data remains after logout
      try {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('mcpUser');
      } catch (e) {
        // ignore if localStorage unavailable
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear state so user can try logging in as someone else
      setUser(null);
      setFirebaseUser(null);
      setFirebaseUserPendingProfile(null);
      setNeedsProfileCompletion(false);
      setNeedsPhotoCompletion(false);
      setUserRole('coach');
      setIsAuthenticated(false);
    }
  };

  const sendEmailVerification = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!firebaseUser) {
        return { success: false, error: "No user logged in" };
      }
      
      await firebaseSendEmailVerification(firebaseUser);
      return { success: true };
    } catch (error: any) {
      console.error('Email verification error:', error);
      return { success: false, error: "Failed to send verification email." };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = "Failed to send password reset email.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    const authContextSnapshot = {
      isAuthenticated,
      loading,
      userRole,
      user: user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role, institution: user.institution, athleteId: user.athleteId } : null,
      firebaseUser: firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, displayName: (firebaseUser as { displayName?: string }).displayName } : null,
      needsProfileCompletion,
      needsPhotoCompletion,
      firebaseUserPendingProfile: !!firebaseUserPendingProfile,
      coachIdForInvite: user?.id ?? firebaseUser?.uid ?? '(none)',
    };
    console.log('[FirebaseAuthContext] user auth context:', authContextSnapshot);
  }, [isAuthenticated, loading, userRole, user, firebaseUser, firebaseUserPendingProfile, needsProfileCompletion, needsPhotoCompletion]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading MotionLabs AI...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      firebaseUser,
      needsProfileCompletion,
      needsPhotoCompletion,
      firebaseUserPendingProfile,
      completeProfile,
      clearPhotoCompletion,
      userRole,
      login,
      signup,
      logout,
      sendEmailVerification,
      sendPasswordReset,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

