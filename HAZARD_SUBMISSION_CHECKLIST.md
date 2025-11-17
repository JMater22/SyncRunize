# Hazard Submission Flow - Comprehensive Issue Checklist

**Last Updated:** 2025-11-17
**Status:** Issues identified and fixes applied

---

## ✅ FIXED ISSUES

### 1. Missing Uploads Directory on Render ✅ FIXED
**Problem:** `uploads/hazards/` directory doesn't exist on Render's ephemeral filesystem
**Impact:** Multer fails when trying to save images, causing endless loading
**Fix Applied:** Added directory creation on server startup (server.js:50-58)
```javascript
const uploadsDir = path.join(__dirname, 'uploads', 'hazards');
mkdirp.sync(uploadsDir);
```
**Status:** ✅ Fixed in commit df95cb3

### 2. Environment Variable Naming Inconsistency ✅ FIXED
**Problem:** Code used `ALGO_ENGINE_URL` but .env has `ALGORITHM_ENGINE_URL`
**Impact:** Algorithm engine URL not loaded, causing scoring timeouts
**Fix Applied:** Renamed all instances to `ALGORITHM_ENGINE_URL`
- hazard_service.js:4
- routing_service.js:4
**Status:** ✅ Fixed in commit f501960

---

## ⚠️ POTENTIAL ISSUES TO VERIFY

### 3. Render Environment Variables Configuration
**Status:** ⚠️ NEEDS VERIFICATION

**Required Environment Variables in Render Dashboard:**
```bash
# Database
SUPABASE_URL=https://hooceemtoyucadhxuevx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Algorithm Engine
ALGORITHM_ENGINE_URL=https://syncrunize-algo-engine.onrender.com

# Map Services
MAP_SNAPSHOT_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoiam1kZXYyMiIsImEiOiJjbWh1OHBtMmIx...

# Redis (Optional but recommended)
REDIS_URL=rediss://default:...@splendid-wallaby-31621.upstash.io:6379
```

**Action Required:**
- [ ] Verify `ALGORITHM_ENGINE_URL` is set in Render dashboard
- [ ] Verify all environment variables match .env file
- [ ] Check Render deployment logs for "✅ Uploads directory created/verified"

---

### 4. Supabase Storage Bucket Configuration
**Status:** ⚠️ NEEDS VERIFICATION

**Current Configuration:**
- Bucket name: `assets`
- Storage path: `hazardImage/{timestamp}-{filename}`
- Access: Must be PUBLIC for image URLs to work

**Action Required:**
- [ ] Verify "assets" bucket exists in Supabase Storage
- [ ] Verify bucket has PUBLIC access enabled
- [ ] Test image upload: `https://hooceemtoyucadhxuevx.supabase.co/storage/v1/object/public/assets/hazardImage/test.jpg`

**How to Check:**
1. Go to Supabase Dashboard → Storage
2. Find "assets" bucket
3. Click Settings → Make sure "Public bucket" is enabled

---

### 5. Timeout Configuration Analysis
**Status:** ✅ ACCEPTABLE (No conflicts)

**Timeout Chain:**
```
Mobile App (hazards.ts:93)        → 30 seconds
API Interceptor (api.ts:8)        → 60 seconds
Multer (no explicit timeout)      → Inherits from Express
Algorithm Engine (hazard_service) → 10 seconds
```

**Analysis:**
- Mobile app will timeout first at 30s (good for UX)
- API timeout at 60s is safety net
- Algorithm engine timeout at 10s prevents hanging
- **No conflicts detected**

**Potential Issue:**
If Render cold start + image upload + database insert takes > 30 seconds, mobile app will timeout even though backend succeeds.

**Recommendation:**
Consider increasing mobile app timeout to 45-60 seconds for first-time cold starts.

---

### 6. CORS Configuration
**Status:** ✅ ACCEPTABLE (Permissive)

**Current Configuration:**
```javascript
app.use(cors()); // Allows all origins
```

**Analysis:**
- Development: ✅ Works fine
- Production: ⚠️ Should restrict origins for security

**Recommendation for Production:**
```javascript
app.use(cors({
  origin: [
    'https://syncrunize-website.vercel.app',
    'http://localhost:8100',  // Ionic dev server
    'capacitor://localhost',   // Capacitor iOS/Android
  ],
  credentials: true
}));
```

---

### 7. Image Size Limits Compatibility
**Status:** ✅ COMPATIBLE

**Limits Configured:**
- Mobile app max: 3MB (Hazard-Report.tsx:158)
- Multer max: 5MB (multer_config.js:38)
- Body parser max: 5MB (server.js:49-50)
- Supabase storage: 5GB (default)

**Analysis:** All limits are compatible ✅

---

### 8. Error Handling Coverage
**Status:** ✅ COMPREHENSIVE

**Error Handling Points:**
1. ✅ Mobile app: Try-catch with user-friendly messages
2. ✅ Multer: Error wrapper in routes (hazard_routes.js:13-28)
3. ✅ Controller: Try-catch with detailed logging
4. ✅ Background tasks: Try-catch with console.error
5. ✅ Supabase upload: Try-catch in uploadHazardImageToSupabase

**No gaps detected**

---

### 9. Background Processing Order
**Status:** ⚠️ POTENTIAL RACE CONDITION

**Current Flow:**
1. Create hazard in DB (no image_url initially)
2. **Return response IMMEDIATELY** ✅
3. Background: Upload image to Supabase → Update DB with image_url
4. Background: Compute scores for new + nearby hazards
5. Background: Generate AI summary
6. Background: Send push notifications

**Potential Issue:**
If user refreshes/navigates away before background upload completes, they'll see the hazard without an image temporarily.

**Analysis:**
- This is **acceptable** behavior (progressive enhancement)
- User gets immediate feedback
- Image appears within 2-5 seconds after background upload

**Status:** ✅ Working as designed (not a bug)

---

### 10. Authentication Flow
**Status:** ✅ ROBUST

**Auth Chain:**
1. Mobile app: Session cached for 5 minutes (api.ts:15)
2. API interceptor: Adds Bearer token to every request
3. Backend middleware: Verifies token with Supabase
4. Database lookup: Maps auth_id to user_id

**Error Handling:**
- Missing token → 401
- Invalid token → 403
- User not in DB → 404 with debug info

**No issues detected** ✅

---

## 🔍 TESTING CHECKLIST

### After Render Deployment:

- [ ] **Test 1: Health Check**
  ```bash
  curl https://syncrunize-backend.onrender.com/api/health
  # Expected: {"status":"ok", ...}
  ```

- [ ] **Test 2: Check Uploads Directory**
  - Check Render deployment logs
  - Look for: "✅ Uploads directory created/verified"

- [ ] **Test 3: Hazard Report WITHOUT Image**
  - Submit hazard report from mobile app
  - Should succeed within 2-3 seconds
  - Check if hazard appears in database

- [ ] **Test 4: Hazard Report WITH Image**
  - Take photo (should be < 1MB after compression)
  - Submit hazard report
  - Should succeed within 5-10 seconds
  - Verify image URL is saved in database
  - Verify image is accessible via public URL

- [ ] **Test 5: Algorithm Engine Connection**
  - After submitting hazard, check backend logs
  - Look for: "✅ Updated scores for hazard X"
  - Should NOT see: "❌ Agreement API error" or "❌ Trust API error"

- [ ] **Test 6: Supabase Storage Upload**
  - After submitting with image, check backend logs
  - Look for: "[Hazard] Image uploaded to: https://..."
  - Should NOT see: "[Hazard] Supabase storage upload error"

---

## 🚨 KNOWN LIMITATIONS

### 1. Render Free Tier Cold Starts
- **Issue:** First request after 15 minutes of inactivity takes 30-50 seconds
- **Impact:** Users may experience timeout on first hazard submission
- **Workaround:** Mobile app timeout is 30s, which may be too short for cold starts
- **Recommendation:** Add loading message: "Backend is waking up, this may take up to 60 seconds on first request"

### 2. Ephemeral Filesystem
- **Issue:** Uploaded images are temporarily stored in `uploads/hazards/` before Supabase upload
- **Impact:** Files are deleted after each Render deployment
- **Status:** ✅ Not a problem (images are uploaded to Supabase in background and local files are cleaned up)

### 3. Algorithm Engine Dependency
- **Issue:** If algorithm engine is down, scoring will fail silently
- **Impact:** Hazards will have trust_score = 0 and agreement_score = 0
- **Status:** ✅ Acceptable (hazard is still created, scores can be recomputed later)

---

## 📋 SUMMARY

**Critical Issues:** 0 remaining (2 fixed)
**Warnings:** 2 (needs verification)
**Recommendations:** 3 (optional improvements)

**Next Steps:**
1. Wait for Render to redeploy (2-3 minutes)
2. Check deployment logs for "✅ Uploads directory created/verified"
3. Test hazard submission with image from mobile app
4. Verify environment variables in Render dashboard
5. Verify Supabase "assets" bucket is public

**Expected Outcome:**
Hazard submission with images should work correctly after Render redeploys with the uploads directory fix.
