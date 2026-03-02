# Listing Firebase Auth Users (Debug)

Use this to see who exists in your Firebase project and **how they can sign in** (email/password vs Google only). Helps debug "400 / INVALID_LOGIN_CREDENTIALS" when an account was created with Google and has no password.

## One-time setup

1. Open [Firebase Console](https://console.firebase.google.com) → your project (**motionlabsai-c2a0b**).
2. Go to **Project settings** (gear) → **Service accounts**.
3. Click **Generate new private key** and download the JSON file.
4. Save it in the project root as **`firebase-service-account.json`** (this file is gitignored; do not commit it).

## Run

```bash
npm install
npm run list-users
```

Or with a key stored elsewhere:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-key.json npm run list-users
```

## Output

For each user you’ll see:

- **Email**, **UID**
- **Providers** (e.g. `password`, `google.com`)
- A line like:
  - **Can sign in with email/password** – use the email/password form.
  - **Google only (no password – use "Sign in with Google")** – use the Google button; the email/password form will always return 400 for this account.

Use this to confirm which accounts are Google-only and which have a password.
