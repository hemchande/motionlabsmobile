# Athlete Onboarding Flow - Complete Guide

## Overview

This guide explains how athletes are invited, sign up, upload photos, and get face embeddings created for recognition during training sessions.

## Flow Diagram

```
Coach Invites Athlete
  ↓
Brevo Email with Invitation Link
  ↓
Athlete Clicks Link → AthleteSignup Component
  ↓
Step 1: Create Account (Firebase Auth)
  ↓
Step 2: Upload Photo
  ↓
API Call: /api/create-athlete-with-photo
  ↓
Backend Creates Face Embedding
  ↓
Athlete Profile Complete with Face Recognition
```

## Implementation

### 1. Coach Invites Athlete

**File:** `src/services/brevo.ts`

**Usage:**
```typescript
import { BrevoService } from './services/brevo';

// Generate invitation link
const inviteLink = `https://your-app-domain.com/athlete/signup?invite=${token}&coach=${coachEmail}`;

// Send invitation
await BrevoService.sendAthleteInvitation({
  coachName: "Coach Smith",
  coachEmail: "coach@example.com",
  athleteEmail: "athlete@example.com",
  athleteName: "John Doe",
  institution: "Elite Sports Academy",
  invitationLink: inviteLink
});
```

### 2. Athlete Receives Email

The Brevo service sends a beautiful HTML email with:
- Personalized greeting
- Coach name and institution
- Benefits of joining MotionLabs AI
- One-click invitation button
- Direct signup link

**Email Template:** See `BrevoService.generateInvitationEmailHTML()`

### 3. Athlete Clicks Invitation Link

**URL Format:**
```
https://your-app.com/athlete/signup?invite=TOKEN&coach=coach@example.com
```

**Component:** `src/components/mobile/AthleteSignup.tsx`

### 4. Step 1: Account Creation

**Form Fields:**
- Full Name * (required)
- Email * (required)
- Password * (required, min 6 chars)
- Confirm Password * (required)
- Age (optional)
- Weight (optional, kg)
- Height (optional, cm)

**Backend:**
1. Creates Firebase Auth user
2. Stores user profile in Firestore
3. Creates user context for navigation

### 5. Step 2: Photo Upload

**Purpose:** Face recognition for automatic athlete identification during training

**UI:**
- Photo preview (circular, 48x48)
- Upload button with file picker
- Skip option (can add photo later)

**Accepted:** `image/*` (jpg, png, etc.)

### 6. API Call: Create Athlete with Face Embedding

**Endpoint:** `POST /api/create-athlete-with-photo`

**FormData Fields:**
```javascript
{
  photo: File,                // Required: athlete photo
  athlete_name: string,       // Required: full name
  email: string,              // Required: email
  firebase_uid: string,       // Required: Firebase UID
  age: number,                // Optional
  weight: number,             // Optional
  height: number,             // Optional
  coach_email: string         // Optional: for linking to coach
}
```

**Backend Processing:**
1. Receives photo and athlete data
2. Generates face embedding using ML model
3. Stores embedding in vector database/index
4. Creates athlete record in MongoDB
5. Links athlete_id to Firebase UID
6. Returns success with athlete_id

**Response:**
```json
{
  "status": "success",
  "athlete_id": "athlete_123",
  "message": "Athlete created with face embedding"
}
```

### 7. User Context Update

After successful photo upload:
1. `refreshUser()` is called
2. UserContext fetches updated athlete_id from Firestore
3. Navigation now works with proper auth context

## Authentication Flow

### Before Signup
```javascript
isAuthenticated: false
user: null
// Navigation blocked to protected screens
```

### After Signup (Before Photo)
```javascript
isAuthenticated: true
firebaseUser: { uid, email, ... }
user: { id, email, fullName, role: 'athlete', athleteId: null }
// Can navigate but athleteId not yet set
```

### After Photo Upload
```javascript
isAuthenticated: true
firebaseUser: { uid, email, ... }
user: { 
  id, 
  email, 
  fullName, 
  role: 'athlete', 
  athleteId: 'athlete_123'  // ✅ Now set
}
// Full access with face recognition enabled
```

## Protected Routes

**File:** `src/components/MobileApp.tsx`

```typescript
const SKIP_AUTH_TEMPORARILY = false;  // ✅ Auth enabled
```

**Coach Screens:**
- Screen 0: Login ✅ (public)
- Screen 1-6: Protected ❌ (requires auth)

**Athlete Screens:**
- Screen 0: Login ✅ (public)
- Screen 1-3: Protected ❌ (requires auth)

## Face Recognition During Training

### How It Works

1. **Training Session Starts**
   - Camera captures athlete's face
   - Face is detected and embedded
   - Embedding compared to stored embeddings

2. **Automatic Identification**
   - Match found → `athlete_id` assigned to session
   - No Firebase UID needed during training!
   - Works even if athlete forgets to log in

3. **Session Association**
   - Backend: `session.athlete_id = matched_athlete_id`
   - Metrics, insights, alerts linked to athlete
   - Coach sees athlete name in session data

## Brevo Configuration

**Environment Variable:**
```bash
VITE_BREVO_API_KEY=your_brevo_api_key_here
```

**Get API Key:**
1. Sign up at https://www.brevo.com
2. Go to Settings → API Keys
3. Create new API key
4. Add to `.env` file

## Testing the Flow

### 1. Send Test Invitation

```typescript
// In your coach flow component
const handleInviteAthlete = async () => {
  const inviteLink = `${window.location.origin}/athlete/signup?invite=${btoa(athleteEmail)}&coach=${coachEmail}`;
  
  await BrevoService.sendAthleteInvitation({
    coachName: user.fullName,
    coachEmail: user.email,
    athleteEmail: "test@example.com",
    athleteName: "Test Athlete",
    institution: user.institution,
    invitationLink: inviteLink
  });
};
```

### 2. Click Invitation Link

Open the link in the email (or manually navigate to):
```
https://localhost:3000/athlete/signup?invite=BASE64_TOKEN&coach=coach@example.com
```

### 3. Complete Signup

- Fill in athlete details
- Create account
- Upload photo
- Wait for face embedding processing
- Redirect to athlete dashboard

### 4. Verify

```typescript
// Check user context
console.log('User:', user);
// Should show: { ..., athleteId: 'athlete_123', ... }

// Check Firestore
const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
console.log('Firestore:', userDoc.data());
// Should show: { ..., athleteId: 'athlete_123', ... }
```

## API Endpoint Details

### Backend Endpoint: `/api/create-athlete-with-photo`

**Python FastAPI Implementation:**
```python
@app.post("/api/create-athlete-with-photo")
async def create_athlete_with_photo(
    photo: UploadFile = File(...),
    athlete_name: str = Form(...),
    email: str = Form(...),
    firebase_uid: str = Form(...),
    age: Optional[int] = Form(None),
    weight: Optional[float] = Form(None),
    height: Optional[float] = Form(None),
    coach_email: Optional[str] = Form(None)
):
    # 1. Read photo bytes
    photo_bytes = await photo.read()
    
    # 2. Generate face embedding
    embedding = face_recognition_model.generate_embedding(photo_bytes)
    
    # 3. Store embedding in vector index
    vector_index.upsert(
        id=f"athlete_{firebase_uid}",
        embedding=embedding,
        metadata={
            "athlete_name": athlete_name,
            "email": email,
            "firebase_uid": firebase_uid
        }
    )
    
    # 4. Create athlete in MongoDB
    athlete_id = f"athlete_{generate_id()}"
    athletes_collection.insert_one({
        "_id": athlete_id,
        "athlete_id": athlete_id,
        "athlete_name": athlete_name,
        "email": email,
        "firebase_uid": firebase_uid,
        "age": age,
        "weight": weight,
        "height": height,
        "coach_email": coach_email,
        "face_embedding_id": f"athlete_{firebase_uid}",
        "created_at": datetime.utcnow()
    })
    
    return {
        "status": "success",
        "athlete_id": athlete_id,
        "message": "Athlete created with face embedding"
    }
```

## Troubleshooting

### Issue: "Athlete ID not found"

**Cause:** Face embedding not created or not linked to Firebase UID

**Fix:**
1. Check if photo was uploaded successfully
2. Verify `/api/create-athlete-with-photo` endpoint is working
3. Check backend logs for face detection errors
4. Re-upload photo in athlete profile settings

### Issue: "Cannot navigate to protected screens"

**Cause:** User not authenticated or user context not loaded

**Fix:**
1. Verify Firebase authentication succeeded
2. Check `isAuthenticated` in dev tools
3. Refresh user context: `refreshUser()`
4. Clear localStorage and re-login

### Issue: "Photo upload fails"

**Cause:** Image too large or wrong format

**Fix:**
1. Resize image to max 5MB
2. Use jpg, png, or webp format
3. Ensure face is clearly visible
4. Check backend accepts multipart/form-data

## Summary

✅ **Auth Protection Enabled** - Users must sign in
✅ **Brevo Invite Working** - Coaches can invite athletes via email
✅ **User Context Fresh** - Auth state properly managed
✅ **Photo Upload** - Calls `/api/create-athlete-with-photo`
✅ **Face Embedding** - Created and stored for recognition
✅ **Firebase UID Linked** - athlete_id associated with Firebase account

**Result:** Athletes can sign up, upload photos, and be automatically recognized during training sessions!
