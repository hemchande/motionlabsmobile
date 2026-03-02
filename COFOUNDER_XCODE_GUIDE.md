# MotionLabs AI – Run from Zip & Open in Xcode

**For:** Non-technical cofounder  
**You need:** Mac, the project zip, Xcode installed, Node.js installed

---

## Full sequence at a glance

Do these in order. Details for each step are in the sections below.

| # | What to do | Where |
|---|------------|--------|
| 0 | Install **Node.js** and **Xcode** (if not already) | See **Before You Start** |
| 1 | **Unzip** the project folder | Desktop or Documents |
| 2 | Open **Terminal**, go into the project folder (`cd ~/Desktop/MotionLabsAI`) | Terminal |
| 3 | Copy **`.env`** from `.env.example` (or get from founder) | Terminal: `cp .env.example .env` |
| 4 | **Install dependencies** | Terminal: `npm install` |
| 5 | **Build** the web app | Terminal: `npm run build` |
| 6 | **Sync** to iOS | Terminal: `npx cap sync ios` |
| 7 | **Open Xcode** | Terminal: `npm run cap:ios` (or `open ios/App/App.xcworkspace`) |
| 8 | In Xcode: set **Signing & Capabilities** → **Team** (your Apple ID) | Xcode |
| 9 | **Connect your iPhone** with cable; on iPhone tap **Trust** if asked | iPhone + Mac |
| 10 | In Xcode: choose **your iPhone** in the device dropdown, press **Play** (▶) | Xcode |
| 11 | If Mac asks **“codesign wants to access key”** → click **Allow** | Mac dialog |
| 12 | First time on device: on **iPhone** go to **Settings → General → VPN & Device Management** → trust your developer certificate, then open the app again | iPhone |

After step 12 the app should be running on your phone. For **TestFlight / App Store**, see **How to Deploy in Xcode** below.

---

## Before You Start

1. **Install Node.js** (if you don't have it):
   - Go to [https://nodejs.org](https://nodejs.org)
   - Download the **LTS** version and run the installer (next → next).
   - Check: open **Terminal** (Spotlight → type "Terminal"), run:
     ```bash
     node -v
     ```
     You should see something like `v20.x.x` or `v22.x.x`.

2. **Install Xcode** from the Mac App Store. Open it once so it can finish installing components.

---

## Step 1: Unzip the Project

1. Put the zip file somewhere simple (e.g. **Desktop** or **Documents**).
2. **If the file is named something like `MotionLabsAI-Cofounder-xxxx.zip.txt`** (sent that way to get past email security): rename it and remove the `.txt` so it ends with `.zip` (e.g. `MotionLabsAI-Cofounder-20260214.zip`). Then continue.
3. Double-click the zip to unzip it.
4. You should get a folder (e.g. `MotionLabsAI`). Remember where it is.

---

## Step 2: Open Terminal and Go Into the Project

1. Open **Terminal** (Spotlight → "Terminal").
2. Go into the project folder. Replace `MotionLabsAI` with your actual folder name if different, and adjust the path if it's not on Desktop:

   ```bash
   cd ~/Desktop/MotionLabsAI
   ```

   (If the folder is in **Documents**: `cd ~/Documents/MotionLabsAI`)

3. Check you're in the right place (you should see `package.json`):

   ```bash
   ls
   ```

   You should see things like `package.json`, `src`, `ios`, etc.

---

## Step 2.5: Set Up Environment Variables

The app needs a `.env` file for API URLs (and optional keys). **The zip does not include your real `.env`** (for security), so do one of the following:

**Option A – You have `.env.example` in the project**

1. In Terminal (in the project folder), run:
   ```bash
   cp .env.example .env
   ```
2. The default values in `.env.example` point to the shared APIs, so **the app will usually run as-is**. You only need to edit `.env` if the founder asks you to add specific keys (e.g. Stream, Brevo).

**Option B – No `.env.example` or you need the real values**

1. Ask the **founder** to send you either:
   - The contents of **`.env.example`** (variable names and placeholder/default values), or  
   - A **list of variable names** and where to get the values.
2. Create a file named **`.env`** in the project root (same folder as `package.json`) and paste in the variables. Example format:
   ```bash
   VITE_ATHLETE_COACH_API_URL=https://...
   VITE_LIVE_CAMERA_WS_URL=ws://...
   ```
3. Do **not** commit `.env` or share it; it can contain secrets.

After this, continue with Step 3.

---

## Step 3: Install Dependencies

In the same Terminal window, run:

```bash
npm install
```

Wait until it finishes (no red errors). This can take a couple of minutes.

---

## Step 4: Build the Web App

```bash
npm run build
```

Wait until it says something like "built in …" or "build complete" with no errors.

---

## Step 5: Sync the App to the iOS Project

```bash
npx cap sync ios
```

Again, wait until it finishes without errors.

---

## Step 6: Open the Project in Xcode

Either run:

```bash
npm run cap:ios
```

or open the workspace manually:

```bash
open ios/App/App.xcworkspace
```

Xcode should open with the project.  
**Important:** use **App.xcworkspace** (white icon), not **App.xcodeproj**.

---

## Step 7: In Xcode – Set Up Signing (Required for Device / App Store)

1. In the **left sidebar**, click the **blue project icon** at the top (e.g. "App").
2. Under **TARGETS**, select **App**.
3. Open the **Signing & Capabilities** tab.
4. Check **"Automatically manage signing"**.
5. In **Team**, choose your **Apple ID** (or your Apple Developer team).
   - If you don't see a team: **Xcode → Settings → Accounts** → add your Apple ID, then pick it as Team again.

---

## Step 8: Run the App (Simulator or Device)

1. At the **top of Xcode**, use the device dropdown:
   - **iPhone 15** (or any simulator) = run on your Mac.
   - **Your iPhone** (when connected) = run on your phone.
2. Press the **Play** button (or **⌘R**).

The app should build and launch.

---

## How to Deploy in Xcode

### Deploy to your iPhone (run on device)

1. Connect your iPhone with a cable (or use same Wi‑Fi if you have that set up).
2. On the iPhone: if prompted, tap **Trust** this computer.
3. In Xcode’s **device dropdown** (top left), choose **your iPhone** (not a simulator).
4. Press **Play** (▶) or **⌘R**.  
   Xcode builds, installs the app on the phone, and launches it.  
   First time: you may need to trust your developer certificate on the iPhone (see **Troubleshoot: device connection & trust** below).

### Deploy to TestFlight / App Store (distribution)

**Where to find it in Xcode:**

- **Device dropdown** — Top-left of the Xcode window, next to the Play button. Click it; at the bottom of the list choose **Any iOS Device (arm64)**.
- **Product → Archive** — Menu bar at top of screen: **Product** → **Archive**.
- **Organizer** — Opens when Archive finishes (or **Window → Organizer**). Left side: **Archives** tab; click the latest archive.
- **Distribute App** — In Organizer, with an archive selected: **Distribute App** button on the right.
- **Signing & Capabilities** — Left sidebar → blue **App** project icon → under TARGETS select **App** → **Signing & Capabilities** is a tab at the top (next to General).

**Steps:**

1. Device dropdown (top left) → **Any iOS Device (arm64)**.
2. Menu: **Product → Archive**. Wait for the archive to finish.
3. When the **Organizer** window appears, select the new archive and click **Distribute App**.
4. Choose:
   - **App Store Connect** → Next → **Upload** → Next.
   - Leave options as default (or as your team prefers) → Next → Upload.
5. When the upload succeeds, go to [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight** (for testers) or submit for **App Review** (for the store).

**Before archiving:** ensure **Signing & Capabilities** has the correct **Team** and a valid **Provisioning Profile** (Xcode can create one with “Automatically manage signing”). For App Store distribution you need an **Apple Developer Program** account ($99/year).

---

## Troubleshoot: device connection & trust

If the iPhone doesn’t show in the device dropdown or the app won’t run on the device:

### 1. Cable and “Trust”

- Use a **data-capable USB cable** (some cables are charge-only).
- Plug the iPhone into your Mac. On the iPhone, if you see **“Trust This Computer?”** → tap **Trust** and enter your passcode.
- In Xcode’s device dropdown (top left), wait a few seconds; your iPhone should appear by name. If it says “Preparing…” or “Processing”, wait until it finishes.

### 2. Trust the developer certificate (first run on device)

After Xcode installs the app, the first launch may be blocked until you trust your Apple ID:

1. On the **iPhone**, open **Settings**.
2. Go to **General** → **VPN & Device Management** (or **Device Management** on older iOS).
3. Under **“Developer App”**, you’ll see your **Apple ID** or team name. Tap it.
4. Tap **“Trust [your Apple ID]”** → confirm **Trust** in the popup.
5. Go back to the home screen and open **MotionLabs AI** again; it should launch.

If you don’t see **VPN & Device Management**, make sure the app was actually installed. If the app opens then immediately closes, that’s usually the “untrusted developer” block — do the steps above.

### 3. Xcode still doesn’t see the device

- **Unlock the iPhone** and leave it on the home screen.
- Try another **USB port** (directly on the Mac if possible).
- **Restart the iPhone** and the Mac, then reconnect and tap Trust.

### 4. “Could not launch” / provisioning errors

- In Xcode: **App** target → **Signing & Capabilities** → set **Team** to your Apple ID and leave **Automatically manage signing** on.

---

## Quick Command Summary (Copy-Paste)

From the project folder in Terminal:

```bash
cd ~/Desktop/MotionLabsAI
npm install
npm run build
npx cap sync ios
npm run cap:ios
```

Then in Xcode: set **Signing & Capabilities** → choose **Team** → press **Play**.

---

## If Something Goes Wrong

- **"command not found: npm"**  
  Node.js isn't installed or isn't in your PATH. Reinstall Node.js from nodejs.org and restart Terminal.

- **"No such file or directory"**  
  You're not in the project folder. Use `cd` to the folder you unzipped (e.g. `cd ~/Desktop/MotionLabsAI`) and run the commands again.

- **"codesign wants to access key 'development'" (or keychain prompt)**  
  This is normal. macOS is asking to use your developer certificate so Xcode can sign the app. Click **Allow** (or **Always Allow** so you aren’t asked every time). If you deny it, the build may fail with a signing error.  
  **You don’t get a “key code” from anywhere.** The development key is created automatically when you add your **Apple ID** in **Xcode → Settings → Accounts** and set **Team** in **Signing & Capabilities**. The key lives in your Mac’s Keychain; the dialog is just asking for permission to use it.

- **Xcode "Signing" or "Team" errors**  
  Add your Apple ID in **Xcode → Settings → Accounts** and select it as **Team** under **Signing & Capabilities**.

- **Build errors in Xcode**  
  In Terminal, run again from the project folder:
  ```bash
  npm run build
  npx cap sync ios
  ```
  Then in Xcode try **Product → Clean Build Folder**, then **Run** again.

- **Black screen on iPhone (app opens but screen stays black)**  
  Usually the app is running but the web content didn’t load or a script failed. Do these in order:
  1. **Re-run the build and sync**, then run from Xcode again (steps 5–6–10 in the [Full sequence](#full-sequence-at-a-glance)):
     ```bash
     cd ~/Desktop/MotionLabsAI
     npm run build
     npx cap sync ios
     ```
     In Xcode: **Product → Clean Build Folder**, then choose your iPhone and press **Play**.
  2. **Check that `.env` exists** in the project folder (step 3). Without it, the app may crash before showing anything. Run `cp .env.example .env` if needed.
  3. **Wait a few seconds** after launch — the first load can be slow; you might see a splash then the app.
  4. If it’s still black, the next step is to **inspect errors**: connect the iPhone to the Mac, open **Safari → Develop → [Your iPhone] → MotionLabs AI**, and check the **Console** for red errors. Share those with the founder for debugging.

---

## Common Xcode Console Messages (Safe to Ignore)

When you run the app from Xcode, the **console** (bottom panel) may show messages like these. **They are normal and do not mean the app is broken.** As long as the app opens and you see the MotionLabs AI screen, you can ignore them.

| Message | What it means |
|--------|----------------|
| `UIScene lifecycle will soon be required...` | Apple’s future requirement warning. App still runs. |
| `Failed to resolve host network app id to config: bundleID: com.apple.WebKit.Networking` | WebKit/simulator message. Harmless. |
| `Loading app at capacitor://localhost...` | **Normal.** Capacitor is loading your app. |
| `Failed to send CA Event for app launch measurements...` (e.g. `com.apple.app_launch_measurement.ExtendedLaunchMetrics`) | Apple’s internal launch analytics. Cannot be fixed from the app; safe to ignore. |
| `GPU process took X seconds to launch` | Simulator/device startup. Normal. |
| `WebContent... Unable to hide query parameters from script` | WebKit internal. Usually safe to ignore. |
| `RTIInputSystemClient... Can only set suggestions for an active session` | Keyboard/input system. Common in simulator. |
| `Potential Structural Swift Concurrency Issue: unsafeForcedSync called from Swift Concurrent context` | Comes from Capacitor/native bridging. Known warning; safe to ignore. |

**When to worry:** If the app **crashes**, **stays white/blank**, or **doesn’t respond**, that’s a real problem. Red errors in Xcode that say **Build Failed** or **Compile error** also need to be fixed. The messages above are not those.

---

**Send this guide** together with the zip so your cofounder has the steps in one place.

---

### For the founder (you)

- **Include `.env.example` in the zip** when you create it, so the cofounder can run `cp .env.example .env` and use the default API URLs. When zipping, exclude only the real env files, not `.env.example`, for example:
  ```bash
  zip -r MotionLabsAI-Cofounder-$(date +%Y%m%d).zip MotionLabsAI \
    -x "MotionLabsAI/node_modules/*" -x "MotionLabsAI/.git/*" \
    -x "MotionLabsAI/build/*" -x "MotionLabsAI/dist/*" \
    -x "MotionLabsAI/.env" -x "MotionLabsAI/.env.local" -x "MotionLabsAI/.env.*.local" \
    -x "*__pycache__*" -x "*.DS_Store"
  ```
  (Using `-x "MotionLabsAI/.env"` and `.env.local` instead of `.env*` keeps `.env.example` in the zip.)
- **Do not put the real `.env` in the zip**; it may contain secrets. If the cofounder needs a specific key (e.g. Brevo, Stream), send that value in a secure way and they can add it to their local `.env`.
- If the zip was already made **without** `.env.example`, send that file in a separate message or paste the variable list from it into this guide.
