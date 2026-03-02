# Xcode / Capacitor: Requests Not Reaching the Backend

When the app runs in Xcode (Simulator or device) and **no requests appear in your backend logs**, the request is likely never leaving the app. Use this triage in order.

---

## Works on device (HTTPS) but not on Simulator

If the app works on a **physical device** over HTTPS but fails on the **Simulator**, it’s usually a Simulator/WebKit environment issue, not your backend or app logic.

**What to do:**

1. **Use a real device for testing**  
   Rely on device for login/API checks. Simulator is fine for UI; for network and auth, device is more reliable.

2. **Reset the Simulator**  
   **Device → Erase All Content and Settings** (Simulator menu). Then rebuild and run again. Clears WebKit state, keychain, and cache.

3. **Check the Mac’s network**  
   Simulator uses the Mac’s network stack. Try:
   - Disabling VPN or proxy on the Mac.
   - Another network (e.g. phone hotspot) to rule out corporate firewall/DNS.

4. **Restart Simulator and Xcode**  
   Quit Simulator and Xcode, reopen the project, and run again. Sometimes WebKit/Networking services get into a bad state.

5. **Try a different Simulator**  
   Create or pick another simulator (e.g. different iOS version). Some versions have fewer WebKit/network quirks.

6. **Ignore Simulator-only failures**  
   If device works over HTTPS, you can treat “works on device, not on Simulator” as an environment limitation and use the device for real testing.

---

## 1. Confirm whether the login/API request is sent

### Safari Web Inspector

1. On your Mac: **Safari → Develop → [Your Simulator or Device] → MotionLabs AI**
2. Open the **Network** tab.
3. In the app, trigger login (or any action that should call your API).
4. **If no request appears** → the call is not reaching the network (JS/UI issue, auth flow not starting, or blocked before fetch).

### In-app request logging

1. In Web Inspector **Console**, run:
   ```js
   window.__enableNetworkDebug()
   ```
2. Trigger login again. You should see:
   - `[AthleteCoachAPI] fetch START` … when a request is about to be sent
   - `[AthleteCoachAPI] fetch DONE` or `[AthleteCoachAPI] fetch FAILED` … after the call
3. If you never see `fetch START`, the code path that calls the API is not running (e.g. auth flow or navigation blocking it).

### Quick health check (does *any* request leave the app?)

In the **Console** tab run:

```js
await window.__testBackendHealth()
```

- **If it returns `{ ok: true, ... }`** → the app can reach the backend; the problem is likely in the **login/auth flow** (e.g. redirect, OAuth, or the request not being triggered).
- **If it fails (e.g. `ok: false`, or error in console)** → **networking/ATS/URL** is the issue (see steps 2 and 3).

---

## 2. HTTP vs HTTPS (App Transport Security)

iOS blocks **plain `http://`** by default (ATS). If your API URL is `http://...`, either:

- **Use HTTPS** for the API (e.g. Cloud Run URL is already HTTPS), or
- Add an ATS exception in **Info.plist** (dev only):

In **ios/App/App/Info.plist** add inside `<dict>`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

Or, for a single domain:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSExceptionDomains</key>
  <dict>
    <key>your-api.example.com</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
  </dict>
</dict>
```

**Best practice:** Use an HTTPS API URL (e.g. `VITE_ATHLETE_COACH_API_URL=https://...`) and avoid disabling ATS in production.

---

## 3. OAuth / Google Sign-In inside WKWebView

If login **hangs** and you use **Google (or other OAuth)**:

- OAuth inside the main WKWebView can hang (cookies, redirects, storage).
- Prefer **ASWebAuthenticationSession** or Capacitor’s OAuth/Browser flow that uses it.
- Check **redirect URI / URL scheme** and that the OAuth callback returns to the app correctly.

**Sign:** User taps “Sign in”, UI freezes, no backend logs and no request in Network tab → often an auth handoff/redirect issue.

---

## 4. Main-thread deadlock (Capacitor bridge)

If the UI **freezes** but the app doesn’t crash:

1. In **Xcode**, when it’s frozen: **Debug → Debug Workflow → Pause** (or click Pause).
2. Open the **Debug Navigator** and check the **main thread** call stack.
3. If the main thread is stuck in a **sync** call (e.g. JS bridge, plugin, semaphore), that’s likely the cause.

You can also run **Product → Profile → Time Profiler**, tap login, and see if the main thread stays blocked.

---

## 5. Binary-search checks

| Check | What it tells you |
|-------|-------------------|
| **Device vs Simulator** | If it only fails on Simulator → WebKit/config/simulator quirks. |
| **Health vs login** | Run `await window.__testBackendHealth()`. If health works but login doesn’t → auth/flow/UI. If health also fails → networking/ATS/URL. |
| **Clear app state** | Delete the app from Simulator/device and reinstall; retry. |
| **Keyboard** | If the hang happens right after focusing an input, try a button-only test (e.g. hardcoded creds) to rule out keyboard/constraint loops. |

---

## 6. Checklist to report back

If you need to share with someone, provide:

- **Simulator or physical device?**
- **Login method:** email/password to your API, or OAuth (Google/Apple)?
- **Result of `await window.__testBackendHealth()`** (and whether any request appears in Network tab when you run it).
- **API base URL:** `http` or `https`, and domain (e.g. Cloud Run).
- **First ~30 lines of console** after tapping “Sign in” (including any NSError / CFNetwork / CORS / ATS messages).
- **Main thread stack** when paused while “hung” (optional but very helpful).

---

## 7. One-shot debug: pause when it hangs

When the app is stuck:

1. In Xcode: **pause** the debugger.
2. Open the **main thread** in the Debug Navigator and **copy the call stack**.
3. That usually shows exactly where it’s blocked (e.g. bridge, plugin, or main-thread sync wait).
