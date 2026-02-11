# Alert Dashboard: athlete_id and User Context

## Current athlete_id Sources (priority order)

1. **`propAthleteId`** – Passed to `<AlertDashboard athleteId="..." />`
2. **`contextAthleteId`** – From `useUser().athleteId` (UserContext)
3. **`defaultAthleteId`** – Default `'athlete_001'` when nothing else is set

## UserContext / athlete_id Mapping

The `UserContext` (`useUser()`) provides `athleteId`, which comes from:

- **Firestore** `users/{firebaseUid}` → `athleteId` or `athlete_id`
- **MCP server** (create_user, login) → `user.athlete_id`
- **localStorage** `mcpUser` (fallback)

So `athleteId` is the app’s identifier for the athlete, not the Firebase UID. It’s usually set at signup or via the MCP server.

## Future: Firebase UID → athlete_id

To map Firebase UID directly to `athlete_id`:

1. **Firestore** – Store a mapping like `users/{firebaseUid}.athlete_id` when creating the user.
2. **API** – Add an endpoint such as `GET /api/user/{firebase_uid}/athlete_id` that returns the mapped `athlete_id`.
3. **UserContext** – In `loadUserFromFirestore`, read `athlete_id` from the user doc and expose it as `athleteId`.

Example Firestore structure:

```json
{
  "users": {
    "firebase-uid-abc123": {
      "email": "coach@example.com",
      "role": "coach",
      "athleteId": null
    },
    "firebase-uid-xyz789": {
      "email": "athlete@example.com",
      "role": "athlete",
      "athleteId": "athlete_004"
    }
  }
}
```

For coaches, `athleteId` may be `null`; they can then pick athletes from a roster. For athletes, `athleteId` should match the backend `athlete_id`.

## Components Using athleteId

| Component         | Source                                      |
|-------------------|---------------------------------------------|
| AlertDashboard    | `propAthleteId` → `contextAthleteId` → `'athlete_001'` |
| MobileAlertsList  | `useUser().athleteId` or falls back to `getAllAlerts()` |
