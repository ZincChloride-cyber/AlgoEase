-- ============================================================================
-- Update Existing Bounties Table Migration for AlgoEase
-- Run this migration in your Supabase SQL Editor if the table already exists
-- ============================================================================
-- This migration updates an existing bounties table to:
-- 1. Make contract_id nullable (if it was NOT NULL)
-- 2. Add 'rejected' status to the status check constraint
-- 3. Ensure all indexes and triggers are in place
-- ============================================================================

-- ============================================================================
-- Step 1: Make contract_id nullable (if it was NOT NULL)
-- ============================================================================
-- Drop the existing NOT NULL constraint on contract_id (if it exists)
ALTER TABLE bounties ALTER COLUMN contract_id DROP NOT NULL;

-- ============================================================================
-- Step 2: Add 'rejected' status to status check constraint
-- ============================================================================
-- Drop the existing check constraint (if it exists)
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Add the new check constraint with 'rejected' status
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected'));

-- ============================================================================
-- Step 3: Ensure all indexes exist (create if they don't exist)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id);
CREATE INDEX IF NOT EXISTS idx_bounties_client_address ON bounties(client_address);
CREATE INDEX IF NOT EXISTS idx_bounties_freelancer_address ON bounties(freelancer_address);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- ============================================================================
-- Step 4: Ensure updated_at trigger exists
-- ============================================================================
-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at (if it doesn't exist)
DROP TRIGGER IF EXISTS update_bounties_updated_at ON bounties;
CREATE TRIGGER update_bounties_updated_at 
  BEFORE UPDATE ON bounties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 5: Ensure Row Level Security (RLS) is enabled
-- ============================================================================
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Ensure policies exist (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;

-- Create policy to allow all operations (for service role key - RLS is bypassed)
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public read access - allow anyone to read bounties
CREATE POLICY "Allow public read access" ON bounties
  FOR SELECT
  USING (true);

-- Allow authenticated insert - anyone can create bounties
CREATE POLICY "Allow authenticated insert" ON bounties
  FOR INSERT
  WITH CHECK (true);

-- Allow update by anyone (you can restrict this later based on your needs)
CREATE POLICY "Allow update by client" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Verify the migration by running:
-- 
-- 1. Check contract_id is nullable:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bounties' AND column_name = 'contract_id';
-- 
-- 2. Check the status constraint includes 'rejected':
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'bounties_status_check';
-- 
-- 3. Check all indexes exist:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'bounties';
-- 
-- 4. Check trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'bounties';
-- ============================================================================

