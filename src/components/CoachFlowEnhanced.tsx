import React, { useState, useEffect } from 'react';
import {
  WireframeScreen,
  TopNavEnhanced,
  AthleteCardEnhanced,
  AlertBannerEnhanced,
  MetricsRowLive,
  ClipCardEvidence,
  OneTapActionBar,
  ConfidenceChip,
  ValidationStatus,
  MandatoryFooter,
  TrendChartEnhanced,
  EvidenceBundleHeader,
  ButtonEnhanced,
  FormFieldEnhanced,
} from './EnhancedComponents';
import { Upload, Plus, Play, Settings, Download, Bell, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { 
  RecordUploadVideoEnhanced,
  LiveRecordingViewHighFi,
  AlertBannerNotificationEnhanced,
  EvidenceCarouselHighFi,
} from './CoachFlowEnhancedPart2';
import { TeamDashboardEnhanced, SettingsRosterAdminEnhanced } from './CoachFlowEnhancedPart3';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function CoachFlowEnhanced({ currentScreen }: { currentScreen: number }) {
  const screens = [
    <LoginRoleSelect key="login" />,
    <TeamOnboardingRosterEnhanced key="onboarding-roster" />,
    <TeamOnboardingScheduleEnhanced key="onboarding-schedule" />,
    <AthleteRosterListEnhanced key="roster-list" />,
    <AthleteProfileCoachEnhanced key="athlete-profile" />,
    <RecordUploadVideoEnhanced key="record-upload" />,
    <LiveRecordingViewHighFi key="live-recording" />,
    <AlertBannerNotificationEnhanced key="alert-notification" />,
    <EvidenceCarouselHighFi key="evidence-carousel" />,
    <TeamDashboardEnhanced key="team-dashboard" />,
    <SettingsRosterAdminEnhanced key="settings" />,
  ];

  return screens[currentScreen];
}

// Screen 1: Login / Organization & Role Select
function LoginRoleSelect() {
  const { login, signup, loading: authLoading, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organization: '',
  });
  
  const [selectedRole, setSelectedRole] = useState<'coach' | 'athlete'>('coach');
  const [coachRole, setCoachRole] = useState<string>('Head Coach');

  // Check for invitation token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    const mode = urlParams.get('mode');
    
    if (inviteToken && mode === 'signup') {
      loadInvitationData(inviteToken);
      setIsSignup(true);
      setIsLogin(false);
      setSelectedRole('athlete');
    }
  }, []);

  const loadInvitationData = async (token: string) => {
    try {
      setLoading(true);
      // Query Firebase directly for the invitation
      const invitationsRef = collection(db, 'invitations');
      const q = query(invitationsRef, where('invitationToken', '==', token));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const invitationDoc = querySnapshot.docs[0];
        const invitationData = invitationDoc.data();
        
        // Check if invitation is still pending
        if (invitationData.status !== 'pending') {
          setError('This invitation has already been used or expired');
          return;
        }
        
        const invitation = {
          id: invitationDoc.id,
          ...invitationData
        };
        
        setInvitationData(invitation);
        setFormData(prev => ({
          ...prev,
          email: invitationData.athleteEmail || '',
          fullName: invitationData.athleteName || ''
        }));
      } else {
        setError('Invalid or expired invitation link');
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Failed to load invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        if (!formData.email || !formData.password) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }

        const result = await login(formData.email, formData.password);
        if (!result.success) {
          setError(result.error || 'Login failed');
        }
      } else {
        // Signup flow
        if (!formData.email || !formData.password || !formData.fullName) {
          setError('Please fill in all required fields');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const signupData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: selectedRole,
          institution: formData.organization || undefined,
        };

        const result = await signup(signupData);
        if (result.success) {
          // Invitation will be auto-accepted in the signup function
          if (invitationData) {
            console.log('✅ Successfully signed up and accepted invitation');
          }
        } else {
          setError(result.error || 'Signup failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WireframeScreen
      annotations={{
        purpose: 'Entry point with role-based access control for different coaching staff types',
        kpis: ['Login success rate', 'Time to first session', 'Role distribution'],
        dependencies: ['Auth service', 'Organization lookup', 'Role permissions DB']
      }}
    >
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-900 rounded-lg mx-auto mb-4 flex items-center justify-center text-white text-2xl">
              ML
            </div>
            <h2 className="text-gray-900 mb-2">MotionLabs AI Pilot</h2>
            <p className="text-gray-600 text-sm">Movement pattern analysis for gymnastics</p>
          </div>

          {invitationData && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-1">
                You're invited by {invitationData.coachName}!
              </p>
              <p className="text-xs text-blue-700">
                Join {invitationData.institution || 'the team'} as an athlete
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Toggle between Login and Signup */}
          {!invitationData && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setIsSignup(false);
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isLogin
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setIsSignup(true);
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isSignup
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-gray-700 text-sm mb-2">Full Name <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading || !!invitationData}
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm mb-2">Email <span className="text-red-600">*</span></label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="coach@example.com"
                className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading || (!!invitationData && invitationData.athleteEmail)}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">Password <span className="text-red-600">*</span></label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-gray-700 text-sm mb-2">Confirm Password <span className="text-red-600">*</span></label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {!invitationData && (
              <div>
                <label className="block text-gray-700 text-sm mb-2">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  placeholder="Select your organization"
                  className="w-full h-12 border-2 border-gray-300 rounded-lg px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            )}

            {isSignup && !invitationData && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2">
                  Role <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['coach', 'athlete'] as const).map((role) => (
                    <label
                      key={role}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-2 ${
                        selectedRole === role
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value as 'coach' | 'athlete')}
                        className="w-4 h-4"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700 capitalize">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isLogin && !invitationData && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2">
                  Role <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Head Coach', 'Assistant Coach', 'S&C Coach', 'AT/PT', 'Admin'].map((role) => (
                    <label
                      key={role}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-colors flex items-center gap-2 ${
                        coachRole === role
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="coachRole"
                        value={role}
                        checked={coachRole === role}
                        onChange={(e) => setCoachRole(e.target.value)}
                        className="w-4 h-4"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full h-12 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Sign Up'
              )}
            </button>

            {!invitationData && (
              <p className="text-center text-gray-500 text-sm mt-4">
                {isLogin
                  ? "Don't have an account? Switch to Sign Up"
                  : 'Already have an account? Switch to Sign In'}
              </p>
            )}
          </form>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 2: Team Onboarding - Roster Setup (Enhanced)
function TeamOnboardingRosterEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Phase 1 onboarding: Collect roster data via CSV upload or manual entry',
        kpis: ['Completion rate', 'CSV vs manual preference', 'Time to complete'],
        dependencies: ['CSV parser', 'File upload service', 'Roster DB schema']
      }}
    >
      <TopNavEnhanced title="Team Onboarding - Phase 1" role="Head Coach" orgName="Central High Gymnastics" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Step 1: Roster Setup</h3>
          <p className="text-gray-600 text-sm">Add your athletes and their baseline information</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-2 bg-gray-900 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded" />
        </div>

        {/* CSV Upload Option */}
        <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center mb-6 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-900 mb-1">Upload Roster CSV</p>
          <p className="text-gray-600 text-sm mb-3">Drag and drop or click to browse</p>
          <p className="text-gray-500 text-xs">
            Required fields: Name, Age, Height, Weight, Team/Event Focus, Injury Status
          </p>
        </div>

        <div className="text-center text-gray-500 text-sm mb-6">— OR —</div>

        {/* Manual Entry Form */}
        <div className="border-2 border-gray-300 rounded-lg p-6 mb-6 bg-white">
          <p className="text-gray-900 mb-4">Add Athlete Manually</p>
          <div className="grid grid-cols-3 gap-4">
            <FormFieldEnhanced label="First Name" placeholder="Enter first name" required />
            <FormFieldEnhanced label="Last Name" placeholder="Enter last name" required />
            <FormFieldEnhanced label="Age" placeholder="16" required />
            <FormFieldEnhanced label="Height (in)" placeholder="64" />
            <FormFieldEnhanced label="Weight (lbs)" placeholder="120" />
            <FormFieldEnhanced 
              label="Primary Event" 
              type="select"
              placeholder="Vault / Bars / Beam / Floor"
              required
            />
            <div className="col-span-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <input type="checkbox" className="w-4 h-4" />
                Injury status flag (current or recent injury)
              </label>
              <FormFieldEnhanced 
                label="Injury Details (optional)" 
                type="textarea"
                placeholder="Brief description or upload medical clearance"
              />
            </div>
          </div>
          <ButtonEnhanced variant="outline" size="medium">
            <Plus className="w-4 h-4 inline mr-2" />
            Add Athlete to Roster
          </ButtonEnhanced>
        </div>

        {/* Added Athletes Preview */}
        <div className="mb-6">
          <p className="text-gray-700 text-sm mb-3">Added Athletes (3)</p>
          <div className="space-y-2">
            {[
              'Sarah Johnson, 16 • Vault/Floor',
              'Emily Davis, 15 • Bars/Beam',
              'Mike Chen, 17 • All-Around'
            ].map((name, i) => (
              <div key={i} className="flex items-center justify-between border-2 border-gray-300 rounded-lg p-3 bg-white">
                <span className="text-gray-900 text-sm">{name}</span>
                <button className="text-gray-500 hover:text-red-600 text-sm transition-colors">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <ButtonEnhanced variant="outline" size="medium">
            Cancel
          </ButtonEnhanced>
          <ButtonEnhanced variant="primary" size="medium">
            Next: Practice Schedule →
          </ButtonEnhanced>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 3: Team Onboarding - Schedule (Enhanced)
function TeamOnboardingScheduleEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Phase 1 onboarding: Practice schedule collection for session tracking',
        kpis: ['Schedule upload rate', 'Manual vs file upload', 'Average sessions per week', 'Average hours per session', 'Session type breakdown', 'Time median', 'Time spent'],
        dependencies: ['Calendar parser (.ics, .csv)', 'File upload', 'Schedule DB']
      }}
    >
      <TopNavEnhanced title="Team Onboarding - Phase 1" role="Head Coach" orgName="Central High Gymnastics" />
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-2">Step 2: Practice Schedule</h3>
          <p className="text-gray-600 text-sm">Upload your calendar or manually enter practice times</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-2 bg-gray-900 rounded" />
          <div className="flex-1 h-2 bg-gray-900 rounded" />
          <div className="flex-1 h-2 bg-gray-200 rounded" />
        </div>

        {/* Calendar Upload */}
        <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center mb-6 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors">
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-900 mb-1">Upload Calendar File</p>
          <p className="text-gray-600 text-sm mb-3">Supported formats: iCal (.ics), CSV, Google Calendar export</p>
        </div>

        <div className="text-center text-gray-500 text-sm mb-6">— OR —</div>

        {/* Manual Entry with Calendar Picker */}
        <div className="border-2 border-gray-300 rounded-lg p-6 mb-6 bg-white">
          <p className="text-gray-900 mb-4">Add Practice Session</p>
          <div className="grid grid-cols-2 gap-4">
            <FormFieldEnhanced label="Day of Week" type="select" placeholder="Monday" required />
            <FormFieldEnhanced label="Time" placeholder="3:00 PM - 5:00 PM" required />
            <FormFieldEnhanced label="Location" placeholder="Main Gym" />
            <FormFieldEnhanced label="Session Type" type="select" placeholder="Training / Competition / Open" />
          </div>
          <ButtonEnhanced variant="outline" size="medium">
            <Plus className="w-4 h-4 inline mr-2" />
            Add to Schedule
          </ButtonEnhanced>
        </div>

        {/* Weekly Preview */}
        <div className="border-2 border-gray-300 rounded-lg p-4 mb-6 bg-white">
          <p className="text-gray-700 text-sm mb-3">Weekly Schedule Preview</p>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="text-center">
                <p className="text-xs text-gray-500 mb-2">{day}</p>
                <div className={`h-16 rounded border-2 ${
                  i === 0 || i === 2 || i === 4 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                }`}>
                  {(i === 0 || i === 2 || i === 4) && (
                    <p className="text-xs text-gray-600 mt-2">3-5pm</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <ButtonEnhanced variant="outline" size="medium">
            ← Back
          </ButtonEnhanced>
          <ButtonEnhanced variant="primary" size="medium">
            Complete Setup
          </ButtonEnhanced>
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 4: Athlete Roster List (HIGHER FIDELITY)
function AthleteRosterListEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Primary navigation hub - view all athletes with status indicators and quick access',
        kpis: ['Click-through to profiles', 'Filter usage', 'Alert acknowledgment rate'],
        dependencies: ['Athlete roster DB', 'Real-time status updates', 'Alert aggregation']
      }}
    >
      <TopNavEnhanced 
        title="Team Roster" 
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <>
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <ButtonEnhanced variant="outline" size="small">
              <Plus className="w-4 h-4 inline mr-1" /> Add Athlete
            </ButtonEnhanced>
            <ButtonEnhanced variant="outline" size="small">
              <Settings className="w-4 h-4" />
            </ButtonEnhanced>
          </>
        }
      />
      
      <div className="p-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Total Athletes</p>
            <p className="text-3xl text-gray-900">12</p>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 text-sm mb-1">Alert Level</p>
            <p className="text-3xl text-red-700">2</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-700 text-sm mb-1">Monitoring</p>
            <p className="text-3xl text-yellow-700">3</p>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <p className="text-green-700 text-sm mb-1">All Clear</p>
            <p className="text-3xl text-green-700">7</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
              All Athletes
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
              Alert Level
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
              Monitoring
            </button>
            <button className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-700 hover:border-gray-400">
              Injury Flag
            </button>
          </div>
          <div className="flex gap-2">
            <div className="w-64 h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center px-3">
              <span className="text-gray-400 text-sm">Search athletes...</span>
            </div>
          </div>
        </div>

        {/* Athlete Cards Grid */}
        <div className="grid grid-cols-3 gap-4">
          <AthleteCardEnhanced 
            name="Sarah Johnson" 
            age="16" 
            school="Central HS"
            status="alert"
            injuryFlag={false}
            quickMetric="Knee valgus: ↑18° (↑50% from baseline)"
          />
          <AthleteCardEnhanced 
            name="Emily Davis" 
            age="15" 
            school="West Side Academy"
            status="green"
            quickMetric="All metrics normal"
          />
          <AthleteCardEnhanced 
            name="Mike Chen" 
            age="17" 
            school="Central HS"
            status="monitor"
            quickMetric="Hip flexion: slight decrease"
          />
          <AthleteCardEnhanced 
            name="Jessica Lee" 
            age="16" 
            school="East Valley HS"
            status="green"
            quickMetric="All metrics normal"
          />
          <AthleteCardEnhanced 
            name="Tom Rodriguez" 
            age="15" 
            school="Central HS"
            status="green"
            injuryFlag={true}
            quickMetric="Cleared to train (ankle)"
          />
          <AthleteCardEnhanced 
            name="Anna Martinez" 
            age="16" 
            school="West Side Academy"
            status="alert"
            quickMetric="Landing form: deviation detected"
          />
          <AthleteCardEnhanced 
            name="Chris Park" 
            age="17" 
            school="Central HS"
            status="green"
            quickMetric="All metrics normal"
          />
          <AthleteCardEnhanced 
            name="Lily Wang" 
            age="15" 
            school="East Valley HS"
            status="monitor"
            quickMetric="Beam: inconsistent landing"
          />
          <AthleteCardEnhanced 
            name="David Kim" 
            age="16" 
            school="Central HS"
            status="green"
            quickMetric="All metrics normal"
          />
        </div>
      </div>
    </WireframeScreen>
  );
}

// Screen 5: Athlete Profile (Coach View) - HIGHER FIDELITY
function AthleteProfileCoachEnhanced() {
  return (
    <WireframeScreen
      annotations={{
        purpose: 'Detailed longitudinal view of athlete metrics, alerts, clips, and intervention history',
        kpis: [
          'Time spent on profile',
          'Alert follow-up actions',
          'Clip review rate',
          'Recent activity interaction',
          'Profile visit frequency per athlete',
          'Trend chart interaction depth',
          'Intervention log update rate',
          'Alert history drill-down rate',
          'Cross-metric comparison usage',
          'Baseline adjustment frequency',
          'Export/print profile rate',
          'Clip playback completion rate',
          'Time between profile views (staleness indicator)',
          'Profile navigation pattern (which sections viewed)',
          'Coach note addition rate',
          'Athlete comparison tool usage'
        ],
        dependencies: ['Athlete metrics DB', 'Clip storage/retrieval', 'Alert history', 'Intervention log', 'Longitudinal trend engine', 'Profile activity tracking', 'Coach notes DB']
      }}
    >
      <TopNavEnhanced 
        title="Athlete Profile" 
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <ButtonEnhanced variant="outline" size="small">
            ← Back to Roster
          </ButtonEnhanced>
        }
      />
      <div className="p-6">
        {/* Athlete Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-gray-900">Sarah Johnson</h3>
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Alert Level</span>
            </div>
            <p className="text-gray-600 text-sm mb-2">16 • Central HS • Level 9 • Vault/Floor Specialist</p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Height: 5'4"</span>
              <span>Weight: 118 lbs</span>
              <span>Training since: 2018</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ButtonEnhanced variant="outline" size="small">
              View Clips
            </ButtonEnhanced>
            <ButtonEnhanced variant="outline" size="small">
              Edit Profile
            </ButtonEnhanced>
          </div>
        </div>

        {/* Summary Blurb */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
          <p className="text-gray-900 text-sm mb-1"><strong>Current Status Summary:</strong></p>
          <p className="text-gray-700 text-sm">
            Sarah has shown increased knee valgus deviation (18° vs. baseline 12°, +50%) over the past 2 weeks,
            particularly on vault landings. Pattern confirmed across 3 sessions (6 clips). Consider form review,
            workload adjustment, or PT consultation.
          </p>
        </div>

        {/* Validation Status */}
        <div className="mb-6">
          <ValidationStatus status="worsening" />
        </div>

        {/* Key Metrics Trends (4 pilot metrics) */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Trends Over Time (4 Key Metrics)</h4>
          <div className="grid grid-cols-2 gap-4">
            <TrendChartEnhanced 
              title="Knee Valgus Angle (degrees)" 
              data={[45, 48, 50, 55, 60, 70, 75]}
              baseline={50}
            />
            <TrendChartEnhanced 
              title="Landing Knee Bend (degrees)" 
              data={[60, 58, 62, 60, 55, 52, 50]}
              baseline={60}
            />
            <TrendChartEnhanced 
              title="Hip Flexion Range (degrees)" 
              data={[50, 52, 48, 50, 48, 45, 42]}
              baseline={50}
            />
            <TrendChartEnhanced 
              title="Height Off Surface (inches)" 
              data={[50, 52, 55, 58, 60, 58, 55]}
              baseline={50}
            />
          </div>
        </div>

        {/* Alert History */}
        <div className="mb-6">
          <h4 className="text-gray-900 mb-4">Alert History</h4>
          <div className="space-y-3">
            {[
              { 
                date: '2 days ago', 
                type: 'alert', 
                message: 'Knee valgus deviation - Vault landing', 
                confidence: 'high' as const,
                action: 'Monitoring'
              },
              { 
                date: '5 days ago', 
                type: 'info', 
                message: 'Landing form improvement noted', 
                confidence: 'medium' as const,
                action: 'Resolved'
              },
              { 
                date: '1 week ago', 
                type: 'alert', 
                message: 'Reduced hip flexion - Floor routine', 
                confidence: 'medium' as const,
                action: 'Adjusted training'
              },
            ].map((alert, i) => (
              <div key={i} className="border-2 border-gray-300 rounded-lg p-4 flex items-start justify-between bg-white hover:border-gray-400 cursor-pointer transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-900 text-sm">{alert.message}</p>
                      <ConfidenceChip level={alert.confidence} />
                    </div>
                    <p className="text-gray-500 text-xs">{alert.date} • Action: {alert.action}</p>
                  </div>
                </div>
                <button className="text-gray-500 text-sm hover:text-gray-700">View →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Intervention Log */}
        <div>
          <h4 className="text-gray-900 mb-4">Intervention Log</h4>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Jan 2, 2026</span>
                <span className="text-gray-700">Reduced vault reps from 12 to 8 per session</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Dec 28, 2025</span>
                <span className="text-gray-700">Added strengthening exercises for knee stability</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Dec 20, 2025</span>
                <span className="text-gray-700">Consulted with PT - cleared for full training</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}

// Continue in next file due to length...