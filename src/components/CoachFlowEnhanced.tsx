import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Upload, Plus, Play, Settings, Download, Bell, ChevronLeft, ChevronRight, Loader2, AlertCircle, Image } from 'lucide-react';
import { 
  RecordUploadVideoEnhanced,
  LiveRecordingViewHighFi,
  AlertBannerNotificationEnhanced,
  EvidenceCarouselHighFi,
} from './CoachFlowEnhancedPart2';
import { TeamDashboardEnhanced, SettingsRosterAdminEnhanced } from './CoachFlowEnhancedPart3';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { useCoachWebApp } from '../contexts/CoachWebAppContext';
import {
  getAthleteDetails,
  getAthleteSessions,
  getAthleteAlerts,
  getAthleteTrends,
  getAthleteSessionSummaries,
  getBaselinesForAthlete,
  getInsightDisplayLabel,
  manualCreateAthlete,
  addPhotoUploadToAthlete,
  type SessionSummary,
} from '../services/athleteCoachService';
import type { AthleteTrendsResponse } from '../services/athleteCoachFastApiClient';
import { AthleteTrendsCards } from './AthleteTrendsCards';
import { SessionSummaryCards } from './SessionSummaryCards';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BrevoService } from '../services/brevo';

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

// Screen 4: Athlete Roster List (wired to API + Firestore via CoachWebAppContext, Brevo invite)
function AthleteRosterListEnhanced() {
  const ctx = useCoachWebApp();
  const { user, firebaseUser } = useAuth();
  const roster = ctx?.roster ?? [];
  const loading = ctx?.rosterLoading ?? false;
  const alertCount = (ctx?.alerts ?? []).length;
  const alertLevel = roster.filter((a) => a.status === 'alert').length;
  const monitoring = roster.filter((a) => a.status === 'monitor').length;
  const allClear = roster.filter((a) => a.status !== 'alert' && a.status !== 'monitor').length;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [athleteEmail, setAthleteEmail] = useState('');
  const [athleteName, setAthleteName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    email: '',
    password: '',
    institution: '',
    height: '',
    weight: '',
    previousInjuries: '',
  });
  const [manualPhotoFile, setManualPhotoFile] = useState<File | null>(null);
  const manualPhotoInputRef = useRef<HTMLInputElement>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);

  const handleSelectAthlete = (athleteId: string) => {
    ctx?.setSelectedAthleteId(athleteId);
    ctx?.setWebScreen?.(4); // Athlete Profile
  };

  const handleManualChange = (field: keyof typeof manualForm, value: string) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleManualCreate = async () => {
    setManualError(null);
    setManualSuccess(false);
    if (!manualForm.fullName.trim() || !manualForm.email.trim() || !manualForm.password.trim()) {
      setManualError('Full name, email, and password are required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualForm.email.trim())) {
      setManualError('Please enter a valid email address.');
      return;
    }
    let heightNum: number | undefined;
    let weightNum: number | undefined;
    if (manualForm.height.trim()) {
      const h = Number(manualForm.height.trim());
      if (!Number.isFinite(h) || h <= 0) {
        setManualError('Height must be a positive number (cm).');
        return;
      }
      heightNum = h;
    }
    if (manualForm.weight.trim()) {
      const w = Number(manualForm.weight.trim());
      if (!Number.isFinite(w) || w <= 0) {
        setManualError('Weight must be a positive number (kg).');
        return;
      }
      weightNum = w;
    }
    setManualLoading(true);
    try {
      const result = await manualCreateAthlete({
        full_name: manualForm.fullName.trim(),
        email: manualForm.email.trim(),
        password: manualForm.password.trim(),
        institution: manualForm.institution.trim() || undefined,
        height: heightNum,
        weight: weightNum,
        previous_injuries: manualForm.previousInjuries.trim() || undefined,
      }) as { athlete_id?: string; status?: string; [key: string]: unknown };
      const athleteId = result?.athlete_id;
      if (manualPhotoFile && athleteId) {
        await addPhotoUploadToAthlete({
          athlete_id: athleteId,
          photo: manualPhotoFile,
          athlete_name: manualForm.fullName.trim() || undefined,
        });
      }
      setManualSuccess(true);
      setManualForm({
        fullName: '',
        email: '',
        password: '',
        institution: '',
        height: '',
        weight: '',
        previousInjuries: '',
      });
      setManualPhotoFile(null);
      if (manualPhotoInputRef.current) manualPhotoInputRef.current.value = '';
      await ctx?.refreshRoster?.();
      setTimeout(() => {
        setShowManualModal(false);
        setManualSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error creating manual athlete:', err);
      setManualError(err instanceof Error ? err.message : 'Failed to create athlete. Check backend /api/manual-athlete.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!athleteEmail.trim()) {
      setInviteError('Please enter an athlete email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(athleteEmail.trim())) {
      setInviteError('Please enter a valid email address');
      return;
    }
    const coachId = firebaseUser?.uid ?? (user as { id?: string })?.id ?? ctx?.coachId;
    if (!coachId) {
      setInviteError('User information not available. Please sign out and sign in again.');
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      const invitationLink = `${baseUrl}/?invite=${invitationToken}&mode=signup`;
      const coachName = user?.fullName ?? (firebaseUser as { displayName?: string })?.displayName ?? 'Coach';
      const coachEmail = user?.email ?? (firebaseUser as { email?: string })?.email ?? '';
      const emailTrimmed = athleteEmail.trim();
      await addDoc(collection(db, 'invitations'), {
        invitationToken,
        athleteEmail: emailTrimmed,
        athleteEmailLower: emailTrimmed.toLowerCase(),
        athleteName: athleteName.trim() || null,
        coachId,
        coachName,
        coachEmail,
        institution: user?.institution ?? null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      const result = await BrevoService.sendAthleteInvitation({
        coachName,
        coachEmail,
        athleteEmail: emailTrimmed,
        athleteName: athleteName.trim() || undefined,
        institution: user?.institution ?? undefined,
        invitationLink,
      });
      if (result.success) {
        setInviteError(null);
        setInviteSuccess(true);
        setAthleteEmail('');
        setAthleteName('');
        ctx?.refreshRoster?.();
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteSuccess(false);
        }, 2000);
      } else {
        setInviteError(result.error ?? 'Failed to send invitation. Please try again.');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setInviteError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <WireframeScreen
      annotations={{
        purpose: 'Primary navigation hub - view all athletes with status indicators and quick access',
        kpis: ['Click-through to profiles', 'Filter usage', 'Alert acknowledgment rate'],
        dependencies: ['Athlete roster DB', 'Real-time status updates', 'Alert aggregation']
      }}
    >
      {/* Invite modal (Brevo + Firestore) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !inviteLoading && setShowInviteModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-2 border-gray-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Athlete</h3>
            <p className="text-sm text-gray-600 mb-4">An email will be sent via Brevo with a sign-up link. The athlete will be added to your roster when they accept.</p>
            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{inviteError}</p>
              </div>
            )}
            {inviteSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                Invitation email sent. Check your Brevo dashboard if needed. The athlete can sign up via the link in the email.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Athlete email *</label>
                <input
                  type="email"
                  value={athleteEmail}
                  onChange={(e) => setAthleteEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={inviteLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Athlete name (optional)</label>
                <input
                  type="text"
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={inviteLoading}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <ButtonEnhanced variant="outline" size="medium" onClick={() => !inviteLoading && setShowInviteModal(false)}>
                Cancel
              </ButtonEnhanced>
              <ButtonEnhanced variant="primary" size="medium" onClick={handleSendInvite}>
                {inviteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send invitation'
                )}
              </ButtonEnhanced>
            </div>
          </div>
        </div>
      )}

      {/* Manual athlete creation modal (no invite, uses /api/manual-athlete) */}
      {showManualModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !manualLoading && setShowManualModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border-2 border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Athlete (manual)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create an athlete directly without sending an invite. You can set profile details now; the athlete can log in later with the password you choose.
            </p>
            {manualError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{manualError}</p>
              </div>
            )}
            {manualSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                Athlete created successfully. They now appear in your roster.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={manualForm.fullName}
                  onChange={(e) => handleManualChange('fullName', e.target.value)}
                  placeholder="Maya Lauzon"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => handleManualChange('email', e.target.value)}
                  placeholder="maya@example.com"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={manualForm.password}
                  onChange={(e) => handleManualChange('password', e.target.value)}
                  placeholder="temp-password-123"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={manualForm.institution}
                  onChange={(e) => handleManualChange('institution', e.target.value)}
                  placeholder={user?.institution ?? 'UC Berkeley'}
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={manualForm.height}
                  onChange={(e) => handleManualChange('height', e.target.value)}
                  placeholder="160"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={manualForm.weight}
                  onChange={(e) => handleManualChange('weight', e.target.value)}
                  placeholder="50"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous injuries</label>
                <textarea
                  value={manualForm.previousInjuries}
                  onChange={(e) => handleManualChange('previousInjuries', e.target.value)}
                  placeholder="Left ACL reconstruction 2020, ankle sprain 2022"
                  className="w-full h-20 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={manualLoading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo (optional)</label>
                <input
                  ref={manualPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setManualPhotoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  disabled={manualLoading}
                />
                {manualPhotoFile && (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Image className="w-3.5 h-3.5" />
                    {manualPhotoFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <ButtonEnhanced
                variant="outline"
                size="medium"
                onClick={() => !manualLoading && setShowManualModal(false)}
              >
                Cancel
              </ButtonEnhanced>
              <ButtonEnhanced
                variant="primary"
                size="medium"
                onClick={handleManualCreate}
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Create athlete'
                )}
              </ButtonEnhanced>
            </div>
          </div>
        </div>
      )}

      <TopNavEnhanced 
        title="Team Roster" 
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={
          <>
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {alertCount > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <ButtonEnhanced variant="outline" size="small" onClick={() => ctx && setShowInviteModal(true)}>
              <Plus className="w-4 h-4 inline mr-1" /> Invite Athlete
            </ButtonEnhanced>
            <ButtonEnhanced variant="primary" size="small" onClick={() => ctx && setShowManualModal(true)}>
              <Plus className="w-4 h-4 inline mr-1" /> Add Manual
            </ButtonEnhanced>
            <ButtonEnhanced variant="outline" size="small" onClick={() => ctx?.setWebScreen?.(10)}>
              <Settings className="w-4 h-4" />
            </ButtonEnhanced>
          </>
        }
      />
      
      <div className="p-6">
        {/* Header with Stats (from API) */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 text-sm mb-1">Total Athletes</p>
            <p className="text-3xl text-gray-900">{loading ? '—' : roster.length}</p>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-red-700 text-sm mb-1">Alert Level</p>
            <p className="text-3xl text-red-700">{loading ? '—' : alertLevel}</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-700 text-sm mb-1">Monitoring</p>
            <p className="text-3xl text-yellow-700">{loading ? '—' : monitoring}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <p className="text-green-700 text-sm mb-1">All Clear</p>
            <p className="text-3xl text-green-700">{loading ? '—' : allClear}</p>
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
          </div>
          <div className="flex gap-2">
            <div className="w-64 h-10 border-2 border-gray-300 rounded-lg bg-white flex items-center px-3">
              <span className="text-gray-400 text-sm">Search athletes...</span>
            </div>
          </div>
        </div>

        {/* Athlete Cards Grid (from API roster) */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            Loading roster…
          </div>
        ) : roster.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            No athletes in roster. Add athletes via invite or sync with backend.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {roster.map((a) => (
              <AthleteCardEnhanced
                key={a.athlete_id}
                name={a.athlete_name}
                age="—"
                school={a.activity ?? '—'}
                status={a.status === 'alert' ? 'alert' : a.status === 'monitor' ? 'monitor' : 'green'}
                quickMetric={a.activity ?? 'View profile'}
                onClick={() => handleSelectAthlete(a.athlete_id)}
              />
            ))}
          </div>
        )}
      </div>
    </WireframeScreen>
  );
}

// Screen 5: Athlete Profile (Coach View) — wired to API: details, sessions, alerts, trends
function AthleteProfileCoachEnhanced() {
  const ctx = useCoachWebApp();
  const athleteId = ctx?.selectedAthleteId ?? null;
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummary[]>([]);
  const [alerts, setAlerts] = useState<Array<Record<string, unknown>>>([]);
  const [trends, setTrends] = useState<AthleteTrendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rosterAthlete = ctx?.roster.find((a) => a.athlete_id === athleteId);
  const athleteName = rosterAthlete?.athlete_name ?? (details?.fullName ?? details?.athlete_name ?? details?.name) as string | undefined ?? 'Athlete';

  useEffect(() => {
    if (!athleteId) {
      setDetails(null);
      setSessions([]);
      setSessionSummaries([]);
      setAlerts([]);
      setTrends(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [detailsRes, sessionsRes, summariesRes, alertsRes, trendsRes] = await Promise.all([
          getAthleteDetails(athleteId).catch(() => ({})),
          getAthleteSessions(athleteId, { limit: 20 }).then((r) => (r.sessions as unknown[]) ?? []),
          getAthleteSessionSummaries(athleteId, { limit: 20 }).then((r) => r.summaries ?? []),
          getAthleteAlerts(athleteId, { limit: 20 }).then((r) => ((r.alerts as unknown) as Array<Record<string, unknown>>) ?? []),
          getAthleteTrends(athleteId).catch(() => null),
        ]);
        if (cancelled) return;
        setDetails(typeof detailsRes === 'object' && detailsRes !== null && !Array.isArray(detailsRes) ? (detailsRes as Record<string, unknown>) : null);
        setSessions(Array.isArray(sessionsRes) ? sessionsRes : []);
        setSessionSummaries(Array.isArray(summariesRes) ? summariesRes : []);
        setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
        setTrends(trendsRes && typeof trendsRes === 'object' && !Array.isArray(trendsRes) && 'status' in trendsRes ? (trendsRes as AthleteTrendsResponse) : null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [athleteId]);

  const backToRoster = () => {
    ctx?.setSelectedAthleteId(null);
    ctx?.setWebScreen?.(3);
  };

  if (!ctx) {
    return (
      <WireframeScreen annotations={{ purpose: 'Athlete profile', kpis: [], dependencies: [] }}>
        <TopNavEnhanced title="Athlete Profile" role="Head Coach" orgName="Central High Gymnastics" />
        <div className="p-6 text-gray-500">Use the Roster tab to select an athlete.</div>
      </WireframeScreen>
    );
  }

  if (!athleteId) {
    return (
      <WireframeScreen annotations={{ purpose: 'Athlete profile', kpis: [], dependencies: [] }}>
        <TopNavEnhanced title="Athlete Profile" role="Head Coach" orgName="Central High Gymnastics" actions={<ButtonEnhanced variant="outline" size="small" onClick={backToRoster}>← Back to Roster</ButtonEnhanced>} />
        <div className="p-6">
          <p className="text-gray-600 mb-4">Select an athlete from the Roster to view their profile.</p>
          <ButtonEnhanced variant="outline" size="medium" onClick={backToRoster}>← Back to Roster</ButtonEnhanced>
        </div>
      </WireframeScreen>
    );
  }

  const statusLabel = rosterAthlete?.status === 'alert' ? 'Alert Level' : rosterAthlete?.status === 'monitor' ? 'Monitoring' : 'All Clear';
  const hasAlerts = alerts.length > 0;

  return (
    <WireframeScreen
      annotations={{
        purpose: 'Detailed longitudinal view of athlete metrics, alerts, clips, and intervention history',
        kpis: ['Time spent on profile', 'Alert follow-up actions', 'Clip review rate'],
        dependencies: ['Athlete metrics DB', 'Clip storage/retrieval', 'Alert history']
      }}
    >
      <TopNavEnhanced
        title="Athlete Profile"
        role="Head Coach"
        orgName="Central High Gymnastics"
        actions={<ButtonEnhanced variant="outline" size="small" onClick={backToRoster}>← Back to Roster</ButtonEnhanced>}
      />
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            Loading profile…
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800 text-sm mb-6">{error}</div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
              <div className="w-24 h-24 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-gray-900">{athleteName}</h3>
                  {hasAlerts && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">{statusLabel}</span>
                    </>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2">{rosterAthlete?.activity ?? (details?.activity as string) ?? '—'}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  {(details?.height != null || details?.age != null) && <span>{[details.height, details.age].filter((x) => x != null).map(String).join(' • ')}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <ButtonEnhanced
                  variant="outline"
                  size="small"
                  onClick={() => {
                    if (alerts.length > 0) {
                      const first = alerts[0] as Record<string, unknown>;
                      ctx?.setSelectedAlertId?.(String(first._id ?? first.alert_id ?? 0));
                      ctx?.setWebScreen?.(8);
                    } else {
                      ctx?.setWebScreen?.(7);
                    }
                  }}
                >
                  View Clips
                </ButtonEnhanced>
              </div>
            </div>

            {hasAlerts && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
                <p className="text-gray-900 text-sm mb-1"><strong>Current Status Summary:</strong></p>
                <p className="text-gray-700 text-sm">
                  {alerts.length} alert{alerts.length !== 1 ? 's' : ''} on file. Review alert history and evidence below.
                </p>
              </div>
            )}

            {hasAlerts && <div className="mb-6"><ValidationStatus status="worsening" /></div>}

            {trends?.status === 'success' && trends.trends && trends.trends.length > 0 && (
              <AthleteTrendsCards
                trends={trends.trends}
                athleteName={trends.athlete_name ?? athleteName}
                title="Trends"
              />
            )}

            <div className="mb-6">
              <h4 className="text-gray-900 mb-4">Alert History ({alerts.length})</h4>
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-sm">No alerts for this athlete.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.slice(0, 10).map((alert, i) => (
                    <div key={i} className="border-2 border-gray-300 rounded-lg p-4 flex items-start justify-between bg-white hover:border-gray-400 cursor-pointer transition-colors">
                      <div className="flex-1">
                        <p className="text-gray-900 text-sm">{getInsightDisplayLabel(String(alert.insight_id ?? alert.alert_type ?? 'alert'))}</p>
                        <p className="text-gray-500 text-xs">{String(alert.created_at ?? alert.updated_at ?? '—')}</p>
                      </div>
                      <button
                        type="button"
                        className="text-gray-500 text-sm hover:text-gray-700"
                        onClick={() => { ctx.setSelectedAlertId(String(alert._id ?? alert.alert_id ?? i)); ctx.setWebScreen?.(8); }}
                      >
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              {sessionSummaries.length > 0 ? (
                <SessionSummaryCards
                  summaries={sessionSummaries}
                  title="Session Summaries"
                  maxCards={10}
                />
              ) : sessions.length === 0 ? (
                <>
                  <h4 className="text-gray-900 font-semibold mb-3">Session Summaries</h4>
                  <p className="text-gray-500 text-sm">No sessions yet.</p>
                </>
              ) : (
                <>
                  <h4 className="text-gray-900 font-semibold mb-3">Sessions ({sessions.length})</h4>
                  <div className="space-y-2 text-sm">
                    {sessions.slice(0, 5).map((s: unknown, i: number) => {
                      const sess = s as Record<string, unknown>;
                      const streamUrl = sess.cloudflare_stream_url as string | undefined;
                      return (
                        <div key={i} className="border-2 border-gray-200 rounded-xl p-3 bg-white">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">{String(sess.session_id ?? sess.timestamp ?? 'Session')}</span>
                            <span className="text-gray-500 text-xs truncate">{String(sess.activity ?? sess.technique ?? '')}</span>
                          </div>
                          {streamUrl && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <a href={streamUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs break-all">
                                {streamUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <MandatoryFooter />
    </WireframeScreen>
  );
}

// Continue in next file due to length...