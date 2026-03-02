# App Icons and Splash Screens Guide

## Current Status

The Capacitor project has been initialized with default app icons. You'll need to replace these with your custom MotionLabs AI branding.

---

## Required Assets

### App Icon
- **Size:** 1024x1024px
- **Format:** PNG with transparent background (or solid color)
- **Design:** Your Motion Labs AI logo/brand

### Splash Screen (Optional)
- **Size:** 2732x2732px (will be scaled for different devices)
- **Format:** PNG
- **Design:** Logo on solid background color (#f9fafb recommended to match app theme)

---

## Option 1: Use Icon Generator Service (Easiest)

### Recommended Tools:

**1. Capacitor Assets Generator** (Official)
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

**2. App Icon Generator** (Web-based)
- https://appicon.co/
- https://makeappicon.com/
- Upload your 1024x1024 icon
- Download iOS and Android sets

---

## Option 2: Manual Placement

### iOS Icons
Place your app icons in:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

Required sizes:
- 20x20@2x, 20x20@3x
- 29x29@2x, 29x29@3x
- 40x40@2x, 40x40@3x
- 60x60@2x, 60x60@3x
- 1024x1024 (App Store)

### Android Icons
Place your app icons in:
```
android/app/src/main/res/
  ├── mipmap-mdpi/ic_launcher.png (48x48)
  ├── mipmap-hdpi/ic_launcher.png (72x72)
  ├── mipmap-xhdpi/ic_launcher.png (96x96)
  ├── mipmap-xxhdpi/ic_launcher.png (144x144)
  └── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

---

## Quick Setup with Capacitor Assets

### Step 1: Create Assets Folder
```bash
mkdir -p resources
```

### Step 2: Add Your Icon
Place your 1024x1024 PNG icon at:
```
resources/icon.png
```

### Step 3: (Optional) Add Splash Screen
Place your 2732x2732 PNG splash at:
```
resources/splash.png
```

### Step 4: Generate All Sizes
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#f9fafb' --splashBackgroundColor '#f9fafb'
```

This will automatically generate all required icon sizes for both iOS and Android!

---

## Current Default Icons

The project currently uses Capacitor's default blue icon. This is fine for testing but should be replaced before App Store submission.

**Default icon locations:**
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

---

## Design Recommendations

### App Icon
✅ **Do:**
- Use simple, recognizable logo
- High contrast colors
- Clear at small sizes (29x29)
- Match your brand identity
- Consider rounded corners (automatically applied by iOS)

❌ **Don't:**
- Use text (hard to read at small sizes)
- Use photos (too detailed)
- Use transparency on Android (may show black background)
- Use different designs for iOS/Android

### Splash Screen
✅ **Do:**
- Use centered logo on solid background
- Match app's color scheme (#f9fafb gray background recommended)
- Keep it simple and fast-loading
- Test on different screen sizes

---

## Testing Icons

### iOS
```bash
# Open in Xcode to preview
npx cap open ios
```
Then run the app on simulator/device to see your icon on the home screen.

### Android
```bash
# Open in Android Studio to preview
npx cap open android
```
Then run the app on emulator/device to see your icon.

---

## App Store Requirements

### Apple App Store
- **Icon:** 1024x1024 PNG (no transparency, no rounded corners)
- **Screenshots:** 
  - 6.7" iPhone: 1290x2796 (2-3 required)
  - 12.9" iPad: 2048x2732 (optional)

### Google Play Store
- **Icon:** 512x512 PNG (will be displayed with rounded corners)
- **Feature Graphic:** 1024x500 PNG (banner for store listing)
- **Screenshots:**
  - Phone: 1080x1920 or 1080x2340 (2-8 required)
  - Tablet: 1600x2560 (optional)

---

## Next Steps

1. **Create your app icon** (1024x1024 PNG)
2. **Place in `resources/icon.png`**
3. **Run generator:**
   ```bash
   npm install -D @capacitor/assets
   npx capacitor-assets generate
   ```
4. **Sync to native projects:**
   ```bash
   npx cap sync
   ```
5. **Test in Xcode/Android Studio**

---

## Current Setup

**Status:** ✅ Project configured with default icons

**To customize:**
1. Follow steps above to add your branding
2. Or continue with default icons for testing
3. Replace before App Store submission

The default icons are sufficient for development and testing!
