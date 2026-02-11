/**
 * Example: Mobile Coach Login with API Integration
 * This demonstrates how to use the API service in your mobile components
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { authApi, setAuthToken, LoginRequest } from '../../services/api';
import { useMutation } from '../../hooks/useApi';

export function MobileCoachLoginWithAPI() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');

  // Use the useMutation hook for login
  const { mutate: login, loading, error } = useMutation(authApi.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const credentials: LoginRequest = {
        email,
        password,
        organization: organization || undefined,
      };

      const response = await login(credentials);
      
      if (response) {
        // Store the auth token
        setAuthToken(response.token);
        
        // Redirect or update app state
        // For example: navigate('/dashboard') or setUser(response.user)
        console.log('Login successful:', response.user);
        
        // You can also store user info in context/state management
        // Example: setUser(response.user);
      }
    } catch (err) {
      // Error is already handled by useMutation hook
      console.error('Login failed:', err);
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
            <p className="text-red-800 text-sm">{error.message}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
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
                className="flex-1 outline-none bg-transparent"
                disabled={loading}
              />
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 text-white rounded-xl font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <button 
            type="button"
            className="w-full text-blue-600 text-sm mt-4"
            disabled={loading}
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}





