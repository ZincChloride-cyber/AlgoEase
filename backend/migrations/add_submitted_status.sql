-- Migration: Add 'submitted' status to bounties table
-- This migration adds the 'submitted' status to the bounties_status_check constraint
-- Required for V5 contract which includes a submitted state between accepted and approved

-- Step 1: Drop the existing check constraint
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Step 2: Add the new check constraint with 'submitted' status
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'submitted', 'approved', 'claimed', 'refunded', 'rejected'));

-- Verification query (run separately to verify):
-- SELECT conname, pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'bounties'::regclass
-- AND conname = 'bounties_status_check';

