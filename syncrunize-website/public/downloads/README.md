# APK Downloads Folder

This folder contains the SyncRunize mobile app APK files for download.

## Instructions

### After Building Your APK:

1. **Build the APK** (see `syncrunize-mobile-app/APK_BUILD_GUIDE.md`)

2. **Copy the APK here:**
   ```bash
   # From your mobile app folder:
   cp syncrunize-mobile-app/android/app/build/outputs/apk/release/app-release.apk syncrunize-website/public/downloads/SyncRunize-v1.0.0.apk
   ```

3. **Verify the file is here:**
   ```
   syncrunize-website/public/downloads/SyncRunize-v1.0.0.apk
   ```

4. **Deploy to Vercel:**
   - The APK will be available at: `https://your-site.vercel.app/downloads/SyncRunize-v1.0.0.apk`
   - Users can download it by clicking the "Download APK" button on the Run Tracking page

## File Naming Convention

Use this format for APK files:
```
SyncRunize-v{VERSION}.apk

Examples:
- SyncRunize-v1.0.0.apk
- SyncRunize-v1.0.1.apk
- SyncRunize-v1.1.0.apk
```

## Version Updates

When releasing a new version:

1. Build new APK with updated version number
2. Copy new APK to this folder
3. Update the version in `RunTracking.tsx`:
   ```typescript
   const apkUrl = "/downloads/SyncRunize-v1.0.1.apk";
   ```
4. Keep old versions for backwards compatibility (optional)

## File Size

- Typical APK size: 25-50 MB
- Vercel limit: 100 MB per file
- If APK is larger, consider:
  - Using Android App Bundle (.aab) for Play Store
  - Hosting APK on external CDN (Firebase Storage, AWS S3, etc.)

## Security Notes

- APK files are publicly accessible
- Make sure no API keys are hardcoded in APK
- All sensitive data should be in environment variables
- APK is signed with your keystore (proves authenticity)

## Testing Download

After deployment, test the download:

1. Visit: `https://your-site.vercel.app/run-tracking`
2. Click "Download APK" button
3. Verify download starts
4. Install APK on Android device
5. Test app functionality

## Git Ignore

APK files should be gitignored due to size. Add to `.gitignore`:

```gitignore
# APK files
*.apk
public/downloads/*.apk
```

## Alternative: External Hosting

For larger files or better download speeds, consider hosting APK externally:

### Option 1: Firebase Storage (Free)
```typescript
const apkUrl = "https://firebasestorage.googleapis.com/.../SyncRunize-v1.0.0.apk";
```

### Option 2: GitHub Releases (Free)
```typescript
const apkUrl = "https://github.com/your-username/syncrunize/releases/download/v1.0.0/SyncRunize-v1.0.0.apk";
```

### Option 3: AWS S3 (Paid but cheap)
```typescript
const apkUrl = "https://syncrunize-apks.s3.amazonaws.com/SyncRunize-v1.0.0.apk";
```

## Current Status

- ⏳ **Waiting for APK** - Build your first APK and place it here!
- 📍 Expected location: `SyncRunize-v1.0.0.apk`
- 🔗 Will be available at: `/downloads/SyncRunize-v1.0.0.apk`
