  -- Migration 004: Hazard Confirmations Table
  -- Description: Add hazard confirmations system allowing users to confirm hazards exist
  -- Date: 2025-11-30

  -- ============================================================================
  -- TABLE: hazard_confirmations
  -- ============================================================================
  -- Junction table for user confirmations of hazard reports
  -- Prevents duplicate confirmations via UNIQUE constraint

  CREATE TABLE IF NOT EXISTS hazard_confirmations (
    confirmation_id BIGSERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES hazard_reports(report_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    confirmed_at TIMESTAMP DEFAULT NOW() NOT NULL,

    -- Prevent duplicate confirmations from same user
    CONSTRAINT unique_user_hazard_confirmation UNIQUE(report_id, user_id)
  );

  -- ============================================================================
  -- INDEXES
  -- ============================================================================
  -- Optimize queries for fetching confirmations by report, user, and time

  CREATE INDEX idx_confirmations_report ON hazard_confirmations(report_id);
  CREATE INDEX idx_confirmations_user ON hazard_confirmations(user_id);
  CREATE INDEX idx_confirmations_time ON hazard_confirmations(confirmed_at DESC);

  -- ============================================================================
  -- TRIGGERS: Auto-update confirmation counts and timestamps
  -- ============================================================================

  -- Function: Increment confirmation count when new confirmation added
  CREATE OR REPLACE FUNCTION increment_confirmation_count()
  RETURNS TRIGGER AS $$
  BEGIN
    UPDATE hazard_reports
    SET
      confirmation_count = confirmation_count + 1,
      last_confirmed_at = NEW.confirmed_at,
      effective_reported_at = NEW.confirmed_at  -- Reset time decay timer
    WHERE report_id = NEW.report_id;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger: After INSERT on hazard_confirmations
  CREATE TRIGGER trigger_increment_confirmation
  AFTER INSERT ON hazard_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION increment_confirmation_count();

  -- Function: Decrement confirmation count when confirmation removed
  CREATE OR REPLACE FUNCTION decrement_confirmation_count()
  RETURNS TRIGGER AS $$
  DECLARE
    latest_confirmation TIMESTAMP;
  BEGIN
    -- Get the most recent confirmation time (if any remain)
    SELECT MAX(confirmed_at) INTO latest_confirmation
    FROM hazard_confirmations
    WHERE report_id = OLD.report_id;

    UPDATE hazard_reports
    SET
      confirmation_count = GREATEST(confirmation_count - 1, 0),
      last_confirmed_at = latest_confirmation,  -- NULL if no confirmations remain
      effective_reported_at = COALESCE(latest_confirmation, reported_at)  -- Fallback to original time
    WHERE report_id = OLD.report_id;

    RETURN OLD;
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger: After DELETE on hazard_confirmations
  CREATE TRIGGER trigger_decrement_confirmation
  AFTER DELETE ON hazard_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION decrement_confirmation_count();

  -- ============================================================================
  -- ROW LEVEL SECURITY (RLS)
  -- ============================================================================

  -- Enable RLS on hazard_confirmations table
  ALTER TABLE hazard_confirmations ENABLE ROW LEVEL SECURITY;

  -- Policy: Anyone can view confirmations (public data)
  CREATE POLICY "Anyone can view confirmations"
  ON hazard_confirmations FOR SELECT
  USING (true);

  -- Policy: Authenticated users can insert confirmations
  -- Note: Backend API validates user authentication and prevents duplicates via UNIQUE constraint
  CREATE POLICY "Authenticated users can insert confirmations"
  ON hazard_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (true);

  -- Policy: Authenticated users can delete confirmations
  -- Note: Backend API validates that users can only delete their own confirmations
  CREATE POLICY "Authenticated users can delete confirmations"
  ON hazard_confirmations FOR DELETE
  TO authenticated
  USING (true);

  -- ============================================================================
  -- COMMENTS
  -- ============================================================================

  COMMENT ON TABLE hazard_confirmations IS 'User confirmations of hazard reports - allows users to confirm hazards exist';
  COMMENT ON COLUMN hazard_confirmations.confirmation_id IS 'Primary key';
  COMMENT ON COLUMN hazard_confirmations.report_id IS 'Reference to hazard_reports table';
  COMMENT ON COLUMN hazard_confirmations.user_id IS 'Reference to users table';
  COMMENT ON COLUMN hazard_confirmations.confirmed_at IS 'Timestamp when user confirmed this hazard';
  COMMENT ON CONSTRAINT unique_user_hazard_confirmation ON hazard_confirmations IS 'Prevents duplicate confirmations from same user';
