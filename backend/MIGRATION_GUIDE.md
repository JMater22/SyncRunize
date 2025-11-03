# Safe Migration Guide

## 🔑 Service Role Key vs Anon Key

### Your Current Setup

**If using `SUPABASE_SERVICE_ROLE_KEY`:**
- ✅ RLS policies are **bypassed** (ignored)
- ✅ Full database access
- ✅ **This is what you're using now**

**If using `SUPABASE_ANON_KEY`:**
- ⚠️ RLS policies are **enforced**
- ⚠️ Limited access based on policies
- ⚠️ Will block requests if policies aren't set up

**Recommendation**: Keep using **service role key** for your Express backend API.

---

## 📋 Migration Steps (Safe Process)

### **Step 1: Run SAFE_MIGRATION.sql (Do This Now!)**

✅ **100% Safe** - No breaking changes

This adds:
- Performance indexes (20+)
- Auto-update triggers for `updated_at`
- RLS policies (ignored by service role)

```sql
-- In Supabase SQL Editor, run:
-- File: SAFE_MIGRATION.sql
```

**Impact**:
- ✅ Queries will be faster (10-100x for some queries)
- ✅ `updated_at` columns auto-update
- ✅ **No breaking changes to your API**

---

### **Step 2: Check for Bad Data (Optional but Recommended)**

Run this to see if you have any data issues:

```sql
-- In Supabase SQL Editor, run:
-- File: PRE_MIGRATION_CHECK.sql
```

**Look at the results:**
- If all `count = 0` → ✅ Safe to proceed
- If any `count > 0` → ⚠️ You have bad data

---

### **Step 3: Clean Up Bad Data (Only if Step 2 found issues)**

If you found issues, fix them:

```sql
-- In Supabase SQL Editor, run:
-- File: DATA_CLEANUP.sql
```

**Then run PRE_MIGRATION_CHECK.sql again to verify all counts are 0.**

---

### **Step 4: Run RISKY_MIGRATION.sql (After verification)**

⚠️ **Only run this AFTER Step 2 shows all counts = 0**

This adds:
- Foreign key constraints (data integrity)
- Unique constraints (prevent duplicates)
- Check constraints (data validation)

```sql
-- In Supabase SQL Editor, run:
-- File: RISKY_MIGRATION.sql
```

**What could go wrong:**
- ❌ Will fail if you have orphaned records
- ❌ Will fail if you have duplicates
- ❌ Will fail if you have invalid data

**If it fails**: Run `DATA_CLEANUP.sql` and try again.

---

## 🚀 Quick Start (If You Trust Your Data)

If you're confident your data is clean:

```sql
-- 1. Run safe changes (always works)
\i SAFE_MIGRATION.sql

-- 2. Run risky changes (might fail)
\i RISKY_MIGRATION.sql
```

If Step 2 fails:
```sql
-- 3. Check what's wrong
\i PRE_MIGRATION_CHECK.sql

-- 4. Fix the issues
\i DATA_CLEANUP.sql

-- 5. Try again
\i RISKY_MIGRATION.sql
```

---

## ⚠️ Will This Affect My API Requests?

### **SAFE_MIGRATION.sql**: ✅ NO

- Indexes: Only improve performance
- Triggers: Auto-update timestamps (good!)
- RLS: Ignored by service role key

**Your API will work exactly the same, just faster.**

---

### **RISKY_MIGRATION.sql**: ⚠️ MAYBE

**If applied successfully:**
- ✅ **No change** to existing functionality
- ✅ New data is validated automatically
- ✅ Can't insert bad data anymore (good!)

**If it fails during application:**
- ❌ The constraint that failed is **not applied**
- ✅ **Your API still works normally**
- ⚠️ You just don't get that protection yet

**After all constraints are applied:**
- Your API will **reject** bad data:
  - Can't like the same post twice
  - Can't create post for non-existent user
  - Can't insert invalid ages/coordinates

---

## 📊 What Each Script Does

| Script | Purpose | Safe? | Impact |
|--------|---------|-------|--------|
| `SAFE_MIGRATION.sql` | Indexes, triggers, RLS | ✅ YES | Faster queries, auto-timestamps |
| `PRE_MIGRATION_CHECK.sql` | Find bad data | ✅ YES | Read-only, no changes |
| `DATA_CLEANUP.sql` | Fix bad data | ⚠️ DELETES | Removes/fixes invalid records |
| `RISKY_MIGRATION.sql` | Constraints | ⚠️ CAN FAIL | Data integrity enforcement |

---

## 🔍 Example Scenario

### Scenario 1: Clean Database

```bash
# Step 1: Run safe migration
✅ 20 indexes created
✅ 3 triggers created
✅ RLS policies created

# Step 2: Check for issues
✅ All counts = 0 (no issues found)

# Step 3: Run risky migration
✅ All constraints applied successfully
```

**Result**: Everything works, database is now protected! 🎉

---

### Scenario 2: Database with Duplicate Likes

```bash
# Step 1: Run safe migration
✅ Success

# Step 2: Check for issues
⚠️ duplicate likes on posts: count = 5

# Step 3: Clean up data
DELETE FROM likes WHERE... (removed 5 duplicates)

# Step 4: Verify
✅ All counts = 0

# Step 5: Run risky migration
✅ All constraints applied successfully
```

**Result**: Cleaned up duplicates, constraints applied! 🎉

---

### Scenario 3: Database with Orphaned Posts

```bash
# Step 1: Run safe migration
✅ Success

# Step 2: Check for issues
⚠️ posts with invalid user_id: count = 12

# Step 3: Clean up data
DELETE FROM posts WHERE user_id not in users
(removed 12 orphaned posts)

# Step 4: Verify
✅ All counts = 0

# Step 5: Run risky migration
✅ All constraints applied successfully
```

**Result**: Removed orphaned records, constraints applied! 🎉

---

## 🎯 Recommendation for You

Since you're using **service role key**, here's my recommendation:

### **Phase 1: Do Now (Zero Risk)**

```sql
-- Run this in Supabase SQL Editor
\i SAFE_MIGRATION.sql
```

**This is 100% safe and will make your app faster.**

---

### **Phase 2: Do When Ready (Low Risk)**

1. Run pre-check: `PRE_MIGRATION_CHECK.sql`
2. If clean, run: `RISKY_MIGRATION.sql`
3. If issues, run: `DATA_CLEANUP.sql` then `RISKY_MIGRATION.sql`

**This adds data protection but requires checking first.**

---

## 🚨 What If Something Goes Wrong?

### If SAFE_MIGRATION.sql fails:
- **Unlikely** - this script is very safe
- If an index already exists, it will be skipped (no error)

### If RISKY_MIGRATION.sql fails:
- **The constraint that failed is NOT applied**
- **Your database stays as-is** (no harm done)
- Run `PRE_MIGRATION_CHECK.sql` to see what's wrong
- Fix with `DATA_CLEANUP.sql`
- Try again

### If DATA_CLEANUP.sql deletes too much:
- **Restore from backup** (make backup first!)
- Manually review what will be deleted before running

---

## 📞 Quick Reference

**I want better performance** → Run `SAFE_MIGRATION.sql` now

**I want data protection** → Run all 4 scripts in order

**I'm not sure** → Just run `SAFE_MIGRATION.sql` for now

**I want to be cautious** → Run `PRE_MIGRATION_CHECK.sql` first to see what you have

---

## ✅ Summary

**YES, you can copy and run SAFE_MIGRATION.sql with zero risk.**

**For RISKY_MIGRATION.sql, check your data first with PRE_MIGRATION_CHECK.sql.**

**Using service role key = RLS policies don't affect you.**

**All scripts are ready to copy-paste into Supabase SQL Editor.**

---

**Questions?**
- Check `SCHEMA_IMPROVEMENTS.md` for detailed explanations
- All SQL scripts are in this `/backend` folder
- Safe to run in production (after testing in dev!)
