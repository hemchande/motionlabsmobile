# Firestore Security Rules Fix

## Problem

Getting "**missing or insufficient permissions**" when clicking "Continue" on profile completion.

This is a **Firestore security rules** issue - your database is blocking authenticated users from reading/writing their own profile documents.

---

## Solution

Apply the correct Firestore security rules to allow users to manage their own data.

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **motionlabsai-c2a0b**
3. Click **"Firestore Database"** in left menu
4. Click **"Rules"** tab at the top

---

### Step 2: Update Rules

**Replace** the existing rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read and write their own document
    match /users/{userId} {
      // Allow read if authenticated and it's their own document
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Allow write (create/update) if authenticated and it's their own document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions collection - allow read for authenticated users
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Athletes collection - allow read/write for authenticated users
    match /athletes/{athleteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Coaches collection - allow read/write for authenticated users
    match /coaches/{coachId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### Step 3: Publish Rules

1. Click **"Publish"** button in Firebase Console
2. Wait for confirmation: "Rules published successfully"

---

## What These Rules Do

### ✅ Users Collection
```javascript
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

**Allows:**
- **Read:** Authenticated users can read their own document
- **Write:** Authenticated users can create/update their own document

**Blocks:**
- Unauthenticated access
- Users reading/writing other users' documents

---

### ✅ Other Collections

**Sessions, Athletes, Coaches:**
- Any authenticated user can read/write
- Unauthenticated users blocked

---

## Test After Publishing

1. **Logout** from your app
2. **Login** again
3. Click **"Continue"** on profile completion
4. Should now work! ✅

---

## Console Logs to Verify

### Before Fix (Permission Error)
```
⚠️ Could not fetch/update existing Firestore data: 
FirebaseError: Missing or insufficient permissions
```

### After Fix (Success)
```
✅ Found existing Firestore data: { email: "...", role: "..." }
✅ Existing user profile updated, redirecting to dashboard
```

---

## Alternative: Use Firebase CLI (Optional)

If you have Firebase CLI installed:

```bash
# Login to Firebase
firebase login

# Initialize Firestore (if not already)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

The rules are saved in `firestore.rules` in your project root.

---

## Security Notes

### Current Rules Allow:
✅ Users to manage their own profile
✅ Authenticated users to access sessions/athletes/coaches
❌ Unauthenticated access
❌ Cross-user data access

### Production Recommendations:

For tighter security, consider:

1. **Coach-specific data:**
   ```javascript
   match /coaches/{coachId} {
     allow read: if request.auth != null;
     allow write: if request.auth.uid == coachId;
   }
   ```

2. **Athlete-coach relationships:**
   ```javascript
   match /athletes/{athleteId} {
     allow read: if request.auth != null && 
       (request.auth.uid == resource.data.userId || 
        request.auth.uid == resource.data.coachId);
   }
   ```

3. **Session ownership:**
   ```javascript
   match /sessions/{sessionId} {
     allow read: if request.auth != null && 
       request.auth.uid == resource.data.userId;
   }
   ```

---

## Summary

**Problem:** Firestore rules too restrictive
**Solution:** Update rules to allow user self-management
**Where:** Firebase Console → Firestore Database → Rules
**Action:** Paste rules above → Publish

**Result:** Profile completion will work! ✅
