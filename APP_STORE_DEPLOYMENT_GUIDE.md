# App Store Deployment Guide

## Overview

You have **two options** to get your app on mobile devices:

1. **PWA Only** (Easiest) - No app stores needed
2. **Native App Stores** (Recommended) - iOS App Store + Google Play Store

---

## Option 1: PWA Only (No App Store) ⚡

### What You Already Have

Your app is already a **Progressive Web App (PWA)**! Users can install it directly from their browser.

### Deployment Steps

1. **Deploy to Production (Vercel)**
   ```bash
   npm run build
   vercel deploy --prod
   ```

2. **Users Install Via Browser**
   - iOS (Safari): Tap Share → "Add to Home Screen"
   - Android (Chrome): Tap ⋮ → "Install app"

### Pros & Cons

✅ **Pros:**
- No App Store approval needed
- Instant updates
- No app store fees
- Works on all devices

❌ **Cons:**
- Less discoverable (not in App Store search)
- Limited access to native features
- No App Store credibility

---

## Option 2: App Store Deployment (Recommended) 🏪

### Overview

Use **Capacitor** to wrap your web app in a native container and deploy to both stores.

---

## Step-by-Step: iOS App Store

### Prerequisites

- Mac computer (required for iOS)
- Xcode installed
- Apple Developer Account ($99/year)

### 1. Install Capacitor

```bash
cd /Users/eishahemchand/MotionLabsAI

# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android

# Initialize Capacitor
npx cap init
```

**Prompts:**
- App name: `MotionLabs AI`
- App ID: `com.motionlabs.ai` (use your domain)
- Web asset directory: `build`

### 2. Build Web App

```bash
npm run build
```

### 3. Add iOS Platform

```bash
npx cap add ios
npx cap sync ios
```

### 4. Open in Xcode

```bash
npx cap open ios
```

### 5. Configure in Xcode

**a) Update Bundle Identifier**
- Open project in Xcode
- Select project → Signing & Capabilities
- Bundle Identifier: `com.motionlabs.ai`

**b) Add Permissions (for webcam, etc.)**

Edit `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>MotionLabs AI needs camera access for pose estimation and form analysis</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>To save and upload your training photos</string>
<key>NSMicrophoneUsageDescription</key>
<string>For video recording with audio</string>
```

**c) Add App Icons**
- Use https://appicon.co/ to generate icons
- Drag icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**d) Set App Version**
- Version: `1.0.0`
- Build: `1`

### 6. Test on Device

- Connect iPhone via USB
- Select device in Xcode
- Click ▶ Run
- Test all features (webcam, login, etc.)

### 7. Create App Store Connect Listing

1. Go to https://appstoreconnect.apple.com
2. Click ➕ → New App
3. Fill in details:
   - Name: `MotionLabs AI`
   - Language: English
   - Bundle ID: `com.motionlabs.ai`
   - SKU: `motionlabs-ai-1`

4. Add Screenshots (required):
   - iPhone 6.7": 1290 x 2796 (iPhone 14 Pro Max)
   - iPhone 6.5": 1284 x 2778 (iPhone 11 Pro Max)
   - Use simulator or actual device

5. Add App Information:
   - Category: Health & Fitness
   - Description: (see below)
   - Keywords: `fitness, coaching, pose estimation, injury prevention`

6. Set Privacy Policy URL:
   - Host at: `https://your-domain.com/privacy`

### 8. Archive and Upload

**In Xcode:**
1. Product → Archive
2. Wait for archive to complete
3. Organizer opens → Click "Distribute App"
4. Choose "App Store Connect"
5. Upload → TestFlight
6. Wait for processing (15-30 min)

### 9. TestFlight Beta Testing

1. App Store Connect → TestFlight
2. Add internal testers (up to 100)
3. Test for 1-2 weeks
4. Fix any bugs

### 10. Submit for Review

1. App Store Connect → Your App
2. Click "+ Version" → `1.0.0`
3. Fill in "What's New" text
4. Select build from TestFlight
5. Submit for Review
6. Wait 1-3 days for approval

---

## Step-by-Step: Google Play Store

### Prerequisites

- Google Play Developer Account ($25 one-time)
- Android Studio installed

### 1. Add Android Platform

```bash
npx cap add android
npx cap sync android
```

### 2. Open in Android Studio

```bash
npx cap open android
```

### 3. Configure Android

**a) Update Package Name**

Edit `android/app/build.gradle`:
```gradle
android {
    namespace "com.motionlabs.ai"
    defaultConfig {
        applicationId "com.motionlabs.ai"
        minSdkVersion 22
        targetSdkVersion 33
    }
}
```

**b) Add Permissions**

Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

**c) Add App Icon**
- Use https://romannurik.github.io/AndroidAssetStudio/
- Copy to `android/app/src/main/res/`

### 4. Generate Signing Key

```bash
cd android/app
keytool -genkey -v -keystore motionlabs-release.keystore -alias motionlabs -keyalg RSA -keysize 2048 -validity 10000

# Save password securely!
```

**Configure signing in `android/app/build.gradle`:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file('motionlabs-release.keystore')
            storePassword 'YOUR_PASSWORD'
            keyAlias 'motionlabs'
            keyPassword 'YOUR_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

### 5. Build Release APK/AAB

```bash
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 6. Create Google Play Console Listing

1. Go to https://play.google.com/console
2. Create Application → "MotionLabs AI"
3. Fill in Store Listing:
   - Title: `MotionLabs AI - Performance Coach`
   - Short description (80 chars)
   - Full description (4000 chars, see below)
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (at least 2):
     - Phone: 16:9 or 9:16 ratio
     - Tablet: 16:9 ratio (optional)

4. Content Rating:
   - Complete questionnaire
   - Select "Sports" or "Fitness"

5. App Content:
   - Privacy policy URL
   - Ads: No (or Yes if applicable)
   - Target audience: 13+

### 7. Upload AAB

1. Production → Create new release
2. Upload `app-release.aab`
3. Fill in release notes
4. Save → Review release
5. Start rollout to Production

### 8. Review Process

- Google reviews in 1-3 days
- May request changes
- Once approved, live in ~24 hours

---

## App Descriptions

### iOS App Store Description

```
MotionLabs AI - Your Personal Performance Coach

Transform your training with AI-powered pose estimation and real-time form analysis. Whether you're a gymnast, athlete, or fitness enthusiast, MotionLabs AI helps you train smarter and prevent injuries.

FEATURES:
• Real-time pose estimation and form analysis
• Personalized performance insights
• Injury risk detection and prevention
• Progress tracking with detailed metrics
• Coach-athlete collaboration tools
• Video analysis with AI feedback
• Secure face recognition for automatic athlete identification

PERFECT FOR:
• Gymnastics coaches and athletes
• Sports teams and training facilities
• Personal trainers and fitness professionals
• Athletes serious about performance improvement

HOW IT WORKS:
1. Record your training session with your device camera
2. Our AI analyzes your form and technique in real-time
3. Get instant feedback on biomechanics and potential issues
4. Track progress over time with detailed analytics
5. Share results with your coach for personalized guidance

BACKED BY SCIENCE:
Our pose estimation technology uses advanced computer vision and machine learning to provide accurate, actionable insights into your movement patterns.

PRIVACY & SECURITY:
Your data is encrypted and secure. We never share your personal information or training data without your permission.

Start training smarter today with MotionLabs AI!
```

### Google Play Store Description

```
MotionLabs AI - AI-Powered Training & Performance Analysis

Revolutionize your athletic training with cutting-edge AI technology. MotionLabs AI provides real-time form analysis, injury prevention tools, and personalized coaching insights.

🏆 KEY FEATURES
✓ Real-time pose estimation during training
✓ AI-powered form and technique analysis
✓ Injury risk detection and prevention
✓ Detailed biomechanics tracking
✓ Progress analytics and insights
✓ Coach collaboration tools
✓ Secure face recognition technology

🎯 WHO IS IT FOR?
• Gymnastics athletes and coaches
• Sports teams and academies
• Personal trainers and fitness pros
• Anyone serious about performance

📊 HOW IT WORKS
1. Record training with your camera
2. AI analyzes form in real-time
3. Get instant feedback
4. Track improvements
5. Collaborate with coaches

🔒 PRIVACY FIRST
Your data stays yours. Bank-level encryption. GDPR compliant.

💪 TRAIN SMARTER, NOT HARDER
Download MotionLabs AI today!
```

---

## Screenshots Required

### iOS (Required Sizes)

1. **iPhone 6.7"** (1290 x 2796): iPhone 14 Pro Max
2. **iPhone 6.5"** (1242 x 2688): iPhone 11 Pro Max
3. **iPad Pro (12.9")** (2048 x 2732): Optional

### Android (Required Sizes)

1. **Phone**: Minimum 320dp width, 16:9 or 9:16
2. **Tablet**: 7" or 10" tablet (optional)

**Recommended Tool:** Use Figma or Photoshop with device mockups

**What to Show:**
- Login screen
- Training session recording
- Form analysis results
- Athlete dashboard
- Coach roster view
- Video playback with overlays

---

## Timeline & Costs

### Timeline

| Step | iOS | Android |
|------|-----|---------|
| Setup Capacitor | 1 hour | 1 hour |
| Configure app | 2-3 hours | 2-3 hours |
| Test on device | 1-2 hours | 1-2 hours |
| Create listing | 2-3 hours | 2-3 hours |
| Generate assets | 3-4 hours | 3-4 hours |
| Submit | 30 min | 30 min |
| Review | 1-3 days | 1-3 days |
| **Total** | **~2 weeks** | **~2 weeks** |

### Costs

| Item | iOS | Android |
|------|-----|---------|
| Developer Account | $99/year | $25 one-time |
| Mac (if needed) | $1000+ | - |
| App Icon Designer | $50-200 | $50-200 |
| Screenshots/Assets | $100-300 | $100-300 |
| **Total Year 1** | **$250-600** | **$175-525** |

---

## Quick Commands Reference

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Initialize
npx cap init

# Build web app
npm run build

# Add platforms
npx cap add ios
npx cap add android

# Sync changes
npx cap sync

# Open in IDE
npx cap open ios
npx cap open android

# Update after web changes
npm run build && npx cap sync
```

---

## Common Issues & Solutions

### iOS: Code Signing Error
- Solution: Select your Apple Developer team in Xcode

### iOS: Camera Not Working
- Solution: Add `NSCameraUsageDescription` to Info.plist

### Android: Build Failed
- Solution: Update Android Studio and Gradle

### Both: White Screen on Launch
- Solution: Check `capacitor.config.ts` webDir matches build output

---

## Alternative: Publish PWA to Microsoft Store

For Windows 11, you can also publish your PWA:

1. Go to https://developer.microsoft.com/en-us/microsoft-store/pwa-builder
2. Enter your PWA URL
3. Generate Windows app package
4. Submit to Microsoft Store

---

## Summary

**Recommended Path:**
1. ✅ Deploy web app to Vercel (HTTPS)
2. ✅ Test PWA installation from browser (free, instant)
3. ✅ Wrap with Capacitor for app stores (native feel)
4. ✅ Submit to iOS App Store & Google Play (maximum reach)

**Result:** Users can install from browser OR download from app stores! 🎉
