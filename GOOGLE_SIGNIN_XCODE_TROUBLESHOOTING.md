# Google Sign-In Issues on Xcode / iOS

When **another email** (or a different Google account) tries to sign in and it fails, check the following.

---

## 1. Google Cloud OAuth – “Testing” mode (most common)

If your OAuth consent screen is in **Testing** mode, only **test users** can sign in.

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. **APIs & Services** → **OAuth consent screen**.
3. Under **Test users**, click **+ ADD USERS** and add the Google email(s) that should be able to sign in.
4. Save.

If you want any Google user to sign in, switch the app to **Production** (after completing verification if required).

---

## 2. Firebase Authentication – Authorized domains

The iOS app must be allowed in Firebase.

**Check:**
1. [Firebase Console](https://console.firebase.google.com/) → project **motionlabsai-c2a0b**.
2. **Authentication** → **Settings** (or **Sign-in method** tab) → **Authorized domains**.
3. Ensure you have:
   - `motionlabsai-c2a0b.firebaseapp.com`
   - Your production web domain if you have one
   - For native iOS, Firebase usually allows the app by bundle ID when Google Sign-In is enabled; if you use a custom URL scheme, it may need to be allowed.

**Also:** Under **Sign-in method**, ensure **Google** is **Enabled** and the support email is set.

---

## 3. iOS in-app WebView – Popup behavior

The app uses **Sign in with Popup**. In the iOS WebView (Capacitor), popups can:

- Be blocked or not return correctly to the app.
- Behave differently when switching to Safari and back.

**What to try:**
- Close other apps and try again.
- If you see “Popup was blocked” or the popup closes immediately, the next step is to switch to **Redirect** flow for iOS (see GOOGLE_SIGNIN_SETUP.md – “Mobile Considerations”) or use a native Google Sign-In plugin (e.g. Capacitor Google Auth).

---

## 4. Firestore – No user document for “another email”

After Google sign-in, the app reads a **user** document from Firestore. If that document doesn’t exist (e.g. first time this email signs in), the app may show **profile completion**. If Firestore **rules** block read/write for that user, sign-in can appear to “fail” or get stuck.

**Check:**
1. Firebase Console → **Firestore Database** → **Rules**.
2. Ensure rules allow:
   - **Read** for `users/{userId}` when `request.auth.uid == userId`.
   - **Create/update** for `users/{userId}` when `request.auth.uid == userId` (so profile completion can create the doc).

**Expected behavior:**  
For a **new** Google email, the app should show the **profile completion** screen (role, institution, etc.) and then create the `users/{uid}` document. If that screen doesn’t appear or you get a permission error, the issue is likely Firestore rules or the auth flow not creating the doc.

---

## 5. See the real error (Xcode / Safari Web Inspector)

To know exactly why “another email” fails:

1. Run the app from **Xcode** on a device or simulator.
2. On Mac: **Safari** → **Develop** → **[Your device/simulator]** → **MotionLabs AI** (or the WebView).
3. In the **Console**, reproduce sign-in with the other email and look for:
   - `Google login error:` (or similar) plus the error object.
   - Firebase error **code** (e.g. `auth/operation-not-allowed`, `auth/popup-blocked`) and **message**.

The app is also updated to show the **error code** in the UI when sign-in fails, so you can note it and look it up.

---

## Quick checklist

| Check | Where | Action |
|-------|--------|--------|
| Google OAuth test users | Google Cloud Console → OAuth consent screen | Add the email(s) under Test users, or move app to Production |
| Google provider enabled | Firebase → Authentication → Sign-in method | Enable Google and set support email |
| Authorized domains | Firebase → Authentication → Authorized domains | Ensure your app’s domain / config is listed |
| Firestore rules | Firebase → Firestore → Rules | Allow read/write for `users/{userId}` when `request.auth.uid == userId` |
| Popup / WebView | App behavior on device | Prefer redirect or native Google Auth on iOS if popup keeps failing |

---

## INVALID_LOGIN_CREDENTIALS (400)

If you see `{ error: { code: 400, message: "INVALID_LOGIN_CREDENTIALS" } }`:

**"The user is in Firebase" doesn't fix this.** This error means the **credential never reached your app**. On iOS, after the user signs in with Google in the browser, Google redirects back to the app. If the app has no **URL scheme** (from GoogleService-Info.plist REVERSE_CLIENT_ID), the redirect goes nowhere and you get INVALID_LOGIN_CREDENTIALS even though the user exists in Firebase. Fix by completing the **"Still failing after adding test user? – iOS app config"** steps (GoogleService-Info.plist + URL scheme + iOS OAuth client). Until then, use **email/password** to sign in.

1. **Email/password login** – Wrong email or password. Double-check and try again, or use “Forgot password”.
2. **Google sign-in** – Usually means:
   - **OAuth app in Testing mode** – Add this Google account as a **Test user** in [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen** → **Test users** → **+ ADD USERS**.
   - **Invalid or expired credential** – User cancelled, or the sign-in popup didn’t complete. Try again or use **email/password** instead.
   - **iOS bundle ID mismatch** – In Google Cloud Console, ensure the **iOS client** (OAuth 2.0 Client ID) has the same **Bundle ID** as in Xcode (e.g. `com.yourapp.motionlabs`). Firebase → Project settings → Your apps → iOS app should match.
  - **iOS app not configured** – If you only added a **Web** app in Firebase, the iOS build has no GoogleService-Info.plist and no URL scheme, so Google cannot return the credential to the app. See "Still failing – iOS app config" below.

After adding the user as a test user or fixing the bundle ID, try sign-in again.

---

## Still failing after adding test user? – iOS app config

If test users are added and you still get INVALID_LOGIN_CREDENTIALS on the **iOS app**, the iOS project is usually missing Firebase/Google config.

**1. Add iOS app in Firebase**

- Firebase Console → **motionlabsai-c2a0b** → **Project settings** → **Your apps** → **Add app** → **iOS**.
- Enter the **Bundle ID** from Xcode (App target → General → Bundle Identifier). Download **GoogleService-Info.plist**.
- In Xcode: add **GoogleService-Info.plist** to the App target (drag into the project, check App target).

**2. Add URL scheme so the app can receive the sign-in result**

- Open **GoogleService-Info.plist** in a text editor and copy the value of **REVERSE_CLIENT_ID** (e.g. `com.googleusercontent.apps.123456789-xxxx`).
- In Xcode: open **Info.plist** → add **URL Types** → **Item 0** → **URL Schemes** = that value, **Identifier** = `com.google.signin`.
- Without this, Google cannot redirect back into the app and you get invalid/missing credentials.

**3. Create an iOS OAuth client in Google Cloud**

- Google Cloud Console → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID** → type **iOS**, **Bundle ID** = same as Xcode → Create.

**4. Workaround:** Use **email/password** sign-in on the iOS app until the above is done.

---

## Error codes you might see

- **auth/popup-closed-by-user** – User closed the sign-in window.
- **auth/popup-blocked** – Popup was blocked (common in WebView); consider redirect or native auth for iOS.
- **auth/invalid-credential** – Wrong password (email/password) or Google token invalid/expired.
- **auth/operation-not-allowed** – Google sign-in not enabled in Firebase, or wrong configuration.
- **auth/unauthorized-domain** – App’s origin/domain not in Firebase Authorized domains.
- **Access blocked: This app’s request is invalid** (from Google) – Often means the account is not a test user while the OAuth app is in Testing mode → add as test user in Google Cloud Console.

After fixing config, rebuild in Xcode and try again with the other email.
