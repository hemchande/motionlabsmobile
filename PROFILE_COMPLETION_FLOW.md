# Profile Completion Flow - What the "Continue" Button Does

## When This Happens

You're logged in with Google but haven't completed your profile yet. You see:

```
┌─────────────────────────────────┐
│ Complete your profile           │
│ Hi John! Add a few details      │
│                                 │
│ I am a: [Athlete] [Coach]      │
│ ... (more fields) ...          │
│                                 │
│      [Continue Button] ←        │
└─────────────────────────────────┘
```

---

## What the "Continue" Button Does

### Step 1: Collect Profile Data

```javascript
{
  role: 'athlete' or 'coach',
  institution: '...',      // For coaches
  age: 18,                 // For athletes
  weight: 70,              // For athletes
  height: '175cm',         // For athletes
  pastInjuries: '...',     // For athletes
  photoFile: File          // Optional
}
```

---

### Step 2: Call `completeProfile()` Function

This triggers a series of API calls and database operations:

---

## Endpoints Called (In Order)

### 1. ❌ Firebase Storage Upload (DISABLED)

**Originally:** Would upload photo to Firebase Storage
**Now:** Skipped due to CORS issues

```javascript
// DISABLED - line 216 in FirebaseAuthContext.tsx
if (data.photoFile && false) { // Never executes
  await uploadBytes(storageRef, data.photoFile);
  profileImageUrl = await getDownloadURL(storageRef);
}
```

---

### 2. ✅ Create User in FastAPI Backend

**Endpoint:** `POST /api/user/create`

```javascript
const apiClient = createAthleteCoachClient(getAthleteCoachApiUrl());

await apiClient.createUser({
  email: "user@example.com",
  password: "random-uuid-uuid",  // Auto-generated for Google users
  full_name: "John Doe",
  role: "athlete",
  institution: "...",
  firebase_uid: "abc123xyz"
});
```

**Request URL:**
```
POST https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/user/create
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "b5c3d4e5-6f7g-8h9i-0j1k-2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a",
  "full_name": "John Doe",
  "role": "athlete",
  "institution": "",
  "firebase_uid": "YmZLsmDBjUUPhVZ3eI8tncZwzSM2"
}
```

**Response:**
```json
{
  "status": "success",
  "user": {
    "id": "user_123",
    "athlete_id": "athlete_456",  // ← Important! Only for athletes
    "email": "user@example.com",
    "role": "athlete"
  }
}
```

**Backend Does:**
- ✅ Creates user record in MongoDB
- ✅ Generates `athlete_id` (for athletes only)
- ✅ Links `athlete_id` to `firebase_uid`
- ✅ Returns user data

---

### 3. ✅ Save Profile to Firestore

**Service:** Firebase Firestore
**Operation:** `setDoc()`

```javascript
await setDoc(doc(db, 'users', firebase_uid), {
  email: "user@example.com",
  fullName: "John Doe",
  role: "athlete",
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp(),
  profileImage: null,  // No Firebase Storage
  emailVerified: true,
  athleteId: "athlete_456",  // From FastAPI response
  mcpUserId: "user_123",     // From FastAPI response
  age: 18,
  weight: 70,
  height: "175cm",
  pastInjuries: null
});
```

**Firestore Document Path:**
```
users/{firebase_uid}
```

---

### 4. ⚠️ Register Photo (If Photo Was Uploaded)

**Only runs if:** `athleteId` exists AND `profileImageUrl` exists
**Currently:** Never runs (Firebase Storage disabled)

```javascript
// Would call if photo URL existed
if (athleteId && profileImageUrl) {
  await apiClient.addUserPhoto({
    athlete_id: athleteId,
    photo_url: profileImageUrl,
    athlete_name: fullName
  });
}
```

**Endpoint:** `POST /api/user/add-photo`

---

## Complete Flow Diagram

```
User Clicks "Continue"
     ↓
Collect form data
     ↓
completeProfile() called
     ↓
┌────────────────────────────────────┐
│ Step 1: Skip Firebase Storage     │
│ (Disabled due to CORS)             │
└────────────────────────────────────┘
     ↓
┌────────────────────────────────────┐
│ Step 2: Create User in FastAPI     │
│ POST /api/user/create              │
│ ✅ Creates MongoDB record          │
│ ✅ Returns athlete_id              │
└────────────────────────────────────┘
     ↓
┌────────────────────────────────────┐
│ Step 3: Save to Firestore          │
│ setDoc(users/{uid})                │
│ ✅ Stores profile data             │
│ ✅ Includes athlete_id             │
└────────────────────────────────────┘
     ↓
┌────────────────────────────────────┐
│ Step 4: Register Photo (Skipped)   │
│ POST /api/user/add-photo           │
│ ⚠️ Only if photo uploaded          │
└────────────────────────────────────┘
     ↓
Update Auth Context
     ↓
✅ Profile Complete!
     ↓
Redirect to Dashboard
```

---

## What Gets Stored Where

### Firebase Authentication
```javascript
{
  uid: "YmZLsmDBjUUPhVZ3eI8tncZwzSM2",
  email: "user@example.com",
  displayName: "John Doe",
  emailVerified: true
}
```

### Firebase Firestore: `users/{uid}`
```javascript
{
  email: "user@example.com",
  fullName: "John Doe",
  role: "athlete",
  athleteId: "athlete_456",      // ← From FastAPI
  mcpUserId: "user_123",         // ← From FastAPI
  createdAt: Timestamp,
  lastLogin: Timestamp,
  profileImage: null,
  emailVerified: true,
  // Athlete-specific fields
  age: 18,
  weight: 70,
  height: "175cm",
  pastInjuries: null
}
```

### MongoDB (via FastAPI): `athletes` collection
```javascript
{
  _id: "athlete_456",
  athlete_id: "athlete_456",
  athlete_name: "John Doe",
  email: "user@example.com",
  firebase_uid: "YmZLsmDBjUUPhVZ3eI8tncZwzSM2",
  role: "athlete",
  created_at: ISODate("2026-02-12T10:00:00Z")
}
```

---

## Console Logs to Watch For

When you click "Continue", you should see:

```javascript
// 1. FastAPI user creation
console.log('✅ User created via FastAPI with athlete_id:', 'athlete_456');

// 2. Firestore save (no log, but happens)

// 3. Photo registration (if applicable)
console.log('✅ Profile photo registered with backend');
// OR
console.warn('⚠️ FastAPI create-user failed (continuing with profile completion):', error);
```

---

## What Happens After?

### 1. Auth Context Updates
```javascript
setUser({
  id: firebase_uid,
  email: "user@example.com",
  fullName: "John Doe",
  role: "athlete",
  athleteId: "athlete_456",  // ← Now available!
  ...
});
setIsAuthenticated(true);
```

### 2. Navigate to Dashboard
- Athlete → Athlete Dashboard (Screen 1)
- Coach → Team Roster (Screen 1)

### 3. Can Now Access Protected Routes
- All screens [1-6] are now accessible
- User context is fully populated
- athlete_id is linked for face recognition

---

## Key Differences from Normal Signup

### Normal Signup Flow
1. Create Firebase account
2. Create FastAPI user
3. Upload photo via `/api/create-athlete-with-photo`
4. Save to Firestore

### Profile Completion Flow
1. ✅ Already have Firebase account (Google sign-in)
2. Create FastAPI user via `/api/user/create`
3. ❌ No photo upload (Firebase Storage disabled)
4. Save to Firestore

**Missing:** Photo upload with face embedding!

---

## If You Want to Add Photo Later

Users completing profile via Google don't upload photos. They can add it later via:

**Option 1:** Profile settings page (not yet implemented)
**Option 2:** Manual call to `/api/create-athlete-with-photo`

**Recommended:** Add a "Upload Photo" button in athlete profile that calls:
```javascript
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('athlete_name', user.fullName);
formData.append('email', user.email);
formData.append('firebase_uid', firebaseUser.uid);

await createAthleteWithPhotoFormData(apiUrl, formData);
```

---

## Summary

**Continue Button Calls:**
1. ✅ `POST /api/user/create` - Creates user in MongoDB with athlete_id
2. ✅ `setDoc(users/{uid})` - Saves profile to Firestore
3. ❌ Firebase Storage - Skipped (CORS issues)
4. ⚠️ `POST /api/user/add-photo` - Only if photo uploaded (currently never)

**Result:** User profile completed, athlete_id linked, ready to use the app!

**Missing:** Face recognition (no photo uploaded). User should add photo later for automatic athlete identification during training.
