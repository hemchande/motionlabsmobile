import React, { useState } from 'react';
import { MobileApp } from './components/MobileApp';
import { PhoneTestBanner } from './components/PhoneTestBanner';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import { UserProvider } from './contexts/UserContext';
import { AlertDashboard } from './components/AlertDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [showMCPTest, setShowMCPTest] = useState(false);

  // Toggle with ?mcp=true in URL or press 'M' key
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mcp') === 'true') {
      return (
        <FirebaseAuthProvider>
          <UserProvider>
            <PhoneTestBanner />
            <div className="relative">
              <button
                onClick={() => setShowMCPTest(!showMCPTest)}
                className="fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700"
              >
                {showMCPTest ? 'Hide' : 'Show'} MCP Test
              </button>
              {showMCPTest ? (
                <ErrorBoundary>
                  <AlertDashboard />
                </ErrorBoundary>
              ) : (
                <MobileApp />
              )}
            </div>
          </UserProvider>
        </FirebaseAuthProvider>
      );
    }
  }

  return (
    <FirebaseAuthProvider>
      <UserProvider>
        <PhoneTestBanner />
        <MobileApp />
      </UserProvider>
    </FirebaseAuthProvider>
  );
}