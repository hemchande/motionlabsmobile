# Mobile App Store Deployment Guide

## ✅ Setup Complete!

Your MotionLabs AI app is now ready for mobile deployment to:
- 🍎 **Apple App Store** (iOS)
- 🤖 **Google Play Store** (Android)

---

## Project Configuration

**App ID:** `com.motionlabsai.app`
**App Name:** MotionLabs AI
**Bundle Version:** 0.1.0

**Platforms Configured:**
- ✅ iOS (Xcode project in `ios/`)
- ✅ Android (Android Studio project in `android/`)
- ✅ Permissions configured (Camera, Storage, Microphone)
- ✅ Web assets built and synced

---

## Prerequisites

### For iOS Deployment (Mac Required)
- ✅ **Mac computer** (macOS 12.0 or later)
- ✅ **Xcode 14+** (free from Mac App Store)
- ✅ **Apple Developer Account** ($99/year)
  - https://developer.apple.com/programs/
- ✅ **iPhone/iPad** for testing (optional but recommended)

### For Android Deployment (Any OS)
- ✅ **Android Studio** (free)
  - https://developer.android.com/studio
- ✅ **Google Play Console Account** ($25 one-time fee)
  - https://play.google.com/console
- ✅ **Android device** for testing (optional)

---

## Quick Start Commands

```bash
# Build and sync web assets to native platforms
npm run cap:sync

# Open iOS project in Xcode
npm run cap:ios

# Open Android project in Android Studio
npm run cap:android

# Update native platforms after code changes
npm run cap:update
```

---

## iOS App Store Deployment

### Step 1: Open Project in Xcode

```bash
npm run cap:ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

⚠️ **Important:** Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

---

### Step 2: Configure Signing

1. **Select project** in Xcode left sidebar (blue "App" icon)
2. **Select "App" target** (under TARGETS)
3. **Go to "Signing & Capabilities" tab**
4. **Check "Automatically manage signing"**
5. **Select your Apple Developer team** from dropdown
6. **Bundle Identifier:** Should auto-fill as `com.motionlabsai.app`

**If you see errors:**
- Make sure you're signed into Xcode with your Apple ID (Xcode → Settings → Accounts)
- Your Apple ID must be part of a paid Apple Developer Program

---

### Step 3: Update Version and Build Number

1. **Select "App" target**
2. **Go to "General" tab**
3. **Identity section:**
   - **Version:** `1.0.0` (for first release)
   - **Build:** `1` (increment for each submission)

---

### Step 4: Test on Simulator

1. **Select simulator** from device dropdown (e.g., "iPhone 15 Pro")
2. **Click Play button** (▶️) or press Cmd+R
3. **Test the app** - make sure everything works!

**Common issues:**
- Camera won't work on simulator (normal - requires real device)
- Firebase might need configuration updates

---

### Step 5: Test on Real Device (Recommended)

1. **Connect iPhone/iPad** via USB
2. **Select your device** from device dropdown
3. **Click Play** (▶️)
4. **On device:** Trust your Mac (if prompted)
5. **On device:** Settings → General → Device Management → Trust your developer profile
6. **Test camera, login, all features!**

---

### Step 6: Create Archive for App Store

1. **Select "Any iOS Device (arm64)" from device dropdown**
2. **Menu: Product → Archive**
3. **Wait for build** (may take 5-10 minutes)
4. **Organizer window** will open when complete

---

### Step 7: Distribute to App Store

1. **In Organizer, select your archive**
2. **Click "Distribute App"**
3. **Select "App Store Connect"**
4. **Select "Upload"**
5. **Follow prompts:**
   - Automatic signing: ✅ Yes
   - Include bitcode: ❌ No (deprecated)
   - Upload symbols: ✅ Yes
6. **Click "Upload"**
7. **Wait for processing** (10-30 minutes)

---

### Step 8: Complete App Store Connect Listing

1. **Go to:** https://appstoreconnect.apple.com/
2. **Click "My Apps" → "+ New App"**
3. **Fill in details:**
   - **Platform:** iOS
   - **Name:** MotionLabs AI
   - **Primary Language:** English
   - **Bundle ID:** com.motionlabsai.app
   - **SKU:** motionlabsai-app-001
   - **User Access:** Full Access
4. **Click "Create"**

---

### Step 9: Fill in App Information

**Required fields:**

**App Information:**
- **Name:** MotionLabs AI
- **Subtitle:** AI-Powered Athletic Training Analysis
- **Category:** Health & Fitness (primary), Sports (secondary)

**Privacy Policy:**
- **URL:** https://your-domain.com/privacy (you need to create this)

**Description:**
```
MotionLabs AI uses advanced computer vision and AI to provide real-time pose analysis 
and feedback for athletes. Track your training progress, analyze your form, and improve 
your performance with personalized AI coaching.

Features:
• Real-time pose estimation and skeleton tracking
• AI-powered form analysis
• Session recording with Cloudflare Stream
• Athlete progress tracking and metrics
• Face recognition for automatic athlete identification
• Cloud-based training history
```

**Keywords:** (comma-separated, max 100 characters)
```
sports,training,AI,pose,athletics,coach,fitness,analysis
```

**Screenshots:** (required - see "Creating Screenshots" section below)
- 6.7" iPhone: 1290x2796 (2-3 required)
- 5.5" iPhone: 1242x2208 (optional)
- 12.9" iPad: 2048x2732 (optional)

**App Icon:** (automatically pulled from your Xcode project - must be 1024x1024)

---

### Step 10: Create Screenshots

**Tools:**
- **Xcode Simulator** - take screenshots during testing
- **iPhone/iPad** - take screenshots while testing on device
- **Screenshot Framer:** https://www.screely.com/ or https://shotsnapp.com/

**Required screenshots:**
1. Dashboard/Home screen
2. Live camera feed with pose estimation
3. Alerts/Sessions list
4. Video playback with metrics
5. Athlete profile or settings (optional)

**How to take screenshots:**
- **Simulator:** Window → Capture Screen (or Cmd+S)
- **Real device:** Volume Up + Power button

---

### Step 11: Submit for Review

1. **Select build** (the one you uploaded earlier)
2. **Age Rating:** Complete questionnaire (likely 4+)
3. **App Review Information:**
   - **Demo Account:** Provide test login credentials
   - **Notes:** Any special instructions for reviewers
4. **Version Release:** Choose "Automatically" or "Manually"
5. **Click "Save"**
6. **Click "Submit for Review"**

**Review timeline:** Typically 1-3 days

---

## Android Google Play Deployment

### Step 1: Open Project in Android Studio

```bash
npm run cap:android
```

Or manually:
```bash
open -a "Android Studio" android/
```

**First time setup:**
- Android Studio may need to download Gradle and Android SDK
- This can take 10-30 minutes
- Let it complete before proceeding

---

### Step 2: Update Version Code and Name

**File:** `android/app/build.gradle`

Find the `defaultConfig` block:

```gradle
defaultConfig {
    applicationId "com.motionlabsai.app"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1              // Increment for each release (1, 2, 3...)
    versionName "1.0.0"        // User-facing version (1.0.0, 1.0.1, etc.)
}
```

---

### Step 3: Test on Emulator

1. **Create emulator** (if needed):
   - Tools → Device Manager → Create Device
   - Select "Pixel 6" or similar
   - Select latest system image (API 34+)
2. **Click Play** (▶️) or Run → Run 'app'
3. **Test the app** thoroughly

**Note:** Camera won't work on emulator - use real device for camera testing

---

### Step 4: Test on Real Device

1. **Enable Developer Options** on Android device:
   - Settings → About Phone → Tap "Build Number" 7 times
2. **Enable USB Debugging:**
   - Settings → Developer Options → USB Debugging ✅
3. **Connect device** via USB
4. **Select your device** from device dropdown
5. **Click Play** (▶️)
6. **Test everything!** (camera, login, sessions)

---

### Step 5: Generate Signing Key

**Create keystore** (one-time setup):

```bash
cd android/app
keytool -genkey -v -keystore motionlabs-release.keystore -alias motionlabs -keyalg RSA -keysize 2048 -validity 10000
```

**You'll be prompted for:**
- **Keystore password:** (choose strong password - SAVE THIS!)
- **Key password:** (same as keystore password or different - SAVE THIS!)
- **Name:** MotionLabs AI
- **Organization:** Your company name
- **Country:** US (or your country code)

**CRITICAL:** Save these securely - you cannot recover them!
- Keystore file: `android/app/motionlabs-release.keystore`
- Passwords: Store in password manager

**Add to `.gitignore`:**
```
*.keystore
*.jks
```

---

### Step 6: Configure Signing in Gradle

**Create:** `android/key.properties` (DO NOT commit to git!)

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=motionlabs
storeFile=motionlabs-release.keystore
```

**Edit:** `android/app/build.gradle`

Add before `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('app/key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android {`, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

---

### Step 7: Build Release AAB

**In Android Studio:**
1. **Menu: Build → Generate Signed Bundle / APK**
2. **Select "Android App Bundle"**
3. **Click "Next"**
4. **Choose existing keystore** (motionlabs-release.keystore)
5. **Enter passwords**
6. **Select "release" build variant**
7. **Click "Finish"**

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

**Or via command line:**
```bash
cd android
./gradlew bundleRelease
```

---

### Step 8: Create Google Play Console Account

1. **Go to:** https://play.google.com/console
2. **Sign in** with Google account
3. **Pay $25 one-time registration fee**
4. **Complete account details**

---

### Step 9: Create App in Play Console

1. **Click "Create app"**
2. **Fill in details:**
   - **App name:** MotionLabs AI
   - **Default language:** English (US)
   - **App or game:** App
   - **Free or paid:** Free (or Paid)
   - **Developer Program Policies:** ✅ Accept
   - **US export laws:** ✅ Accept
3. **Click "Create app"**

---

### Step 10: Complete Store Listing

**Main Store Listing:**

- **App name:** MotionLabs AI
- **Short description:** (80 chars max)
  ```
  AI-powered athletic training analysis and pose estimation for coaches & athletes
  ```
- **Full description:** (4000 chars max)
  ```
  MotionLabs AI transforms athletic training with cutting-edge computer vision and 
  artificial intelligence. Our platform provides real-time pose analysis, personalized 
  feedback, and comprehensive training insights for coaches and athletes.

  KEY FEATURES:
  • Real-time pose estimation with skeleton tracking
  • AI-powered form analysis and correction
  • Automatic athlete identification via face recognition
  • Session recording with cloud storage
  • Performance metrics and progress tracking
  • Coach-athlete collaboration tools
  • Training history and analytics

  PERFECT FOR:
  • Sports coaches managing multiple athletes
  • Individual athletes tracking their progress
  • Gymnastics, track & field, weightlifting, and more
  • Any sport requiring form analysis

  HOW IT WORKS:
  1. Record training sessions with your device camera
  2. AI analyzes movement and provides instant feedback
  3. Review sessions with annotated video playback
  4. Track progress over time with detailed metrics

  MotionLabs AI is trusted by coaches and athletes worldwide to elevate their 
  training and achieve peak performance.
  ```

**App icon:** (512x512 PNG)
- Upload your app icon (must match Android project icon)

**Feature graphic:** (1024x500 PNG)
- Create a banner image for your store listing
- Tools: Canva, Figma, or hire a designer

**Screenshots:** (2-8 required)
- Phone: 1080x1920 or 1080x2340
- Take screenshots on emulator or real device
- Show key features: dashboard, live camera, sessions, metrics

**Video:** (optional but recommended)
- YouTube URL showcasing your app
- 30-60 seconds highlighting features

---

### Step 11: Complete App Content

**App access:**
- ☐ All functionality available without special access
- ☑ Some or all functionality is restricted
  - Provide demo account credentials for testing

**Ads:**
- Does your app contain ads? (No, unless you added them)

**Content rating:**
- Complete questionnaire
- Likely rating: Everyone or Teen

**Target audience:**
- Select age groups: 13+ (adjust based on your requirements)

**News app:**
- Is this a news app? No

**COVID-19 contact tracing:**
- No

**Data safety:**
- Complete data collection questionnaire
- List: Email, Name, Photos/Videos (for training), Camera access
- Specify encryption, deletion options

**App category:**
- Category: Health & Fitness
- Tags: Sports, Training, AI

---

### Step 12: Upload AAB

1. **Go to "Production"** (left sidebar)
2. **Click "Create new release"**
3. **Upload** your `app-release.aab` file
4. **Release name:** 1.0.0 (build 1)
5. **Release notes:**
   ```
   Initial release of MotionLabs AI:
   • Real-time pose estimation for athletes
   • AI-powered training analysis
   • Session recording and playback
   • Coach-athlete management tools
   • Performance metrics and tracking
   ```
6. **Click "Save"**
7. **Click "Review release"**
8. **Click "Start rollout to Production"**

**Review timeline:** Typically 1-7 days (first submission may take longer)

---

## Post-Deployment

### Updating Your App

**For iOS:**
1. Increment **Build number** in Xcode
2. Update **Version** if features changed
3. Build → Archive → Upload
4. Submit new version in App Store Connect

**For Android:**
1. Increment **versionCode** in build.gradle
2. Update **versionName** if features changed
3. Build new AAB
4. Upload to Google Play Console
5. Create new release

**Web updates:**
```bash
# Make your changes
npm run build
npx cap copy  # Copies web assets to native projects
# Then rebuild and resubmit to stores
```

---

### Testing Before Release

**TestFlight (iOS):**
- Upload build to App Store Connect
- Add testers via email
- They can install via TestFlight app

**Internal Testing (Android):**
- Go to "Internal testing" in Play Console
- Upload AAB
- Add testers via email
- They get access via Play Store

---

### Monitoring

**iOS:**
- **App Store Connect:** Analytics, crashes, reviews
- https://appstoreconnect.apple.com/

**Android:**
- **Play Console:** Statistics, crashes, reviews, ratings
- https://play.google.com/console/

**Firebase:**
- Both platforms can use Firebase for advanced analytics
- Crashlytics for crash reporting

---

## Troubleshooting

### iOS Issues

**"Failed to register bundle identifier":**
- Bundle ID already registered or not available
- Change in Xcode: Select target → General → Bundle Identifier

**"No signing certificate found":**
- Sign into Xcode with Apple Developer account
- Xcode → Settings → Accounts → Add Apple ID

**"This app cannot be installed because its integrity could not be verified":**
- On device: Settings → General → VPN & Device Management → Trust

### Android Issues

**"Keystore was tampered with, or password was incorrect":**
- Check passwords in `key.properties`
- Ensure keystore file path is correct

**"Minimum SDK version":**
- Update `minSdkVersion` in `android/app/build.gradle`
- Recommended: 24 (Android 7.0) or higher

**"Failed to install APK":**
- Uninstall old version first
- Enable "Install from Unknown Sources" in device settings

---

## Environment Variables for Production

**Update `.env` for production:**

```bash
# Production API URLs
VITE_ATHLETE_COACH_API_URL=https://athlete-coach-fastapi-630016859450.europe-west1.run.app
VITE_LIVE_CAMERA_WS_URL=wss://your-websocket-server.com/api/live-camera/ws

# Firebase (already configured)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase config

# Optional: Brevo API key (if using email invites)
VITE_BREVO_API_KEY=...
```

**Rebuild after changes:**
```bash
npm run cap:sync
```

---

## Costs Summary

| Item | iOS | Android | Both |
|------|-----|---------|------|
| **Developer Account** | $99/year | $25 one-time | - |
| **Mac Computer** | Required | - | - |
| **Testing Devices** | Optional | Optional | - |
| **Designer (optional)** | - | - | $100-500 |
| **Total First Year** | ~$99 | ~$25 | ~$124 |

---

## Timeline

| Phase | Duration |
|-------|----------|
| **Setup & Configuration** | ✅ Complete! |
| **Icon & Screenshot Creation** | 2-4 hours |
| **Testing** | 1-2 days |
| **Store Listing** | 2-4 hours |
| **Submission** | 1 hour |
| **Review (iOS)** | 1-3 days |
| **Review (Android)** | 1-7 days |
| **Total** | ~1-2 weeks |

---

## Next Steps

### Immediate (Required before submission):
1. ✅ **Create app icon** (1024x1024 PNG)
2. ✅ **Take screenshots** (iPhone and Android)
3. ✅ **Write privacy policy** (required for both stores)
4. ✅ **Test thoroughly** on real devices

### Before iOS Submission:
1. Join Apple Developer Program ($99/year)
2. Open project in Xcode: `npm run cap:ios`
3. Configure signing & provisioning
4. Test on real iPhone/iPad
5. Archive and upload to App Store Connect
6. Complete store listing
7. Submit for review

### Before Android Submission:
1. Create Google Play Console account ($25 one-time)
2. Generate signing key (keep it safe!)
3. Open project in Android Studio: `npm run cap:android`
4. Test on real Android device
5. Build signed AAB
6. Complete store listing
7. Upload and submit for review

---

## Resources

**Official Documentation:**
- Capacitor: https://capacitorjs.com/docs
- iOS Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Android Material Design: https://m3.material.io/

**App Store Guidelines:**
- iOS App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Google Play Policy: https://play.google.com/about/developer-content-policy/

**Tools:**
- App Icon Generator: https://appicon.co/
- Screenshot Frames: https://www.screely.com/
- Privacy Policy Generator: https://www.privacypolicygenerator.info/

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Refer to `APP_ICONS_GUIDE.md` for icon generation
3. Capacitor docs: https://capacitorjs.com/docs
4. Stack Overflow: Tag questions with `capacitor`, `ios`, or `android`

---

🎉 **Congratulations!** Your app is ready for mobile deployment!

Follow the steps above to submit to the Apple App Store and Google Play Store.
