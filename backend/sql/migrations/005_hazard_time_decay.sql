-- Migration 005: Hazard Time Decay Columns
-- Description: Add columns to support time decay system and confirmation tracking
-- Date: 2025-11-30

-- ============================================================================
-- ADD COLUMNS to hazard_reports table
-- ============================================================================

-- confirmation_count: Track number of users who confirmed this hazard
ALTER TABLE hazard_reports
ADD COLUMN IF NOT EXISTS confirmation_count INTEGER DEFAULT 0 NOT NULL;

-- last_confirmed_at: Timestamp of most recent confirmation (NULL if no confirmations)
ALTER TABLE hazard_reports
ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMP DEFAULT NULL;

-- effective_reported_at: Used for time decay calculation
-- Starts as reported_at, gets updated to last_confirmed_at when confirmed
-- This allows confirmations to "refresh" the hazard and reset decay timer
ALTER TABLE hazard_reports
ADD COLUMN IF NOT EXISTS effective_reported_at TIMESTAMP DEFAULT NULL;

-- ============================================================================
-- DATA MIGRATION: Populate effective_reported_at for existing rows
-- ============================================================================

-- Set effective_reported_at to reported_at for all existing hazards
-- This ensures existing hazards start decaying from their original report time
UPDATE hazard_reports
SET effective_reported_at = reported_at
WHERE effective_reported_at IS NULL;

-- Make effective_reported_at NOT NULL after populating existing data
ALTER TABLE hazard_reports
ALTER COLUMN effective_reported_at SET NOT NULL;

-- Set default for future inserts
ALTER TABLE hazard_reports
ALTER COLUMN effective_reported_at SET DEFAULT NOW();

-- ============================================================================
-- TRIGGER: Auto-populate effective_reported_at on INSERT
-- ============================================================================

-- Function: Set effective_reported_at to reported_at for new hazards
CREATE OR REPLACE FUNCTION set_effective_reported_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If effective_reported_at is not provided, use reported_at
  IF NEW.effective_reported_at IS NULL THEN
    NEW.effective_reported_at := NEW.reported_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Before INSERT on hazard_reports
CREATE TRIGGER trigger_set_effective_reported_at
BEFORE INSERT ON hazard_reports
FOR EACH ROW
EXECUTE FUNCTION set_effective_reported_at();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Optimize queries that filter/sort by effective_reported_at (time decay queries)
CREATE INDEX idx_hazards_effective_reported ON hazard_reports(effective_reported_at DESC);

-- Optimize queries that filter by confirmation_count
CREATE INDEX idx_hazards_confirmation_count ON hazard_reports(confirmation_count);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN hazard_reports.confirmation_count IS 'Number of users who confirmed this hazard exists';
COMMENT ON COLUMN hazard_reports.last_confirmed_at IS 'Timestamp of most recent confirmation (NULL if no confirmations)';
COMMENT ON COLUMN hazard_reports.effective_reported_at IS 'Timestamp used for time decay calculation - starts as reported_at, updates to last_confirmed_at when confirmed';
