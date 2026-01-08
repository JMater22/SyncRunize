    # Migration 007: Add Cached Address to Hazard Reports

## What This Does
Adds a `cached_address` column to the `hazard_reports` table to store human-readable addresses from reverse geocoding (e.g., "123 Rizal Ave, Manila").

## Why We Need This
- **Better UX**: Users see "Rizal Avenue, Makati" instead of "14.5547, 121.0244"
- **Free with Mapbox**: We already have a Mapbox token, so reverse geocoding is free (100k requests/month)
- **Automatic**: Addresses are geocoded and cached when hazards are created or updated

## How to Run This Migration

### Option 1: Direct SQL (Recommended)
```bash
# Connect to your Supabase database
psql <your-supabase-connection-string>

# Run the migration
\i backend/sql/migrations/007_add_cached_address.sql
```

### Option 2: Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `007_add_cached_address.sql`
5. Click **Run**

### Option 3: Supabase CLI
```bash
supabase db push
```

## Verification
After running the migration, verify with:
```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hazard_reports'
AND column_name = 'cached_address';

-- Should return:
-- column_name     | data_type | is_nullable
-- cached_address  | text      | YES
```

## Backend Changes Already Made
✅ Created `geocoding_service.js` - Handles reverse geocoding via Mapbox API
✅ Updated `hazard_controller.js` - Geocodes on hazard creation and update
✅ Updated `hazard_model.js` - Includes `cached_address` in database operations

## Frontend Changes Already Made
✅ Updated all Hazard interfaces to include `cached_address?: string | null`
✅ Updated UI to display addresses with coordinates as fallback
✅ Tooltip shows exact coordinates on hover

## What Happens Next
1. **New hazards**: Automatically geocoded on creation
2. **Updated hazards**: Geocoded when coordinates change
3. **Existing hazards**: Will show coordinates until they're updated
4. **Display**: Frontend already shows addresses when available

## No Downtime
- Column is nullable, so existing hazards continue to work
- Frontend gracefully falls back to coordinates if address is null
- Geocoding failures don't block hazard creation

## Cost
- **FREE** with Mapbox free tier (100,000 requests/month)
- Average: ~3ms per geocode request
- Non-blocking: Hazard creation still completes even if geocoding fails
