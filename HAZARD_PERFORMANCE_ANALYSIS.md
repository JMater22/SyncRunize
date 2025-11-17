# Hazard Reporting Performance Analysis

**Date:** 2025-11-17
**Issue:** Hazard reporting is slow or sometimes fails
**Services Tested:**
- Backend: ✅ 164ms response time
- Algorithm Engine: ✅ 153ms response time

---

## Complete Request Flow Analysis

### 1. **Mobile App → Backend** (Client-Side)

```typescript
// syncrunize-mobile-app/src/services/hazards.ts:91-94
const { data } = await api.post('/hazards', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000, // 30-second timeout
});
```

**Potential Bottlenecks:**
- ⚠️ **Image Upload:** Mobile photos can be 500KB-3MB
- ⚠️ **Network Speed:** Cellular/WiFi upload speed varies (100KB/s - 5MB/s)
- ⚠️ **Session Cache:** Auth token fetch from localStorage (fixed with caching)

**Estimated Time:**
| Component | Time | Notes |
|-----------|------|-------|
| Auth token fetch | 10-50ms | Cached (was 1-5s before fix) |
| FormData preparation | 10-20ms | |
| Network upload (500KB image) | 2-10s | **SLOWEST PART** (depends on connection) |
| Backend processing | 0.5-2s | See below |
| **TOTAL** | **2.5-12s** | Most time is network upload |

---

### 2. **Backend Processing** (Server-Side)

#### Request Pipeline:
```
Authenticate → Multer (image processing) → Create Hazard → Return Response
```

#### 2.1 Authentication Middleware
```javascript
// backend/utils/auth_middleware.js:60-103
```

**Operations:**
1. Extract Bearer token from headers (< 1ms)
2. Verify token with Supabase API (100-300ms)
3. Query users table by auth_id (50-150ms)

**Estimated Time:** 150-450ms

---

#### 2.2 Multer Image Processing
```javascript
// backend/routes/hazard_routes.js:15
uploadHazardImage.single("image")
```

**Operations:**
1. Parse multipart/form-data body
2. Extract image file from request
3. Save to `uploads/hazards/` directory
4. Validate file size (max 5MB)

**Potential Issues:**
- ❌ **Directory doesn't exist** → FIXED (fs.mkdirSync on startup)
- ⚠️ **Slow disk I/O** on Render's servers
- ⚠️ **Large file parsing** (3MB+ images)

**Estimated Time:** 50-500ms (depends on image size)

---

#### 2.3 Database Insert
```javascript
// backend/models/hazard_model.js:24-40
await supabase.from("hazard_reports").insert([{...}]).select().single();
```

**Operations:**
1. Insert into hazard_reports table
2. Return inserted row with .select().single()

**Potential Issues:**
- ⚠️ **Supabase connection latency** (US East → varies by region)
- ⚠️ **Database triggers** (if any PostgREST functions run)
- ⚠️ **Indexes being updated** (lat/lng spatial indexes)

**Estimated Time:** 100-300ms

---

#### 2.4 Response Sent
```javascript
// backend/controllers/hazard_controller.js:60-64
res.status(201).json({
  message: "✅ Hazard created successfully",
  hazard: newHazard,
  ai_summary: null,
});
```

**Time:** < 5ms

---

### **Backend Total Time:** 300-1255ms

**Breakdown:**
| Step | Time | Blocking? |
|------|------|-----------|
| Authentication | 150-450ms | ✅ Yes |
| Multer processing | 50-500ms | ✅ Yes |
| Database insert | 100-300ms | ✅ Yes |
| Response sent | < 5ms | ✅ Yes |
| **TOTAL** | **300-1255ms** | |

**Background operations (non-blocking):**
- Image upload to Supabase: 500-2000ms
- Find nearby hazards: 100-500ms
- Compute scores: 2-10s (depends on # of nearby hazards)
- AI summary: 1-3s
- Push notifications: 500-2000ms

---

### 3. **Background Processing Issues**

#### 3.1 Score Computation (Potential Issue)
```javascript
// backend/controllers/hazard_controller.js:69-124
const allHazards = [...neighbors, newHazard];
const updatePromises = allHazards.map(async (hazard) => {
  // For EACH hazard:
  const hazardNeighbors = await Hazard.findHazardsNearLocation(...); // DB query
  const [agreementResult, trustResult] = await Promise.allSettled([
    computeAgreement(hazard, hazardNeighbors),  // API call to algo engine
    computeTrust([...hazardNeighbors, hazard])  // API call to algo engine
  ]);
  await Hazard.modifyHazard(hazard.report_id, {...}); // DB update
});
```

**Problem:** If there are 10 nearby hazards:
- 10 database queries to find neighbors
- 20 API calls to algorithm engine (agreement + trust for each)
- 10 database updates

**Total Time:** 2-10 seconds (non-blocking, but heavy load)

**Impact:**
- ⚠️ **Database connection pool exhaustion** (if many concurrent reports)
- ⚠️ **Algorithm engine rate limiting** (20 requests at once)
- ⚠️ **Backend CPU/memory spike**

---

## Identified Performance Issues

### 🔴 **Critical Issues**

#### 1. **Network Upload Speed** (2-10 seconds)
**Symptom:** Hazard submission slow even without image
**Cause:** Mobile network upload speed varies greatly
**Impact:** User perceives app as slow

**Solutions:**
- ✅ **Already implemented:** Image compression (quality 50%, max 1024px)
- ✅ **Already implemented:** 3MB size limit
- 🔧 **Recommended:** Add progress bar for uploads > 500KB
- 🔧 **Recommended:** Compress images further (quality 40%, max 800px)

---

#### 2. **Cold Start Delays** (Render Free Tier)
**Symptom:** First request after 15 min takes 30-60 seconds
**Cause:** Render spins down free tier services after inactivity
**Impact:** User timeout (mobile app has 30s timeout)

**Solutions:**
- ⚠️ **Keep backend warm:** Ping health endpoint every 10 minutes
- ⚠️ **Increase mobile timeout:** 30s → 60s for first request
- 🔧 **Better UX:** Show "Waking up backend..." message

---

#### 3. **Excessive Database Queries** (Background)
**Symptom:** Backend CPU/memory spikes during scoring
**Cause:** N+1 query problem (10 hazards = 10 DB queries)
**Impact:** Slower responses for concurrent users

**Current Code:**
```javascript
// ❌ PROBLEM: Queries neighbors for EACH hazard separately
const updatePromises = allHazards.map(async (hazard) => {
  const hazardNeighbors = await Hazard.findHazardsNearLocation(...); // Repeated query
});
```

**Optimization:**
```javascript
// ✅ BETTER: Query all neighbors ONCE, reuse for all hazards
const allNeighbors = await Hazard.findHazardsNearLocation(...);
const updatePromises = allHazards.map(async (hazard) => {
  const hazardNeighbors = allNeighbors.filter(n =>
    calculateDistance(hazard.lat, hazard.lng, n.lat, n.lng) <= 0.3
  );
});
```

**Time Saved:** 100-500ms per hazard (900ms-4.5s total for 10 hazards)

---

### ⚠️ **Warning Issues**

#### 4. **Multer Disk I/O** (50-500ms)
**Symptom:** Variability in response times
**Cause:** Render's disk I/O speed varies
**Impact:** Occasional slow uploads

**Solution:**
- 🔧 **Skip disk save:** Use multer memory storage, upload directly to Supabase

---

#### 5. **Supabase Connection Latency** (100-300ms)
**Symptom:** Consistent 200-300ms overhead
**Cause:** Distance from Supabase servers
**Impact:** Can't be avoided with current setup

**Solution:**
- ℹ️ **Accept it:** This is normal for API calls
- 🔧 **Consider:** Connection pooling (already handled by Supabase client)

---

## Performance Optimization Recommendations

### **Priority 1: Quick Wins** (< 30 min implementation)

#### 1.1 Optimize Background Scoring Queries
**File:** `backend/controllers/hazard_controller.js:69-124`

**Change:**
```javascript
// BEFORE (slow):
const allHazards = [...neighbors, newHazard];
const updatePromises = allHazards.map(async (hazard) => {
  const hazardNeighbors = await Hazard.findHazardsNearLocation(...); // N queries
});

// AFTER (fast):
const allNeighbors = await Hazard.findHazardsNearLocation(
  newHazard.lat, newHazard.lng, 0.5 // Slightly larger radius to include all
);
const allHazards = [...allNeighbors, newHazard];

const updatePromises = allHazards.map(async (hazard) => {
  // Filter from pre-fetched neighbors instead of querying
  const hazardNeighbors = allNeighbors.filter(neighbor => {
    const distance = calculateDistance(hazard.lat, hazard.lng, neighbor.lat, neighbor.lng);
    return distance <= 0.3 && neighbor.report_id !== hazard.report_id;
  });

  // Rest of scoring logic...
});
```

**Impact:** Reduces 10 DB queries → 1 DB query (saves 900ms-4.5s)

---

#### 1.2 Add Upload Progress Feedback
**File:** `syncrunize-mobile-app/src/pages/Hazard-Report.tsx:214`

**Change:**
```typescript
// Add progress tracking
const { data } = await api.post('/hazards', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 60000, // Increase to 60s for cold starts
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    console.log(`Upload progress: ${percentCompleted}%`);
    // Update UI with progress bar
  }
});
```

**Impact:** Better UX, user knows something is happening

---

### **Priority 2: Medium Improvements** (1-2 hours)

#### 2.1 Use Multer Memory Storage
**File:** `backend/config/multer_config.js`

**Change:**
```javascript
// BEFORE: Disk storage (slow)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/hazards/'),
  filename: (req, file, cb) => cb(null, `hazard_${Date.now()}.jpg`)
});

// AFTER: Memory storage (fast)
const storage = multer.memoryStorage();
```

**Also update:** `backend/controllers/hazard_controller.js:14`
```javascript
// BEFORE:
const buffer = await fs.promises.readFile(file.path);

// AFTER:
const buffer = file.buffer; // Already in memory
```

**Impact:** Saves 50-200ms disk I/O time

---

#### 2.2 Add Backend Warming Service
**File:** Create `backend/utils/keep_warm.js`

```javascript
import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'https://syncrunize-backend.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const startKeepWarm = () => {
  setInterval(async () => {
    try {
      await fetch(`${BACKEND_URL}/api/health`);
      console.log('[KeepWarm] Pinged backend to prevent cold start');
    } catch (err) {
      console.error('[KeepWarm] Ping failed:', err.message);
    }
  }, PING_INTERVAL);
};
```

**Impact:** Prevents 30-60s cold start delays

---

### **Priority 3: Major Refactoring** (4+ hours)

#### 3.1 Batch Score Updates
Instead of updating each hazard individually, batch updates:

```javascript
// Collect all updates
const updates = await Promise.all(updatePromises);

// Batch update in single query
await supabase
  .from('hazard_reports')
  .upsert(updates.map(u => ({
    report_id: u.report_id,
    agreement_score: u.agreement,
    trust_score: u.trust
  })));
```

**Impact:** Reduces 10 DB updates → 1 batch update

---

## Current Performance Summary

| Scenario | Time | Bottleneck |
|----------|------|------------|
| **Best case** (no image, warm backend) | 0.5-1s | Database insert |
| **Normal** (500KB image, warm backend) | 3-5s | Network upload |
| **Worst case** (3MB image, cold start) | 35-65s | Cold start + upload |
| **Timeout** (> 30s) | FAIL | Mobile app timeout |

---

## Recommended Action Plan

### Immediate (Today):
1. ✅ Verify `.env.production` has correct Supabase key
2. ✅ Add `FIREBASE_SERVICE_ACCOUNT_JSON` to Render
3. 🔧 Rebuild mobile APK with correct env vars
4. 🔧 Test hazard submission with 500KB image

### This Week:
1. Optimize background scoring queries (Priority 1.1)
2. Add upload progress feedback (Priority 1.2)
3. Increase mobile timeout to 60s
4. Add "Waking up backend..." message for first request

### Next Week:
1. Switch to multer memory storage (Priority 2.1)
2. Implement keep-warm service (Priority 2.2)
3. Add performance monitoring/logging
4. Consider batch score updates (Priority 3.1)

---

## Testing Checklist

After implementing optimizations:

- [ ] Test hazard submission WITHOUT image (should be < 1s)
- [ ] Test hazard submission WITH 500KB image (should be 3-5s)
- [ ] Test after 15min inactivity (cold start - show warming message)
- [ ] Test with slow 3G network (should show progress)
- [ ] Test with 10 nearby hazards (check backend CPU/memory)
- [ ] Verify background scoring completes (check logs)
- [ ] Verify images appear in Supabase storage
- [ ] Verify push notifications are sent

---

## Conclusion

**Root Causes:**
1. 🔴 Network upload speed (2-10s) - **CANNOT AVOID**
2. 🔴 Render cold starts (30-60s) - **CAN MITIGATE**
3. ⚠️ Inefficient background queries - **CAN OPTIMIZE**

**Expected Improvement:**
- Current: 3-5s (normal), 35-65s (cold start)
- Optimized: 2-3s (normal), 3-5s (no cold starts)

**User Experience:**
- Add progress indicators
- Show warming message for cold starts
- Increase timeout to handle slow networks
