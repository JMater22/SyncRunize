# SyncRunize APK Build Guide

This guide will help you build a production-ready APK for SyncRunize.

## Prerequisites

- ✅ Android Studio installed
- ✅ Java JDK 17+ installed
- ✅ All dependencies installed (`npm install`)

---

## Step 1: Prepare Environment Variables

**Option A: For Testing (Use Current Localhost)**
```bash
# Keep current .env file as-is
# APK will connect to your local backend (only works on same network)
```

**Option B: For Production (After Deploying Backend)**
```bash
# Copy .env.production to .env
cp .env.production .env

# Update these URLs in .env:
VITE_API_URL=https://your-backend.railway.app/api
VITE_WEB_APP_URL=https://your-website.vercel.app
```

---

## Step 2: Update App Version

Edit `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.app.syncrunize',
  appName: 'SyncRunize',
  webDir: 'dist',
  server: {
    // Remove this in production:
    // androidScheme: 'https'
  }
};
```

Edit `android/app/build.gradle` to update version:

```gradle
android {
    defaultConfig {
        versionCode 1        // Increment this for each release
        versionName "1.0.0"  // User-facing version
    }
}
```

---

## Step 3: Build the Web Assets

```bash
# Clean previous builds
rm -rf dist

# Build for production
npm run build

# This creates the 'dist' folder with optimized assets
```

---

## Step 4: Sync with Android

```bash
# Sync the built web assets to Android project
npx cap sync android

# This copies dist/ → android/app/src/main/assets/public/
```

---

## Step 5: Generate Signing Key (First Time Only)

You need a keystore to sign your APK. This proves it's from you.

### Create Keystore:

```bash
# Navigate to android/app directory
cd android/app

# Generate keystore (run this ONCE)
keytool -genkey -v -keystore syncrunize-release.keystore -alias syncrunize -keyalg RSA -keysize 2048 -validity 10000

# You'll be asked:
# - Password: Choose a strong password (SAVE IT!)
# - Name: Your name
# - Organization: SyncRunize
# - City, State, Country: Your location
```

**IMPORTANT:**
- ⚠️ **SAVE the password!** You can't recover it.
- ⚠️ **Backup the keystore file!** Keep it safe.
- ⚠️ **Never commit to git!** Add to .gitignore

### Create key.properties File:

Create `android/key.properties`:

```properties
storeFile=app/syncrunize-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=syncrunize
keyPassword=YOUR_KEY_PASSWORD
```

**Add to .gitignore:**
```bash
echo "android/key.properties" >> .gitignore
echo "android/app/*.keystore" >> .gitignore
```

---

## Step 6: Configure Gradle for Release Build

Edit `android/app/build.gradle`:

Add this ABOVE `android {` block:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then inside `android {` block, add:

```gradle
android {
    ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 7: Build the Release APK

### Option A: Using Android Studio (Recommended)

1. Open `android/` folder in Android Studio
2. Wait for Gradle sync to complete
3. Go to **Build** → **Generate Signed Bundle / APK**
4. Select **APK**
5. Click **Next**
6. Choose your keystore file: `app/syncrunize-release.keystore`
7. Enter your passwords
8. Select **release** build variant
9. Click **Finish**

APK will be in: `android/app/release/app-release.apk`

### Option B: Using Command Line

```bash
cd android

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Step 8: Test the APK

### Install on Device:

```bash
# Find the APK
cd android/app/build/outputs/apk/release/

# Install via ADB
adb install app-release.apk

# Or: Copy to device and install manually
```

### Test Checklist:

- [ ] App installs without errors
- [ ] App icon and name show correctly ("SyncRunize")
- [ ] Login works
- [ ] API calls work (check network tab)
- [ ] Run tracking works
- [ ] Maps load properly
- [ ] Notifications work
- [ ] No crashes

---

## Step 9: Rename and Prepare for Distribution

```bash
# Rename for clarity
cd android/app/build/outputs/apk/release/
cp app-release.apk SyncRunize-v1.0.0.apk

# Check file size (should be 20-50 MB)
ls -lh SyncRunize-v1.0.0.apk
```

---

## Common Issues & Fixes

### Issue: "Keystore not found"
**Fix:** Make sure `key.properties` points to correct path
```properties
storeFile=app/syncrunize-release.keystore  # Relative to android/ folder
```

### Issue: "Cleartext HTTP traffic not permitted"
**Fix:** Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

### Issue: APK crashes on launch
**Fix:** Check Android logcat:
```bash
adb logcat | grep SyncRunize
```

### Issue: API calls fail
**Fix:** Check `.env` has production URLs, not localhost

---

## Security Checklist

Before distributing:

- [ ] No hardcoded API keys in source code
- [ ] All sensitive data in `.env` (which is gitignored)
- [ ] Keystore backed up in safe location
- [ ] `.env` files NOT committed to git
- [ ] `key.properties` NOT committed to git
- [ ] Using HTTPS for API calls (not HTTP)

---

## Next Steps

After building APK:

1. **Test thoroughly** on multiple devices
2. **Upload to website** for download
3. **Later:** Submit to Google Play Store ($25 one-time fee)

---

## Version Management

For each new release:

1. Update `versionCode` and `versionName` in `build.gradle`
2. Rebuild APK
3. Test
4. Upload new version to website
5. Notify users to update

---

## Files to Keep Safe

**NEVER LOSE THESE:**

1. `syncrunize-release.keystore` - Can't update app without it!
2. Keystore password - Can't sign APK without it!
3. `key.properties` - Contains your passwords

**Backup these to:**
- Secure cloud storage (encrypted)
- External hard drive
- Password manager (for passwords)

**DO NOT:**
- ❌ Commit to GitHub
- ❌ Share publicly
- ❌ Email unencrypted

---

## Summary

```bash
# Quick build steps:
cd syncrunize-mobile-app

# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK
cd android
./gradlew assembleRelease

# 4. APK is ready at:
# android/app/build/outputs/apk/release/app-release.apk
```

Done! 🎉
