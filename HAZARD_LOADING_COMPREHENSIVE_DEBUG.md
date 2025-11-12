# Hazard Loading - Comprehensive Debug Guide

## 🔍 DIAGNOSIS CHECKLIST

Run through EACH of these checks to find the exact issue:

---

## ✅ CHECK #1: Is Backend Running?

```bash
curl http://localhost:5000/api/health
```

**Expected:** `{"status":"healthy"}` or similar
**If fails:** Backend is not running - start it with `cd backend && node server.js`

---

## ✅ CHECK #2: Is Algorithm Engine Running?

```bash
curl http://127.0.0.1:8000/
```

**Expected:** `{"message":"Algorithm microservice running!"}`
**If fails:** Start algorithm engine

---

## ✅ CHECK #3: Check Browser Console (CRITICAL)

Open DevTools (F12) → Console tab → Submit hazard

**Look for:**
1. **Network errors** - "Failed to fetch", "CORS", "ERR_CONNECTION_REFUSED"
2. **Timeout errors** - "timeout of 30000ms exceeded"
3. **400/500 errors** - Check response body for exact error message
4. **Multer errors** - "Image file too large", "File upload error"

**Common Issues:**
- `ERR_FILE_NOT_FOUND` → Blob URL issue (not the main problem)
- `400 Bad Request` → Check response JSON for error details
- `500 Internal Server Error` → Backend crash (check backend console)
- `Network request failed` → Backend not running or wrong URL

---

## ✅ CHECK #4: Check Backend Console

**While submitting hazard, watch for:**

```
✅ GOOD:
[Hazard] ✅ Scores updated for hazard 123
[Hazard] Image uploaded to: https://...
[Hazard] ✅ Image uploaded for hazard 123

❌ BAD:
[Hazard] Supabase storage upload error: ...
Agreement error: ...
Trust error: ...
❌ Failed to create hazard: ...
```

---

## ✅ CHECK #5: Test API Endpoint Directly

```bash
# Get your auth token from browser (DevTools → Application → Local Storage)
TOKEN="your_token_here"

# Test hazard creation WITHOUT image
curl -X POST http://localhost:5000/api/hazards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Hazard",
    "incident_type": "pothole",
    "description": "Test description",
    "lat": 15.5,
    "lng": 120.5,
    "severity_weight": 0.5
  }' \
  --max-time 5
```

**Expected:** Response in < 2 seconds with hazard data
**If hangs:** Issue is in backend, not frontend

---

## ✅ CHECK #6: Check Supabase Connection

**Backend console should show on startup:**
```
[Supabase] Initializing client with ANON key
```

**If you see Supabase errors:**
- Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Test Supabase connection:
  ```bash
  curl "YOUR_SUPABASE_URL/rest/v1/hazard_reports?select=*&limit=1" \
    -H "apikey: YOUR_ANON_KEY"
  ```

---

## ✅ CHECK #7: Check Image Upload (If using image)

**In browser console after submit:**
```javascript
// Check if image size is reasonable
console.log('Image size:', photoDataUrl.length * 0.75 / (1024 * 1024), 'MB');
```

**If > 3MB:** Image validation should prevent this
**If 0MB:** Image capture failed

---

## ✅ CHECK #8: Check Database Schema

**Verify hazard_reports table has these columns:**
- `report_id` (primary key, auto-increment)
- `user_id` (integer, not null)
- `title` (text)
- `incident_type` (text)
- `description` (text)
- `lat` (numeric/float)
- `lng` (numeric/float)
- `severity_weight` (numeric/float, default 0)
- `trust_score` (numeric/float, default 0)
- `agreement_score` (numeric/float, default 0)
- `status` (text, default 'active')
- `image_url` (text, nullable)
- `reported_at` (timestamp, default NOW())

**Missing `reported_at`?** Algorithm engine needs this!

---

## 🚨 MOST LIKELY ISSUES

### Issue #1: reported_at Field Missing/Null

**Symptom:** Backend calls algorithm engine, engine crashes or returns error

**Check:** In Supabase, verify `reported_at` column exists and has default value `NOW()`

**Fix:** Add default in Supabase:
```sql
ALTER TABLE hazard_reports
ALTER COLUMN reported_at SET DEFAULT NOW();
```

---

### Issue #2: Frontend Timeout (30s)

**Symptom:** Request hangs for exactly 30 seconds, then fails

**Cause:** Backend is taking > 30 seconds (shouldn't happen with our fixes)

**Check backend console for:**
- Algorithm engine timeout errors
- Supabase upload errors
- Database connection issues

---

### Issue #3: CORS Issue

**Symptom:** Browser console shows CORS error

**Fix:** Check `backend/server.js` has:
```javascript
app.use(cors({
  origin: '*', // or specific origin
  credentials: true
}));
```

---

### Issue #4: Multer Upload Path

**Symptom:** Error "ENOENT: no such file or directory, open '/uploads/hazards/...'"

**Fix:** Create uploads directory:
```bash
cd backend
mkdir -p uploads/hazards
```

---

### Issue #5: Supabase Bucket Doesn't Exist

**Symptom:** "Storage bucket not found" error

**Check:** In Supabase → Storage → Buckets
- Bucket named `assets` exists
- Bucket is PUBLIC
- Folder `hazardImage` exists (or will be created automatically)

**Create bucket if missing:**
1. Supabase Dashboard → Storage → New Bucket
2. Name: `assets`
3. Public: YES
4. Save

---

### Issue #6: Algorithm Engine Startup Not Complete

**Symptom:** First hazard submission fails/slow, subsequent ones work

**Check:** Algorithm engine console on startup should show:
```
Graph ready: XXXX nodes, YYYY edges
```

**If still loading:** Wait for "Graph ready" message before testing

---

## 🔧 EMERGENCY FIXES

### Quick Fix #1: Bypass Algorithm Completely (TESTING ONLY)

Edit `backend/controllers/hazard_controller.js` line 75-78:

```javascript
// ⚠️ TEMPORARY: Comment out algorithm calls for testing
const [agreementResult, trustResult] = await Promise.allSettled([
  // computeAgreement(newHazard, neighbors),  // ← Comment out
  // computeTrust([...neighbors, newHazard])   // ← Comment out
  Promise.resolve(0),  // Return 0 immediately
  Promise.resolve(0)   // Return 0 immediately
]);
```

**Test:** Does hazard submit instantly now?
- **YES** → Problem is in algorithm engine
- **NO** → Problem is elsewhere (database, Supabase upload, etc.)

---

### Quick Fix #2: Bypass Image Upload (TESTING ONLY)

Edit `backend/controllers/hazard_controller.js` line 105:

```javascript
// ⚠️ TEMPORARY: Skip image upload for testing
if (false && fileToUpload) {  // ← Changed from: if (fileToUpload)
```

**Test:** Does hazard with image submit instantly now?
- **YES** → Problem is in image upload to Supabase
- **NO** → Problem is not image-related

---

## 📊 EXPECTED TIMINGS

| Operation | Expected Time | Max Acceptable |
|-----------|---------------|----------------|
| Database insert | 100-500ms | 1s |
| Find neighbors | 50-200ms | 500ms |
| Algorithm scoring (background) | 200ms-2s | 10s (with timeout) |
| Image upload (background) | 2-10s | 30s |
| **Total user wait** | **< 1 second** | **2 seconds** |

---

## 🎯 STEP-BY-STEP DEBUG PROCESS

### Step 1: Reproduce the Issue
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit hazard report
4. Watch which request hangs

### Step 2: Identify the Hanging Request
- Is it the POST `/api/hazards` request? → Backend issue
- Is it stuck on "Pending"? → Backend not responding
- Does it return 400/500? → Check response body for error

### Step 3: Check Backend Logs
- Look for last log message before hang
- Check for errors, exceptions, or timeouts

### Step 4: Isolate the Problem
- Try without image → If works: Image upload issue
- Try with Quick Fix #1 → If works: Algorithm engine issue
- Try with Quick Fix #2 → If works: Supabase upload issue

### Step 5: Apply Targeted Fix
Based on isolation results

---

## 🔍 DETAILED INSPECTION COMMANDS

### Check backend is receiving request:
```bash
# In backend/server.js, add logging before createHazard:
console.log('📥 Received hazard creation request');
```

### Check if reaching algorithm engine:
```bash
# Watch algorithm engine logs
# Should see requests when hazard submitted
```

### Check database connection:
```bash
# In backend, add before hazard creation:
const { data } = await supabase.from('hazard_reports').select('*').limit(1);
console.log('✅ Database connected:', !!data);
```

---

## ✅ FINAL VERIFICATION

After fixing, verify ALL of these work:

1. ✅ Hazard WITHOUT image submits in < 1s
2. ✅ Hazard WITH image submits in < 2s
3. ✅ Image appears in Supabase Storage `assets/hazardImage/`
4. ✅ Image URL saved in database `hazard_reports.image_url`
5. ✅ Image displays in hazard detail modal
6. ✅ Backend console shows scores computed in background
7. ✅ No errors in browser console
8. ✅ No errors in backend console

---

## 📞 REPORT BACK WITH:

1. **Browser console errors** (exact error message)
2. **Backend console logs** (what you see when submitting)
3. **Which check failed** (from checks #1-#8 above)
4. **Network tab status** (pending, 400, 500, timeout?)
5. **Timing** (how long until it fails/succeeds)

This will help pinpoint the EXACT issue!
