'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './FirebaseAuthContext';
import { db } from '../lib/firebase';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  athleteId?: string;  // athlete_id from MCP server
  institution?: string;
  firebaseUid?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface UserContextType {
  user: User | null;
  athleteId: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  createUserInMCP?: (
    email: string,
    password: string,
    fullName: string,
    role: "coach" | "athlete",
    institution?: string,
    firebaseUid?: string
  ) => Promise<User | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// MCP Server base URL
const MCP_BASE_URL = 'http://localhost:8003/mcp';

// Helper to call MCP server
async function callMCPServer(toolName: string, arguments_: Record<string, any>): Promise<any> {
  try {
    const response = await fetch(MCP_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: arguments_
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle MCP response format
    if (data.result && data.result.content && data.result.content[0]) {
      const resultText = data.result.content[0].text;
      return JSON.parse(resultText);
    } else if (data.result) {
      if (typeof data.result === 'string') {
        return JSON.parse(data.result);
      }
      return data.result;
    } else if (data.error) {
      throw new Error(data.error.message || 'MCP server error');
    }
    
    return data;
  } catch (error: any) {
    console.error(`Error calling MCP tool ${toolName}:`, error);
    throw error;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, isAuthenticated, userRole } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user in MCP server on signup
  const createUserInMCP = async (
    email: string,
    password: string,
    fullName: string,
    role: "coach" | "athlete",
    institution?: string,
    firebaseUid?: string
  ): Promise<User | null> => {
    try {
      const response = await callMCPServer('create_user', {
        email,
        password,
        full_name: fullName,
        role,
        institution,
        firebase_uid: firebaseUid
      });

      if (response.status === 'success' && response.user) {
        const mcpUser: User = {
          id: response.user.id,
          email: response.user.email,
          fullName: response.user.fullName,
          role: response.user.role as "coach" | "athlete",
          athleteId: response.user.athlete_id,
          institution: response.user.institution,
          firebaseUid: response.user.firebase_uid,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        setUser(mcpUser);
        // Store in localStorage for persistence
        localStorage.setItem('mcpUser', JSON.stringify(mcpUser));
        return mcpUser;
      } else {
        throw new Error(response.message || 'Failed to create user in MCP server');
      }
    } catch (error: any) {
      console.error('Error creating user in MCP server:', error);
      throw error;
    }
  };

  // Get user from MCP server by email
  const getUserFromMCP = async (email: string, role: string): Promise<User | null> => {
    try {
      // Since we don't have a get_user_by_email endpoint, we'll use login to verify
      // In production, you'd want a proper get_user endpoint
      // For now, we'll check localStorage first
      const storedUser = localStorage.getItem('mcpUser');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.email === email) {
            return parsed;
          }
        } catch {
          // Invalid stored data
        }
      }
      
      // If not in localStorage, user might not exist in MCP yet
      // This will be handled by createUserInMCP on signup
      return null;
    } catch (error: any) {
      console.error('Error getting user from MCP server:', error);
      return null;
    }
  };

  // Refresh user data from MCP server
  const refreshUser = async () => {
    if (!firebaseUser || !isAuthenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const mcpUser = await getUserFromMCP(firebaseUser.email || '', userRole);
      if (mcpUser) {
        setUser(mcpUser);
      } else {
        // User exists in Firebase but not in MCP - this shouldn't happen after signup
        // But we'll create a basic user object from Firebase data
        const basicUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: userRole,
        };
        setUser(basicUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user when Firebase auth state changes
  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      // Try to get user from Firestore first (which should have athlete_id from signup)
      const loadUserFromFirestore = async () => {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const mcpUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              fullName: userData.fullName || firebaseUser.displayName || '',
              role: userData.role || userRole,
              athleteId: userData.athleteId || userData.athlete_id,
              institution: userData.institution,
              firebaseUid: firebaseUser.uid,
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastLogin: userData.lastLogin?.toDate?.()?.toISOString() || new Date().toISOString()
            };
            setUser(mcpUser);
            localStorage.setItem('mcpUser', JSON.stringify(mcpUser));
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading user from Firestore:', error);
        }
        
        // Fallback to refreshUser if Firestore doesn't have the data
        refreshUser();
      };
      
      loadUserFromFirestore();
    } else {
      setUser(null);
      setLoading(false);
      localStorage.removeItem('mcpUser');
    }
  }, [isAuthenticated, firebaseUser, userRole]);

  const value: UserContextType = {
    user,
    athleteId: user?.athleteId || null,
    loading,
    refreshUser,
    createUserInMCP
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Export createUserInMCP for use in signup
export { callMCPServer };

