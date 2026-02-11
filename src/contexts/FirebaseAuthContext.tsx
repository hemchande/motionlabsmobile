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
import { createAthleteCoachClient } from '../services/athleteCoachFastApiClient';

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
  firebaseUserPendingProfile: FirebaseUser | null;
  completeProfile: (data: GoogleProfileCompletionData) => Promise<{ success: boolean; error?: string }>;
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
  const [userRole, setUserRole] = useState<"coach" | "athlete">("coach");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

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
            
            const userProfile: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              fullName: userData.fullName,
              role: userData.role,
              institution: userData.institution,
              athleteCount: userData.athleteCount,
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              profileImage: userData.profileImage,
              emailVerified: firebaseUser.emailVerified
            };
            
            console.log('Setting user profile and authenticating:', userProfile);
            setUser(userProfile);
            setUserRole(userProfile.role);
            setIsAuthenticated(true);
            setFirebaseUser(firebaseUser);
            
            // Update last login
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: serverTimestamp()
            });
          } else {
            console.log('User document not found - needs profile completion (Google sign-up)');
            setFirebaseUserPendingProfile(firebaseUser);
            setNeedsProfileCompletion(true);
            setUser(null);
            setFirebaseUser(firebaseUser);
            setIsAuthenticated(false);
          }
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          const isPermissionError = err?.code === 'permission-denied' || 
            (typeof err?.message === 'string' && err.message.includes('permission'));
          // For new Google sign-ups, the user doc may not exist; some Firestore rules
          // return permission-denied when reading a non-existent doc. Treat as profile completion.
          if (isPermissionError) {
            console.log('User doc not readable (likely new Google sign-up) - showing profile completion');
            setFirebaseUserPendingProfile(firebaseUser);
            setNeedsProfileCompletion(true);
            setUser(null);
            setFirebaseUser(firebaseUser);
            setIsAuthenticated(false);
          } else {
            console.error('Error fetching user profile:', error);
            await signOut(auth);
          }
        }
      } else {
        console.log('No user, setting unauthenticated state');
        setUser(null);
        setFirebaseUser(null);
        setFirebaseUserPendingProfile(null);
        setNeedsProfileCompletion(false);
        setUserRole("coach");
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Don't set loading to false here - let the auth state change handler manage it
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Login failed. Please try again.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
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
      let profileImageUrl: string | null = null;
      if (data.photoFile) {
        const storageRef = ref(storage, `users/${fbUser.uid}/profile.jpg`);
        await uploadBytes(storageRef, data.photoFile);
        profileImageUrl = await getDownloadURL(storageRef);
      }

      const fullName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
      const email = fbUser.email || '';

      // Create user via FastAPI (generates athlete_id for athletes) - use random password for Google-only users
      let apiUserData: { user?: { athlete_id?: string; id?: string } } | null = null;
      const googlePlaceholderPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
      try {
        const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
        const apiResult = (await apiClient.createUser({
          email,
          password: googlePlaceholderPassword,
          full_name: fullName,
          role: data.role,
          institution: data.institution,
          firebase_uid: fbUser.uid,
        })) as { status?: string; user?: { athlete_id?: string; id?: string } };
        if (apiResult?.status === 'success' && apiResult?.user) {
          apiUserData = { user: apiResult.user };
          console.log('✅ User created via FastAPI with athlete_id:', apiUserData?.user?.athlete_id);
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
        profileImage: profileImageUrl,
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

      // Register profile photo with backend if athlete and we have athlete_id + photo URL
      if (athleteId && profileImageUrl) {
        try {
          const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());
          await apiClient.addUserPhoto({
            athlete_id: athleteId,
            photo_url: profileImageUrl,
            athlete_name: fullName,
          });
          console.log('✅ Profile photo registered with backend');
        } catch (photoError) {
          console.warn('⚠️ Failed to register profile photo with backend:', photoError);
        }
      }

      // Check for pending invitations and auto-accept (same as email signup)
      if (data.role === 'athlete') {
        try {
          const invitationsRef = collection(db, 'invitations');
          const q = query(
            invitationsRef,
            where('athleteEmail', '==', email),
            where('status', '==', 'pending')
          );
          const querySnapshot = await getDocs(q);
          for (const invitationDoc of querySnapshot.docs) {
            const invitation = invitationDoc.data();
            await setDoc(
              doc(db, 'coaches', invitation.coachId, 'athletes', fbUser.uid),
              {
                athleteId: fbUser.uid,
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
        profileImage: profileImageUrl ?? undefined,
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
        const apiResult = (await apiClient.createUser({
          email: userData.email,
          password: userData.password,
          full_name: userData.fullName,
          role: userData.role,
          institution: userData.institution,
          firebase_uid: firebaseUser.uid,
        })) as { status?: string; user?: { athlete_id?: string; id?: string } };
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
          // Find pending invitations for this email
          const invitationsRef = collection(db, 'invitations');
          const q = query(
            invitationsRef, 
            where('athleteEmail', '==', userData.email),
            where('status', '==', 'pending')
          );
          const querySnapshot = await getDocs(q);
          
          for (const invitationDoc of querySnapshot.docs) {
            const invitation = invitationDoc.data();
            
            // Add athlete to coach's roster
            await setDoc(
              doc(db, 'coaches', invitation.coachId, 'athletes', firebaseUser.uid),
              {
                athleteId: firebaseUser.uid,
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
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
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
      firebaseUserPendingProfile,
      completeProfile,
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

