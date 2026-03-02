# Xcode Setup Guide - MotionLabs AI

## Complete Step-by-Step Walkthrough for iOS Deployment

---

## Prerequisites

Before starting, ensure you have:

✅ **Mac computer** (macOS 12.0 or later)
✅ **Xcode installed** (14.0 or later)
  - Download from Mac App Store (free)
  - ~15GB download, ~40GB installed
✅ **Apple Developer Account** (optional for testing, required for App Store)
  - Free account: Test on your own devices only
  - Paid account ($99/year): Distribute to App Store

---

## Step 1: Open the Project

### Option A: Using NPM Script (Recommended)

```bash
cd /Users/eishahemchand/MotionLabsAI
npm run cap:ios
```

This will:
1. Build your web app (`npm run build`)
2. Sync assets to iOS (`npx cap sync`)
3. Automatically open Xcode

### Option B: Manual Open

```bash
open ios/App/App.xcworkspace
```

⚠️ **CRITICAL:** Always open the `.xcworkspace` file, NOT `.xcodeproj`!

**Why?**
- `.xcworkspace` includes CocoaPods dependencies (required by Capacitor)
- `.xcodeproj` alone will fail to build

---

## Step 2: First-Time Xcode Setup

### When Xcode Opens (First Time):

**You'll see:**
- Left sidebar: Project navigator with folder structure
- Center: Welcome screen or editor
- Right sidebar: Inspector panels

### Initial Setup Tasks:

#### 1. Trust the Project
If prompted:
```
"App.xcworkspace" is from an Internet download. Are you sure you want to open it?
```
- Click **"Open"**

#### 2. Index Project (Automatic)
Xcode will index the project (top bar shows progress):
```
Indexing... (may take 2-5 minutes first time)
```
**Wait for this to complete before proceeding.**

#### 3. Install Rosetta (Apple Silicon Macs)
If you have an M1/M2/M3 Mac and see:
```
"App" requires Rosetta to run. Install Rosetta?
```
- Click **"Install"**
- Enter your password
- This is one-time only

---

## Step 3: Project Configuration

### Select the Project

**In left sidebar (Project Navigator):**
1. Click the **blue "App" icon** at the very top
2. You'll see two items under TARGETS:
   - **App** (your app)
   - **App Clip** (ignore for now)
3. Click **"App"** under TARGETS

**You should now see tabs at the top:**
- General | Signing & Capabilities | Resource Tags | Info | Build Settings | Build Phases | Build Rules

---

## Step 4: General Settings

### Click "General" Tab

**Identity Section:**

```
Display Name: MotionLabs AI
Bundle Identifier: com.motionlabsai.app
Version: 1.0.0
Build: 1
```

**What each means:**
- **Display Name:** Name shown on home screen (can have spaces)
- **Bundle Identifier:** Unique ID (reverse domain notation, no spaces)
- **Version:** User-facing version (1.0.0, 1.1.0, etc.)
- **Build:** Internal build number (1, 2, 3, etc.)

**Deployment Info:**

```
iOS Version: 13.0 (or higher)
iPhone Orientation: ✓ Portrait
iPad Orientation: ✓ Portrait, ✓ Landscape Left, ✓ Landscape Right
Status Bar Style: Default
```

**Recommended:**
- Keep iOS 13.0 minimum (supports older devices)
- Enable all orientations for iPad
- Portrait only for iPhone (sports/training use case)

---

## Step 5: Signing & Capabilities

### Click "Signing & Capabilities" Tab

This is **THE MOST IMPORTANT** step for iOS deployment!

### Scenario A: Free Apple Developer Account (Testing Only)

**What you get:**
- ✅ Test on your own iPhone/iPad
- ❌ Cannot distribute to App Store
- ❌ Cannot share with other users

**Setup:**

1. **Check "Automatically manage signing"** ✓

2. **Team:** Select your Apple ID
   - If you don't see it, click "Add an Account..."
   - Sign in with your Apple ID (free)
   - Wait for it to appear in dropdown

3. **Bundle Identifier:**
   - Must be globally unique
   - Change to: `com.yourname.motionlabsai` (use your actual name)
   - Example: `com.johndoe.motionlabsai`

4. **Provisioning Profile:**
   - Will show: "Xcode Managed Profile"
   - Status: "Ready to run on iPhone"

**Limitations:**
- Apps expire after 7 days
- Must reinstall weekly
- Cannot submit to App Store

---

### Scenario B: Paid Apple Developer Account ($99/year)

**What you get:**
- ✅ Test on any device
- ✅ Distribute to App Store
- ✅ TestFlight beta testing
- ✅ Push notifications, etc.

**Setup:**

1. **Join Apple Developer Program first:**
   - Go to: https://developer.apple.com/programs/
   - Click "Enroll"
   - Pay $99/year
   - Wait for approval (usually 24-48 hours)

2. **In Xcode:**
   - Check "Automatically manage signing" ✓
   - **Team:** Select your paid developer team name
   - **Bundle Identifier:** Use `com.motionlabsai.app` (as configured)

3. **Provisioning Profile:**
   - Will show: "iOS Team Provisioning Profile"
   - Status should be: ✓ (green checkmark)

4. **If you see errors:**
   - "Failed to register bundle identifier"
     - Bundle ID already taken
     - Change to: `com.yourcompany.motionlabsai`
   - "No profiles for 'com.motionlabsai.app'"
     - Sign out and back into Xcode
     - Xcode → Settings → Accounts → Sign In

---

## Step 6: Check Capabilities

Still in **"Signing & Capabilities"** tab:

### Required Capabilities (Already Configured):

**Background Modes:**
- May be auto-added by Capacitor
- Not required for basic functionality

**App Groups:**
- May be auto-added
- Safe to leave as-is

### Add Capabilities (If Needed):

Click **"+ Capability"** to add:

**For Push Notifications:**
- Search: "Push Notifications"
- Click to add

**For Background Audio:**
- Add "Background Modes"
- Check "Audio, AirPlay, and Picture in Picture"

**Most apps don't need additional capabilities initially.**

---

## Step 7: Info.plist Permissions

### Click "Info" Tab

You should see a list of properties. Look for:

**Required Permissions (Already Added):**

```
Privacy - Camera Usage Description
  Value: "MotionLabs AI needs camera access for live pose estimation and training analysis."

Privacy - Photo Library Usage Description
  Value: "MotionLabs AI needs access to your photo library to upload training videos and athlete photos."

Privacy - Microphone Usage Description
  Value: "MotionLabs AI needs microphone access for recording training sessions with audio."
```

**These are shown to users when your app requests permissions.**

**To verify:**
1. Scroll through the list
2. Look for keys starting with "Privacy -"
3. Ensure descriptions are clear and user-friendly

**If missing any:**
1. Click **+** at bottom of list
2. Start typing "Camera" (it will autocomplete)
3. Select "Privacy - Camera Usage Description"
4. Enter your description

---

## Step 8: Build Settings (Advanced)

### Click "Build Settings" Tab

**Usually you don't need to change anything here**, but here are key settings:

**To filter settings:**
- Search bar at top right: Type to find specific settings
- Common searches: "Swift", "Architectures", "Deployment"

**Key Settings (Verify):**

**Architectures:**
```
Build Active Architecture Only: Debug = Yes, Release = No
Architectures: Standard (arm64)
```

**Deployment:**
```
iOS Deployment Target: 13.0 (or whatever you chose)
```

**Swift Compiler:**
```
Swift Language Version: Swift 5 (should be automatic)
```

**Code Signing:**
```
Code Signing Identity: Apple Development (or Apple Distribution for App Store)
Code Signing Style: Automatic
```

**99% of the time, default settings work perfectly!**

---

## Step 9: Select a Device/Simulator

### Device Dropdown (Top Left, Next to Play Button)

**You'll see something like:**
```
App > iPhone 15 Pro
```

**Click the dropdown to see options:**

### For Testing on Simulator (No Device Needed):

**Available simulators:**
- iPhone 15 Pro
- iPhone 15
- iPhone 14 Pro
- iPad Pro 12.9"
- etc.

**Choose one based on what you want to test.**

**To add more simulators:**
1. Dropdown → "Add Additional Simulators..."
2. Click **+** 
3. Choose device type and iOS version
4. Click "Create"

### For Testing on Real Device:

**Connect your iPhone/iPad via USB cable**

**First time setup:**
1. Unlock your device
2. Trust this computer: Tap "Trust" on device screen
3. Wait for device to appear in Xcode dropdown (may take 30 seconds)
4. Select your device: `App > Your iPhone Name`

**On device (Settings):**
1. Go to: Settings → General → VPN & Device Management
2. Find your developer profile
3. Tap "Trust [Your Name]"

**This is required for the app to launch on your device.**

---

## Step 10: Build and Run (First Test)

### Click the Play Button ▶️ (or press Cmd+R)

**What happens:**

**Building (2-5 minutes first time):**
```
Build: Compiling Swift code
Build: Linking frameworks
Build: Processing Info.plist
Build: Signing App
Build: Installing to device/simulator
```

Progress shown in top status bar.

**If build succeeds:**
- Simulator launches (if using simulator)
- App installs and opens automatically
- You should see your MotionLabs AI app!

**Test basic functionality:**
- Login screen appears
- Can navigate around
- UI looks correct

**Expected behavior:**
- ✅ App loads
- ✅ UI displays correctly
- ⚠️ Camera won't work on simulator (requires real device)
- ⚠️ Some network calls might fail (check environment variables)

---

## Step 11: Test on Real Device

### Connect iPhone/iPad

1. **Connect via USB cable**
2. **Select device** from dropdown: `App > Your iPhone`
3. **Click Play** ▶️
4. **Wait for installation** (1-2 minutes)
5. **App launches on your device!**

### On Device - First Launch:

**You might see:**
```
"Untrusted Developer"
The developer of this app needs to be trusted...
```

**To fix:**
1. On iPhone: Settings → General → VPN & Device Management
2. Find your Apple ID developer profile
3. Tap it
4. Tap "Trust [Your Name]"
5. Tap "Trust" again to confirm
6. Go back to home screen
7. Open MotionLabs AI app

**Now test everything:**
- ✅ Login with your account
- ✅ Test camera (should work now!)
- ✅ Try live camera feed
- ✅ Test all features
- ✅ Check navigation
- ✅ Test on both Wi-Fi and cellular

---

## Step 12: View Console Logs (Debugging)

### Open Debug Console

**Menu:** View → Debug Area → Show Debug Area

Or press: **Cmd+Shift+Y**

**You'll see:**
- Console output (print statements, errors)
- Variables (when debugging)
- Memory/CPU usage

**Useful for:**
- Seeing console.log() from your JavaScript
- Viewing network errors
- Debugging crashes

**To clear console:**
- Click trash icon in bottom right of console area

---

## Step 13: Fix Common Build Errors

### Error: "Command PhaseScriptExecution failed"

**Cause:** Node modules or build script issue

**Fix:**
```bash
cd /Users/eishahemchand/MotionLabsAI
npm install
npm run build
npx cap sync
```
Then rebuild in Xcode.

---

### Error: "No such module 'Capacitor'"

**Cause:** CocoaPods not installed

**Fix:**
```bash
cd ios/App
pod install
```
Then reopen workspace in Xcode.

---

### Error: "Signing certificate not found"

**Cause:** Not signed into Xcode

**Fix:**
1. Xcode → Settings (Cmd+,)
2. Accounts tab
3. Click **+** → "Add Apple ID"
4. Sign in
5. Go back to Signing & Capabilities
6. Select your team

---

### Error: "Failed to register bundle identifier"

**Cause:** Bundle ID already taken or conflicts

**Fix:**
1. Signing & Capabilities tab
2. Change Bundle Identifier to something unique:
   - `com.yourname.motionlabsai`
3. Update in `capacitor.config.ts` too:
   ```typescript
   appId: 'com.yourname.motionlabsai',
   ```
4. Run: `npx cap sync`

---

### Warning: "Runner.app may slow down..."

**Cause:** First time running on this device

**Action:** Click "Trust" - this is normal and one-time

---

### Error: "Could not locate device support files"

**Cause:** iOS version on device is newer than Xcode supports

**Fix:**
- Update Xcode to latest version (Mac App Store)
- Or update iOS on device to match Xcode

---

## Step 14: Prepare for App Store (Archive)

### Prerequisites:
- ✅ Paid Apple Developer account
- ✅ App fully tested on real device
- ✅ All features working
- ✅ Version and build numbers set

### Create Archive:

1. **Select "Any iOS Device (arm64)" from device dropdown**
   - Not a simulator
   - Not a specific device
   - Choose: "Any iOS Device (arm64)"

2. **Menu: Product → Archive**
   - Or press: Cmd+Shift+B (after selecting device)

3. **Wait for build** (5-15 minutes)
   - Status bar shows progress
   - Coffee break! ☕

4. **Organizer window opens**
   - Shows your archive
   - Lists: Version, Build, Date, Size

---

## Step 15: Distribute to App Store Connect

### In Organizer Window:

1. **Select your archive** (most recent at top)

2. **Click "Distribute App"** (blue button, right side)

3. **Select destination:**
   - Choose: **"App Store Connect"**
   - Click "Next"

4. **Select distribution method:**
   - Choose: **"Upload"**
   - Click "Next"

5. **Distribution options:**
   - ✅ Upload your app's symbols (recommended)
   - ✅ Manage Version and Build Number
   - Click "Next"

6. **Automatically manage signing:**
   - Keep checked ✓
   - Click "Next"

7. **Review app:**
   - Check: Name, Version, Bundle ID
   - Click "Upload"

8. **Wait for upload** (5-30 minutes depending on internet)
   - Progress bar shows upload status
   - Don't close Xcode!

9. **Success!**
   ```
   "Upload Successful
   Your app has been uploaded to App Store Connect."
   ```
   - Click "Done"

---

## Step 16: What Happens Next?

### App Store Connect Processing:

1. **Go to:** https://appstoreconnect.apple.com/

2. **My Apps → MotionLabs AI**

3. **You'll see:**
   ```
   Build: Processing
   This build is being processed. When processing completes, 
   it will be available to submit for App Review.
   ```

4. **Wait 10-60 minutes**
   - Apple processes your binary
   - Checks for malware, compliance
   - Generates download size estimates

5. **Email notification:**
   ```
   Subject: Your build has been processed
   Your build 1.0.0 (1) for MotionLabs AI has finished processing.
   ```

6. **Now you can:**
   - Complete store listing
   - Add screenshots
   - Submit for App Review

**Continue with store listing (see MOBILE_APP_STORE_DEPLOYMENT.md)**

---

## Xcode Tips & Tricks

### Keyboard Shortcuts:

```
Cmd+R           Build and Run
Cmd+.           Stop Running App
Cmd+B           Build Only
Cmd+Shift+K     Clean Build Folder
Cmd+Shift+Y     Toggle Debug Console
Cmd+0           Toggle Left Sidebar
Cmd+1-9         Switch Sidebar Tabs
Cmd+/           Comment/Uncomment Code
Cmd+Shift+O     Open Quickly (find files)
Cmd+,           Xcode Settings
```

### Clean Build:

If things seem broken:

1. **Menu: Product → Clean Build Folder**
2. Or press: **Cmd+Shift+K**
3. Then rebuild: **Cmd+R**

### Reset Simulators:

If simulator is acting weird:

1. Close simulator
2. Menu: Device → Erase All Content and Settings
3. Restart simulator

### View Logs:

**Device Console:**
- Window → Devices and Simulators
- Select your device
- Click "Open Console"
- See all system logs

---

## Environment Variables in Xcode

### Your `.env` file is NOT automatically used in Xcode builds!

**To verify environment variables:**

1. Open: `ios/App/App/public/assets/index-[hash].js`
2. Search for: `VITE_ATHLETE_COACH_API_URL`
3. Should see your API URL embedded

**If API URL is wrong:**

```bash
# Update .env file
echo 'VITE_ATHLETE_COACH_API_URL=https://athlete-coach-fastapi-630016859450.europe-west1.run.app' >> .env

# Rebuild web app
npm run build

# Sync to iOS
npx cap sync

# Rebuild in Xcode
```

---

## Simulator vs Real Device

### What Works on Simulator:

- ✅ UI testing
- ✅ Navigation
- ✅ Most API calls
- ✅ Firebase Auth (Google Sign-In)
- ✅ General functionality

### What DOESN'T Work on Simulator:

- ❌ Camera (getUserMedia)
- ❌ Motion sensors (accelerometer, gyroscope)
- ❌ Push notifications
- ❌ Face ID / Touch ID
- ❌ Some native features

**For MotionLabs AI, you NEED a real device** to test camera features!

---

## File Structure in Xcode

### Understanding the Project:

```
App (blue icon) - Project root
├── App (folder icon) - Your app files
│   ├── App/
│   │   ├── AppDelegate.swift       ← App lifecycle
│   │   ├── Info.plist              ← Permissions (configured)
│   │   └── public/                 ← Your web app files
│   │       ├── index.html
│   │       └── assets/
│   │           └── index-[hash].js ← Your compiled React app
│   ├── Pods/                       ← Dependencies (don't modify)
│   └── App.xcodeproj
└── Podfile                         ← Dependency config
```

**You rarely need to edit anything here!**

Everything is handled by Capacitor and your web build.

---

## Updating App After Changes

### Workflow:

1. **Make changes to your React app**
   ```bash
   # Edit src/components/YourComponent.tsx
   ```

2. **Build web app**
   ```bash
   npm run build
   ```

3. **Sync to iOS**
   ```bash
   npx cap sync
   ```

4. **Rebuild in Xcode**
   - Press Cmd+R

**Or use the combined script:**
```bash
npm run cap:ios
```
This does all steps automatically!

---

## Troubleshooting Checklist

### Build Fails:

- [ ] Opened `.xcworkspace` (not `.xcodeproj`)?
- [ ] Xcode finished indexing?
- [ ] Internet connection working?
- [ ] Ran `npm run build` recently?
- [ ] Ran `npx cap sync` after build?
- [ ] Tried cleaning: Cmd+Shift+K?

### Signing Issues:

- [ ] Signed into Xcode with Apple ID?
- [ ] Selected correct team in Signing & Capabilities?
- [ ] Bundle ID is unique and valid?
- [ ] "Automatically manage signing" checked?

### Device Issues:

- [ ] Device connected via USB?
- [ ] Device unlocked?
- [ ] Trusted this computer on device?
- [ ] Trusted developer profile on device (Settings)?
- [ ] Device selected in Xcode dropdown?

---

## Next Steps

### After Successfully Building in Xcode:

1. ✅ **Test thoroughly on real device**
   - Test all features
   - Check camera functionality
   - Verify API calls work
   - Test login/logout
   - Try different scenarios

2. ✅ **Create archive for App Store**
   - Follow Step 14-15 above
   - Upload to App Store Connect

3. ✅ **Complete store listing**
   - See: `MOBILE_APP_STORE_DEPLOYMENT.md`
   - Add screenshots
   - Write description
   - Set pricing

4. ✅ **Submit for review**
   - Final step before going live!
   - Usually approved in 1-3 days

---

## Quick Reference

### Essential Commands:

```bash
# Open project in Xcode
npm run cap:ios

# Rebuild and sync
npm run cap:sync

# Just sync (no rebuild)
npx cap sync

# Update after changes
npm run cap:update
```

### Essential Xcode Shortcuts:

```
Cmd+R           Run
Cmd+.           Stop
Cmd+B           Build
Cmd+Shift+K     Clean
Cmd+Shift+Y     Console
```

### Essential Files:

```
ios/App/App.xcworkspace          ← Open this
ios/App/App/Info.plist           ← Permissions
capacitor.config.ts              ← App config
```

---

## Getting Help

### Resources:

- **Capacitor Docs:** https://capacitorjs.com/docs/ios
- **Apple Developer:** https://developer.apple.com/documentation/
- **Xcode Help:** Help → Xcode Help (in Xcode)

### Common Issues:

- Search: "Xcode [your error message]"
- Stack Overflow: Tag with `xcode`, `ios`, `capacitor`
- Check: `MOBILE_APP_STORE_DEPLOYMENT.md` troubleshooting section

---

## Summary

### You've Learned:

✅ How to open the iOS project in Xcode
✅ How to configure signing and capabilities
✅ How to test on simulators and real devices
✅ How to build and debug your app
✅ How to create an archive for App Store
✅ How to upload to App Store Connect

### Your iOS App Is Ready! 🎉

Follow this guide whenever you need to work with the iOS project in Xcode.

For complete App Store submission, see: **MOBILE_APP_STORE_DEPLOYMENT.md**

---

**Questions?** Refer back to this guide or check the comprehensive deployment documentation!
