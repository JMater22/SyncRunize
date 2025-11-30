-- Migration 006: Add deleted_at and status columns to hazard_reports
-- Description: Add columns needed for soft delete functionality
-- Date: 2025-11-30

-- ============================================================================
-- Add status column if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hazard_reports' AND column_name = 'status'
    ) THEN
        ALTER TABLE hazard_reports ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;
        COMMENT ON COLUMN hazard_reports.status IS 'Status of hazard report: active, deleted, resolved';
    END IF;
END $$;

-- ============================================================================
-- Add deleted_at column if it doesn't exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hazard_reports' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE hazard_reports ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
        COMMENT ON COLUMN hazard_reports.deleted_at IS 'Timestamp when hazard was soft-deleted';
    END IF;
END $$;

-- ============================================================================
-- Create index for better query performance on status
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_hazard_reports_status ON hazard_reports(status);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE hazard_reports IS 'User-reported hazards with soft delete support';
