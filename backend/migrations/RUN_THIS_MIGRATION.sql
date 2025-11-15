-- ============================================================================
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- This adds the 'submitted' status required for V5 contract
-- ============================================================================

-- Drop the existing check constraint
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Add the new check constraint with 'submitted' status (V5 contract)
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'submitted', 'approved', 'claimed', 'refunded', 'rejected'));

-- Verify the migration was successful
-- Run this query to check:
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'bounties'::regclass
AND conname = 'bounties_status_check';

-- Expected result should show: 
-- CHECK (status = ANY (ARRAY['open'::text, 'accepted'::text, 'submitted'::text, 'approved'::text, 'claimed'::text, 'refunded'::text, 'rejected'::text]))
