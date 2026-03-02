# Athlete Coach FastAPI Backend – Required Changes

This doc describes what the **Athlete Coach FastAPI backend** (e.g. `athlete-coach-fastapi-*.run.app`) must implement so that:

- Users with photos show in the **roster** (GET /api/athletes).
- Those same users appear in **face embedding metadata** in GCP.
- The frontend’s use of `athlete_id` (from create-user → roster → details/embeddings) is consistent end-to-end.

The frontend already stores and uses the **backend `athlete_id`** (from create-user) in Firestore and for all athlete API calls. The backend must guarantee the following behavior.

---

## 1. Create user – return and persist `athlete_id`

**Endpoint:** `POST /api/create-user`

**Request body (JSON):**
- `email`, `password`, `full_name`
- `role`: `"athlete"` | `"coach"`
- `institution` (optional), `firebase_uid` (optional)

**Required behavior:**

- For **athletes**, create a record in your primary DB (e.g. MongoDB) and assign a stable **`athlete_id`** (e.g. UUID or your existing id scheme).
- **Response** must include that id so the frontend can store it and use it everywhere:

```json
{
  "status": "success",
  "user": {
    "id": "<your_internal_user_id>",
    "athlete_id": "<stable_athlete_id>",
    "email": "...",
    "fullName": "...",
    "role": "athlete"
  }
}
```

- If the user already exists (e.g. same email), return a clear error or success-with-existing-user and, if possible, include the existing **`athlete_id`** in the response so the frontend can still use it.
- The same **`athlete_id`** must be the one used for:
  - Listing in GET /api/athletes  
  - GET /api/athlete/{athlete_id}/details  
  - POST /api/athlete/add-photo and add-photo-upload  
  - GET /api/athlete/{athlete_id}/facial-embeddings  
  - All other athlete-scoped endpoints (sessions, alerts, etc.)

---

## 2. List athletes – include everyone with an `athlete_id`

**Endpoint:** `GET /api/athletes?limit=...&include_stats=...`

**Required behavior:**

- Return **all** athletes that exist in your DB (including those created via create-user and those who later add a photo).
- Each item must include the **same `athlete_id`** that create-user returned and that is used in `/api/athlete/{athlete_id}/...` routes.

**Example response:**

```json
{
  "status": "success",
  "count": 2,
  "athletes": [
    {
      "athlete_id": "abc-123",
      "athlete_name": "Jane Doe",
      "email": "jane@example.com",
      "session_count": 0,
      "activities": [],
      "techniques": [],
      "last_session_date": null
    }
  ]
}
```

- Do **not** filter out athletes just because they have no photo yet or no face embedding. The frontend merges this list with Firestore; if an athlete is missing here but has a photo and `athlete_id` in Firestore, they can still appear in the roster, but alerts/details/embeddings will only work if the backend also knows them under that `athlete_id`.

---

## 3. Profile details – 403 until photo exists

**Endpoint:** `GET /api/athlete/{athlete_id}/details`

**Required behavior:**

- If the athlete **does not** have a photo stored (and no face embedding, if you tie “profile complete” to that):
  - Return **403**.
  - Body must be JSON so the frontend can show “Complete your profile” and the add-photo step:

```json
{
  "profile_complete": false,
  "message": "Complete your profile by adding a photo to see your profile.",
  "add_photo_endpoint": "POST /api/athlete/add-photo-upload"
}
```

- If the athlete **has** a photo (and optionally a face embedding):
  - Return **200** and the full profile (e.g. name, email, photo URL, stats, etc.).

---

## 4. Add photo – persist photo and write face embeddings (GCP)

**Endpoints:**

- `POST /api/athlete/add-photo` (JSON body: `athlete_id`, `photo_url`, optional `athlete_name`)
- `POST /api/athlete/add-photo-upload` (multipart: `athlete_id` (form), `photo` (file), optional `athlete_name` (form))

**Required behavior:**

- Accept the **same `athlete_id`** that create-user returns and that GET /api/athletes uses.
- **Persist the photo** for that athlete (e.g. store URL or file in GCS, save reference in your DB keyed by `athlete_id`).
- **Compute and store face embedding metadata in GCP** (e.g. Firestore, BigQuery, or your embedding store) keyed by **that same `athlete_id`** so that:
  - GET /api/athlete/{athlete_id}/facial-embeddings returns data for this athlete.
  - Any downstream face-matching or analytics use the same id.
- After a successful add-photo or add-photo-upload, GET /api/athlete/{athlete_id}/details should return **200** with full profile (so the frontend can stop showing “complete profile”).
- If the athlete does not exist for that `athlete_id`, return 404 or 400 with a clear message.

This is the critical change: **every path that adds a photo (add-photo or add-photo-upload) must also write or update face embedding metadata in GCP under the same `athlete_id`.** Otherwise “users with a photo” will not show up in face embedding metadata.

---

## 5. Facial embeddings – key by `athlete_id`

**Endpoint:** `GET /api/athlete/{athlete_id}/facial-embeddings`

**Required behavior:**

- Use the same **`athlete_id`** as in create-user and add-photo.
- Return the embedding metadata (or list of embeddings) stored for that athlete in GCP.
- If no embedding exists yet (e.g. no photo added), return 200 with an empty list or 404, depending on your contract. The frontend uses this for display/analytics; it should reflect what was written when the photo was uploaded.

---

## 6. Login – return `athlete_id` for athletes

**Endpoint:** `POST /api/login`

**Request body:** `email`, `password`, optional `role`.

**Required behavior:**

- On success, include the backend **`athlete_id`** for athletes so the frontend can store it and use it for profile/details and add-photo:

```json
{
  "status": "success",
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "...",
    "fullName": "...",
    "role": "athlete",
    "athlete_id": "abc-123"
  },
  "token": "..."
}
```

---

## 7. Optional – create athlete with photo in one step

**Endpoint:** `POST /api/create-athlete-with-photo` (multipart)

**Body (form):** `email`, `password`, `full_name`, `photo` (file).

**Required behavior:**

- Create the athlete and store the photo in one step.
- Return the same shape as create-user (including **`athlete_id`**).
- Persist the photo and **write face embedding metadata in GCP** keyed by the returned `athlete_id` (same as in §4).

---

## Summary checklist for backend

| Requirement | Purpose |
|------------|---------|
| **create-user** returns and persists **`athlete_id`** for athletes | Frontend and roster use this id everywhere |
| **GET /api/athletes** returns all athletes (including with photo) | So they show in roster and match embedding data |
| **GET /api/athlete/{id}/details** returns 403 with `profile_complete: false` when no photo | Frontend shows “complete profile” and add-photo step |
| **add-photo / add-photo-upload** persist photo and **write face embeddings in GCP** keyed by `athlete_id` | Users with photos show in face embedding metadata and in roster behavior |
| **GET /api/athlete/{id}/facial-embeddings** uses same `athlete_id` | Consistency with add-photo and GCP |
| **POST /api/login** returns **`athlete_id`** for athletes | Frontend can store it and call details/add-photo correctly |

If you want, the next step can be to add concrete examples (e.g. Python/FastAPI) for add-photo-upload and writing to a specific GCP product (e.g. Firestore collection or BigQuery table).
