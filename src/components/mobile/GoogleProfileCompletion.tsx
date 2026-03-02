import React, { useState, useRef, useEffect } from 'react';
import { User, Dumbbell, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import type { GoogleProfileCompletionData } from '../../contexts/FirebaseAuthContext';

interface GoogleProfileCompletionProps {
  onComplete?: (role: 'coach' | 'athlete') => void;
}

/** True when user landed via invite link (invited athlete flow) – role must stay athlete */
function isInvitedAthleteFlow(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('invite') != null && params.get('mode') === 'signup';
}

export function GoogleProfileCompletion({ onComplete }: GoogleProfileCompletionProps) {
  const { firebaseUserPendingProfile, completeProfile, loading, user } = useAuth();
  const invitedAthlete = isInvitedAthleteFlow();
  const lockToAthlete = invitedAthlete || user?.role === 'athlete';
  const [role, setRole] = useState<'coach' | 'athlete'>(() => (lockToAthlete ? 'athlete' : 'athlete'));
  useEffect(() => {
    if (lockToAthlete) setRole('athlete');
  }, [lockToAthlete]);
  const [institution, setInstitution] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [pastInjuries, setPastInjuries] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!firebaseUserPendingProfile) {
      setError('Session expired. Please sign in again.');
      setSubmitting(false);
      return;
    }

    const effectiveRole = invitedAthlete ? 'athlete' : role;
    const data: GoogleProfileCompletionData = {
      role: effectiveRole,
      ...(effectiveRole === 'coach' && institution && { institution }),
      ...(effectiveRole === 'athlete' && {
        age: age ? parseInt(age, 10) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height || undefined,
        pastInjuries: pastInjuries || undefined,
        photoFile: photoFile || undefined,
      }),
    };

    const result = await completeProfile(data);
    setSubmitting(false);

    if (result.success) {
      onComplete?.(effectiveRole);
    } else {
      setError(result.error || 'Failed to save profile');
    }
  };

  if (!firebaseUserPendingProfile) {
    return null;
  }

  const displayName = firebaseUserPendingProfile.displayName || firebaseUserPendingProfile.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-full bg-gray-50 flex flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Complete your profile</h1>
        <p className="text-gray-600 mt-1">Hi {displayName}! Add a few details to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        {/* Role Selection – locked to athlete when coming from invite link */}
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">I am a</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => !lockToAthlete && setRole('athlete')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-colors ${
                role === 'athlete'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              } ${lockToAthlete ? 'cursor-default' : ''}`}
            >
              <Dumbbell className="w-5 h-5" />
              <span className="font-medium">Athlete</span>
            </button>
            <button
              type="button"
              onClick={() => !lockToAthlete && setRole('coach')}
              disabled={lockToAthlete}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-colors ${
                role === 'coach'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              } ${lockToAthlete ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Coach</span>
            </button>
          </div>
          {lockToAthlete && (
            <p className="mt-2 text-sm text-green-700">You were invited as an athlete – complete your profile below.</p>
          )}
        </div>

        {/* Coach: Institution */}
        {role === 'coach' && (
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Organization / School</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Lincoln High School"
              className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        {/* Athlete: Extra fields */}
        {role === 'athlete' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Age</label>
                <input
                  type="number"
                  min={8}
                  max={99}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 16"
                  className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Weight (lbs)</label>
                <input
                  type="number"
                  min={50}
                  max={500}
                  step={0.5}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 150"
                  className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Height</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 5'10&quot; or 178 cm"
                className="w-full h-12 border-2 border-gray-300 rounded-xl px-4 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Past injuries (optional)</label>
              <textarea
                value={pastInjuries}
                onChange={(e) => setPastInjuries(e.target.value)}
                placeholder="e.g. ACL tear 2022, ankle sprain"
                rows={3}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Profile photo</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-gray-100 transition-colors"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-500" />
                  )}
                </button>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-600">
                    {photoFile ? photoFile.name : 'Tap to upload a photo'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || submitting}
          className="mt-auto w-full h-12 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          {(loading || submitting) ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>
    </div>
  );
}
