-- Combined migration file for AlgoEase bounties table
-- Run this in Supabase SQL Editor
-- This migration includes:
-- 1. Making contract_id nullable
-- 2. Adding 'rejected' status to the status check constraint

-- ============================================================================
-- Migration 1: Make contract_id nullable
-- ============================================================================
-- Drop the existing NOT NULL constraint on contract_id (if it exists)
ALTER TABLE bounties ALTER COLUMN contract_id DROP NOT NULL;

-- ============================================================================
-- Migration 2: Add 'rejected' status to status check constraint
-- ============================================================================
-- Drop the existing check constraint (if it exists)
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Add the new check constraint with 'rejected' status
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected'));

-- Verify the migration
-- You can run this query to check the table structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'bounties'
-- ORDER BY ordinal_position;

