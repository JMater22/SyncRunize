-- Migration: Add cached_address column to hazard_reports table
-- Purpose: Store human-readable addresses from reverse geocoding
-- Date: 2025-01-XX

-- Add cached_address column (nullable - existing hazards won't have addresses yet)
ALTER TABLE hazard_reports
ADD COLUMN IF NOT EXISTS cached_address TEXT NULL;

-- Add comment to document the column
COMMENT ON COLUMN hazard_reports.cached_address IS
  'Human-readable address from reverse geocoding (e.g., "123 Rizal Ave, Manila"). Populated automatically on hazard creation/update.';

-- Create index on cached_address for faster text searches (optional, useful if you want to search by address)
CREATE INDEX IF NOT EXISTS idx_hazard_reports_cached_address
  ON hazard_reports USING gin (to_tsvector('english', cached_address));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 007 complete: cached_address column added to hazard_reports';
END $$;
