# SyncRunize Complete Deployment Guide

This guide covers building the APK and deploying everything.

---

## 📱 Part 1: Build the Mobile App APK

### Step 1: Prepare the Mobile App

```bash
cd syncrunize-mobile-app

# Install dependencies
npm install

# Make sure environment variables are set
# For now, keep localhost URLs (will update later)
cat .env
```

### Step 2: Build Web Assets

```bash
# Clean previous builds
rm -rf dist

# Build for production
npm run build

# Verify dist folder was created
ls dist/
```

### Step 3: Sync to Android

```bash
# Sync the built assets to Android project
npx cap sync android

# This copies dist/ → android/app/src/main/assets/public/
```

### Step 4: Generate Signing Key (FIRST TIME ONLY)

```bash
cd android/app

# Generate keystore (run this ONCE)
keytool -genkey -v -keystore syncrunize-release.keystore -alias syncrunize -keyalg RSA -keysize 2048 -validity 10000

# Enter password: [CREATE STRONG PASSWORD]
# Re-enter password: [SAME PASSWORD]
# Name: [Your Name]
# Organization: SyncRunize
# City/State/Country: [Your Location]

# IMPORTANT: SAVE THIS PASSWORD! You can't recover it.
```

### Step 5: Create key.properties

Create `android/key.properties`:

```properties
storeFile=app/syncrunize-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD_HERE
keyAlias=syncrunize
keyPassword=YOUR_KEY_PASSWORD_HERE
```

**Add to .gitignore:**
```bash
cd ../..  # Back to syncrunize-mobile-app/
echo "android/key.properties" >> .gitignore
echo "android/app/*.keystore" >> .gitignore
```

### Step 6: Configure build.gradle

Edit `android/app/build.gradle` and add ABOVE the `android {` block:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then INSIDE `android {` block, add:

```gradle
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
```

### Step 7: Build the APK

**Option A: Using Android Studio (Recommended)**

1. Open `syncrunize-mobile-app/android/` in Android Studio
2. Wait for Gradle sync
3. **Build** → **Generate Signed Bundle / APK**
4. Select **APK**
5. Choose keystore: `app/syncrunize-release.keystore`
6. Enter passwords
7. Select **release** variant
8. Click **Finish**

APK location: `android/app/release/app-release.apk`

**Option B: Command Line**

```bash
cd android

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

### Step 8: Test the APK

```bash
# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Test:
# - App installs without errors
# - Icon and name show correctly
# - Login works
# - Features work
```

### Step 9: Rename APK

```bash
cd android/app/build/outputs/apk/release/
cp app-release.apk SyncRunize-v1.0.0.apk

# Check size
ls -lh SyncRunize-v1.0.0.apk
```

---

## 🌐 Part 2: Add APK to Website

### Step 1: Copy APK to Website

```bash
# From root directory:
cd ../../../../../../..  # Back to SyncRunize/

# Copy APK to website downloads folder
cp syncrunize-mobile-app/android/app/build/outputs/apk/release/SyncRunize-v1.0.0.apk syncrunize-website/public/downloads/

# Verify it's there
ls -lh syncrunize-website/public/downloads/SyncRunize-v1.0.0.apk
```

### Step 2: Test Download Locally

```bash
cd syncrunize-website

# Start dev server
npm run dev

# Open http://localhost:5173/run-tracking
# Click "Download APK" button
# Verify download starts
```

---

## ☁️ Part 3: Deploy to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy Website

```bash
cd syncrunize-website

# First deployment
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [Your account]
# - Link to existing project? N
# - Project name? syncrunize
# - Directory? ./
# - Override settings? N

# Deploy to production
vercel --prod
```

### Step 4: Add Environment Variables on Vercel

Go to Vercel Dashboard → Project → Settings → Environment Variables

Add these:
```
VITE_SUPABASE_URL=https://hooceemtoyucadhxuevx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_vPUyS5ewiw_8XPg8YA06pA_PvvgbjQ1
VITE_API_URL=http://192.168.100.227:5000/api  (UPDATE LATER WITH BACKEND URL)
VITE_ALGO_ENGINE_URL=http://localhost:8000  (UPDATE LATER)
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoiam1kZXYyMiIsImEiOiJjbWh1OHBtMmIxaG02MmpzN3M0YWZsc2Z4In0.0NwFuohhqSacIAtsivuuRg
```

### Step 5: Redeploy

```bash
vercel --prod
```

Your website is now live! Note the URL (e.g., https://syncrunize.vercel.app)

---

## 🔄 Part 4: Update Mobile App with Production URL

### Step 1: Update Mobile App .env

Now that your website is deployed, update the mobile app:

```bash
cd syncrunize-mobile-app

# Edit .env
nano .env
```

Update this line:
```env
VITE_WEB_APP_URL=https://syncrunize.vercel.app
```

### Step 2: Rebuild APK

```bash
# Rebuild web assets
npm run build

# Sync to Android
npx cap sync android

# Rebuild APK
cd android
./gradlew assembleRelease

# Copy new APK
cd ../..
cp android/app/build/outputs/apk/release/app-release.apk ../syncrunize-website/public/downloads/SyncRunize-v1.0.0.apk
```

### Step 3: Redeploy Website

```bash
cd ../syncrunize-website

# Redeploy with updated APK
vercel --prod
```

---

## 🧪 Part 5: Test Everything

### Test Checklist:

1. **Website**
   - [ ] Visit https://your-site.vercel.app
   - [ ] Check all pages load
   - [ ] Go to Run Tracking page
   - [ ] Click "Download APK" button
   - [ ] Verify APK downloads

2. **Mobile App**
   - [ ] Install downloaded APK
   - [ ] App icon shows "SyncRunize"
   - [ ] Login works
   - [ ] Password reset redirects to website (not localhost)
   - [ ] All features work

3. **Integration**
   - [ ] Mobile app connects to backend
   - [ ] Data syncs properly
   - [ ] Maps load correctly
   - [ ] Notifications work

---

## 📋 Summary of Files Created

### Mobile App:
```
syncrunize-mobile-app/
├── .env.production                    # Production environment template
├── APK_BUILD_GUIDE.md                 # Detailed APK build instructions
├── android/
│   ├── key.properties                 # Keystore configuration (gitignored)
│   └── app/
│       └── syncrunize-release.keystore # Signing key (gitignored)
```

### Website:
```
syncrunize-website/
├── public/
│   └── downloads/
│       ├── README.md                  # APK folder instructions
│       ├── .gitkeep                   # Keeps folder in git
│       └── SyncRunize-v1.0.0.apk      # Your APK (gitignored)
└── src/
    └── pages/
        └── RunTracking.tsx            # Updated with download link
```

---

## 🚀 Next Steps

After this initial setup:

1. **Deploy Backend** (to Railway/Render)
   - Update `VITE_API_URL` in both mobile and web

2. **Deploy Algorithm Engine**
   - Update `VITE_ALGO_ENGINE_URL` in backend

3. **Rebuild Mobile App** with production URLs
   - Create new APK with version 1.0.1
   - Upload to website

4. **Later: Google Play Store**
   - $25 one-time fee
   - Better distribution
   - Automatic updates

---

## 📝 Important Notes

### Security:
- ✅ Keystore backed up safely
- ✅ Passwords stored securely
- ✅ API keys in environment variables
- ✅ No secrets in git

### Version Management:
- Update version in `android/app/build.gradle`
- Rename APK with version number
- Update download URL in `RunTracking.tsx`

### File Sizes:
- APK: ~25-50 MB (typical)
- Vercel limit: 100 MB per file
- Git ignores APK files (too large)

---

## ❓ Troubleshooting

### APK won't install
- Enable "Install from Unknown Sources"
- Check minimum Android version (8.0+)

### Download doesn't work
- Check APK is in `public/downloads/`
- Verify filename matches in `RunTracking.tsx`
- Check browser console for errors

### APK crashes
- Check `adb logcat` for errors
- Verify environment variables are correct
- Test on multiple devices

---

## ✅ You're Done!

Your deployment is complete when:

1. ✅ APK builds successfully
2. ✅ APK is in website downloads folder
3. ✅ Website deployed to Vercel
4. ✅ Download button works
5. ✅ APK installs and runs on device
6. ✅ Mobile app connects to backend

**Congratulations! 🎉**

Your users can now:
- Visit your website
- Download the APK
- Install and use your app!
