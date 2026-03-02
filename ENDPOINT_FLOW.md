# What Happens When You Save Your Information

## Complete Endpoint Flow

### Step 1: Create Account (Signup Button)

**User Action:** Fills form and clicks "Create Account"

**Endpoints Called:**

#### 1.1 Firebase Authentication
```
Service: Firebase Auth
Method: createUserWithEmailAndPassword()
Action: Creates Firebase user account
Response: { uid, email, displayName }
```

#### 1.2 Firestore Database
```
Service: Firebase Firestore
Collection: users/{firebase_uid}
Method: setDoc()
Action: Stores user profile
Data: {
  email: "athlete@example.com",
  fullName: "John Doe",
  role: "athlete",
  institution: "",
  createdAt: timestamp,
  lastLogin: timestamp
}
```

**Result:** User account created, **but no athlete_id yet**

---

### Step 2: Upload Photo (Upload Photo Button)

**User Action:** Selects photo and clicks "Upload Photo"

**Endpoint Called:**

#### 2.1 Athlete Coach API - Create Athlete with Photo
```
URL: https://athlete-coach-fastapi-630016859450.europe-west1.run.app/api/create-athlete-with-photo
Method: POST
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```javascript
{
  photo: File,              // The actual photo file
  athlete_name: "John Doe",
  email: "athlete@example.com",
  firebase_uid: "abc123xyz", // From Firebase Auth
  age: "18",                 // Optional
  weight: "70",              // Optional
  height: "175",             // Optional
  coach_email: "coach@example.com" // Optional
}
```

**Backend Processing:**
1. ✅ Receives multipart form data
2. ✅ Extracts photo file
3. ✅ Generates face embedding using ML model
4. ✅ Stores embedding in vector index (for face recognition)
5. ✅ Creates athlete record in MongoDB
6. ✅ Links `athlete_id` to `firebase_uid`
7. ✅ Returns success response

**Response:**
```json
{
  "status": "success",
  "athlete_id": "athlete_123",
  "message": "Athlete created with face embedding"
}
```

#### 2.2 Update Firestore (After API Success)
```
Service: Firebase Firestore
Collection: users/{firebase_uid}
Method: updateDoc()
Action: Updates user document with athlete_id
Data: {
  athleteId: "athlete_123"
}
```

**Result:** User now has `athlete_id` linked!

---

## Visual Flow Diagram

```
User Fills Form
     ↓
[Create Account Button Clicked]
     ↓
Firebase Auth: createUserWithEmailAndPassword()
     ↓
Firestore: setDoc(users/{uid})
     ↓
✅ Account Created
     ↓
     ↓
User Selects Photo
     ↓
[Upload Photo Button Clicked]
     ↓
FormData Created:
  - photo (File)
  - athlete_name
  - email
  - firebase_uid
  - age, weight, height
     ↓
POST /api/create-athlete-with-photo
     ↓
Backend Processing:
  1. Read photo
  2. Generate face embedding
  3. Store in vector index
  4. Create MongoDB record
  5. Link firebase_uid → athlete_id
     ↓
Response: { athlete_id: "athlete_123" }
     ↓
Firestore: updateDoc({ athleteId: "athlete_123" })
     ↓
refreshUser() - Reload context
     ↓
✅ Complete - Face Recognition Enabled!
```

---

## Code References

### 1. Signup Function (Step 1)

**File:** `src/components/mobile/AthleteSignup.tsx`

```typescript
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Calls Firebase Auth
  const result = await signup({
    email,
    password,
    fullName,
    role: 'athlete',
    institution: '',
  });
  
  // This internally calls:
  // - Firebase: createUserWithEmailAndPassword()
  // - Firestore: setDoc(doc(db, 'users', uid), {...})
  
  if (result.success) {
    setStep('photo'); // Move to photo upload step
  }
};
```

### 2. Photo Upload Function (Step 2)

**File:** `src/components/mobile/AthleteSignup.tsx`

```typescript
const handlePhotoUpload = async () => {
  // 1. Create FormData
  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('athlete_name', fullName);
  formData.append('email', email);
  formData.append('firebase_uid', firebaseUser.uid);
  if (age) formData.append('age', age);
  if (weight) formData.append('weight', weight);
  if (height) formData.append('height', height);
  if (coachEmail) formData.append('coach_email', coachEmail);

  // 2. Call API endpoint
  const apiUrl = getAthleteCoachApiUrl();
  const response = await createAthleteWithPhotoFormData(apiUrl, formData);
  
  // 3. Update user context
  await refreshUser();
};
```

### 3. API Client Function

**File:** `src/services/athleteCoachFastApiClient.ts`

```typescript
export async function createAthleteWithPhotoFormData(
  baseUrl: string,
  formData: FormData
): Promise<Record<string, unknown>> {
  const url = `${baseUrl}/api/create-athlete-with-photo`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData, // Multipart form data
  });
  
  return await response.json();
}
```

---

## What Gets Stored Where

### Firebase Authentication
```json
{
  "uid": "abc123xyz",
  "email": "athlete@example.com",
  "emailVerified": false,
  "displayName": "John Doe"
}
```

### Firebase Firestore: `users/{uid}`
```json
{
  "email": "athlete@example.com",
  "fullName": "John Doe",
  "role": "athlete",
  "athleteId": "athlete_123",  // ← Added after photo upload!
  "institution": "",
  "createdAt": "2026-02-12T10:00:00Z",
  "lastLogin": "2026-02-12T10:00:00Z"
}
```

### MongoDB: `athletes` collection
```json
{
  "_id": "athlete_123",
  "athlete_id": "athlete_123",
  "athlete_name": "John Doe",
  "email": "athlete@example.com",
  "firebase_uid": "abc123xyz",  // ← Links to Firebase
  "age": 18,
  "weight": 70,
  "height": 175,
  "coach_email": "coach@example.com",
  "face_embedding_id": "athlete_abc123xyz",
  "created_at": "2026-02-12T10:00:00Z"
}
```

### Vector Index (Face Embeddings)
```python
{
  "id": "athlete_abc123xyz",
  "embedding": [0.123, -0.456, 0.789, ...], # 512-dimensional vector
  "metadata": {
    "athlete_name": "John Doe",
    "email": "athlete@example.com",
    "firebase_uid": "abc123xyz",
    "athlete_id": "athlete_123"
  }
}
```

---

## Summary

**Signup (No endpoint - Firebase only):**
- Firebase Auth: User account
- Firestore: User profile

**Photo Upload (1 endpoint):**
- `POST /api/create-athlete-with-photo`
  - Generates face embedding
  - Creates MongoDB athlete record
  - Links athlete_id to firebase_uid
  - Enables face recognition

**Result:** Athlete can be automatically identified during training without logging in!
