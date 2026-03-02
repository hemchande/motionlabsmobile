# Photo-Based Profile Completion Logic

## New Behavior

Profile completion is now **photo-based for athletes**:

- **Athletes:** Need photo uploaded (indicated by `athleteId` in Firestore)
- **Coaches:** Don't need photo (just basic info)

---

## How It Works

### When You Login

```
Login (Google/Email)
     ↓
Check Firestore user document
     ↓
┌─────────────────────────────────┐
│ Is user an ATHLETE?             │
└─────────────────────────────────┘
     ↓                    ↓
   YES                  NO (Coach)
     ↓                    ↓
Has athleteId?        Has role & name?
     ↓                    ↓
   YES → Dashboard      YES → Dashboard
   NO → Need Photo      NO → Need Info
```

### The Check

```typescript
const isAthlete = userData.role === 'athlete';
const hasPhoto = !!userData.athleteId;  // athleteId created when photo uploaded
const hasBasicInfo = userData.role && userData.fullName;

const profileComplete = isAthlete 
  ? hasBasicInfo && hasPhoto   // Athletes need BOTH info AND photo
  : hasBasicInfo;               // Coaches just need info
```

---

## Scenarios

### Scenario 1: Athlete WITH Photo (athleteId exists)

**Firestore:**
```json
{
  "role": "athlete",
  "fullName": "John Doe",
  "athleteId": "athlete_456",  ← Photo uploaded!
  "email": "john@example.com"
}
```

**Result:**
```
✅ Complete profile (photo: true), authenticating
✅ User authenticated, redirecting to dashboard
🚀 REDIRECT TO DASHBOARD
```

---

### Scenario 2: Athlete WITHOUT Photo (no athleteId)

**Firestore:**
```json
{
  "role": "athlete",
  "fullName": "John Doe",
  "athleteId": null,  ← No photo yet!
  "email": "john@example.com"
}
```

**Result:**
```
⚠️ Incomplete profile (missing photo (athleteId)), showing profile completion
📸 SHOW PROFILE COMPLETION FOR PHOTO UPLOAD
```

---

### Scenario 3: Coach (Photo Not Required)

**Firestore:**
```json
{
  "role": "coach",
  "fullName": "Coach Smith",
  "institution": "Elite Sports",
  "email": "coach@example.com"
}
```

**Result:**
```
✅ Complete profile (photo: false), authenticating
✅ User authenticated, redirecting to dashboard
🚀 REDIRECT TO DASHBOARD (no photo needed)
```

---

## Console Logs to Watch

### Athlete WITH Photo
```
User document found: { athleteId: "athlete_456", ... }
✅ Complete profile (photo: true), authenticating
✅ User authenticated, redirecting to dashboard
```

### Athlete WITHOUT Photo
```
User document found: { athleteId: null, ... }
⚠️ Incomplete profile (missing photo (athleteId)), showing profile completion
```

### Coach (No Photo Needed)
```
User document found: { role: "coach", ... }
✅ Complete profile (photo: false), authenticating
✅ User authenticated, redirecting to dashboard
```

---

## How to Add Photo (For Existing Athletes)

If you're an athlete without `athleteId`, the profile completion screen should show photo upload.

**In `GoogleProfileCompletion.tsx`:**
- Select role: Athlete
- Fill in age, weight, height
- **Upload photo** ← This calls `/api/create-athlete-with-photo`
- Click "Continue"

**What happens:**
1. Photo uploaded to backend
2. Face embedding created
3. `athleteId` generated and returned
4. Firestore updated with `athleteId`
5. ✅ Profile now complete!
6. 🚀 Redirect to dashboard

---

## Database States

### MongoDB (Backend)

**Before Photo Upload:**
```json
{
  "athlete_id": null,
  "athlete_name": "John Doe",
  "email": "john@example.com",
  "face_embedding_id": null  ← No photo yet
}
```

**After Photo Upload:**
```json
{
  "athlete_id": "athlete_456",  ← Created!
  "athlete_name": "John Doe",
  "email": "john@example.com",
  "face_embedding_id": "athlete_abc123xyz"  ← Face recognition ready!
}
```

### Firestore

**Before Photo Upload:**
```json
{
  "athleteId": null,  ← Missing!
  "role": "athlete",
  "fullName": "John Doe"
}
```

**After Photo Upload:**
```json
{
  "athleteId": "athlete_456",  ← Now set!
  "role": "athlete",
  "fullName": "John Doe"
}
```

---

## Summary

✅ **Coaches:** Can access dashboard without photo
✅ **Athletes:** Must upload photo to get `athleteId`
✅ **Photo indicator:** Presence of `athleteId` in Firestore
✅ **Auto-redirect:** If `athleteId` exists, go to dashboard
✅ **Photo required:** If athlete without `athleteId`, show upload form

**Result:** Athletes with face recognition can access dashboard, those without are prompted to upload a photo first!
