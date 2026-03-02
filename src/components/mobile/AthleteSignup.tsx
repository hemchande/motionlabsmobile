import React, { useState, useEffect } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useUser } from '../../contexts/UserContext';
import { db } from '../../lib/firebase';
import { getAthleteCoachApiUrl } from '../../lib/athleteCoachApiUrl';
import { createAthleteWithPhotoFormData } from '../../services/athleteCoachFastApiClient';

interface AthleteSignupProps {
  inviteToken?: string;
  coachEmail?: string;
  onComplete?: () => void;
}

export function AthleteSignup({ inviteToken, coachEmail, onComplete }: AthleteSignupProps) {
  const { signup, firebaseUser } = useAuth();
  const { user, refreshUser } = useUser();
  
  const [step, setStep] = useState<'signup' | 'photo' | 'complete'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Signup form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Extract invite details from URL
  useEffect(() => {
    if (inviteToken) {
      // In a real implementation, you'd decode the invite token to get athlete details
      // For now, we'll just use it as a validation token
      console.log('Signup via invite token:', inviteToken);
    }
  }, [inviteToken]);

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!email || !password || !fullName) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase auth account
      const result = await signup({
        email,
        password,
        fullName,
        role: 'athlete',
        institution: '', // Will be set from coach's institution
      });

      if (!result.success) {
        throw new Error(result.error || 'Signup failed');
      }

      setSuccess('Account created! Now upload your photo for face recognition.');
      setStep('photo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload photo and create athlete with face embedding
  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setError('Please select a photo');
      return;
    }

    if (!firebaseUser) {
      setError('User not authenticated. Please sign in again.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      // Create FormData with athlete info and photo
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('athlete_name', fullName);
      formData.append('email', email);
      formData.append('firebase_uid', firebaseUser.uid);
      
      if (age) formData.append('age', age);
      if (weight) formData.append('weight', weight);
      if (height) formData.append('height', height);
      if (coachEmail) formData.append('coach_email', coachEmail);

      console.log('📤 Uploading to:', getAthleteCoachApiUrl() + '/api/create-athlete-with-photo');

      // Call API to create athlete with photo and face embedding
      // This endpoint handles BOTH storage AND face embedding
      const apiUrl = getAthleteCoachApiUrl();
      const response = await createAthleteWithPhotoFormData(apiUrl, formData);

      console.log('✅ API Response:', response);

      if (response.status === 'success') {
        // Update Firestore with athlete_id
        if (response.athlete_id) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await updateDoc(userDocRef, {
              athleteId: response.athlete_id,
              athlete_id: response.athlete_id,
            });
            console.log('✅ Firestore updated with athlete_id:', response.athlete_id);
          } catch (firestoreErr) {
            console.warn('⚠️ Failed to update Firestore (continuing anyway):', firestoreErr);
          }
        }

        setSuccess('Profile created with face recognition! You can now sign in.');
        setStep('complete');
        
        // Refresh user context to get athlete_id
        await refreshUser();
        
        // Complete after 2 seconds
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      } else {
        throw new Error(response.message as string || 'Failed to create athlete profile');
      }
    } catch (err) {
      console.error('❌ Photo upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Skip photo upload (athlete can add later)
  const handleSkipPhoto = async () => {
    setSuccess('Account created! You can add a photo later in your profile.');
    await refreshUser();
    setTimeout(() => {
      onComplete?.();
    }, 1500);
  };

  if (step === 'complete') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-50 to-blue-50">
        <CheckCircle className="w-20 h-20 text-green-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to MotionLabs AI!</h2>
        <p className="text-gray-600 text-center mb-4">Your profile is ready. Redirecting...</p>
      </div>
    );
  }

  if (step === 'photo') {
    return (
      <div className="flex flex-col min-h-screen p-6 bg-white">
        <div className="mb-6">
          <button
            onClick={() => setStep('signup')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <Camera className="w-16 h-16 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Your Photo</h2>
          <p className="text-gray-600 text-center mb-6">
            Upload a clear photo for face recognition during training sessions
          </p>

          {error && (
            <div className="w-full p-4 mb-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="w-full p-4 mb-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Photo preview */}
          {photoPreview && (
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-100 mb-6">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Photo upload button */}
          <label className="w-full mb-4 cursor-pointer">
            <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center gap-3">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                {photoFile ? photoFile.name : 'Tap to select photo'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          {/* Action buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={handlePhotoUpload}
              disabled={!photoFile || uploadingPhoto}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploadingPhoto ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Photo'
              )}
            </button>

            <button
              onClick={handleSkipPhoto}
              disabled={uploadingPhoto}
              className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              Skip for Now
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can always add or update your photo later in your profile settings
          </p>
        </div>
      </div>
    );
  }

  // Signup form
  return (
    <div className="flex flex-col min-h-screen p-6 bg-white">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Athlete Profile</h1>
          {coachEmail && (
            <p className="text-gray-600">
              You've been invited by your coach to join MotionLabs AI
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="175"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
