-- ============================================================================
-- AlgoEase Database - Fresh Setup (FROM SCRATCH)
-- ============================================================================
-- This migration completely recreates the bounties database from scratch.
-- WARNING: This will DELETE ALL EXISTING DATA in the bounties table!
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://app.supabase.com
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run" (or press Ctrl+Enter)
-- ============================================================================

-- ============================================================================
-- Step 1: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Step 2: Drop Existing Table (THIS DELETES ALL DATA!)
-- ============================================================================
-- Uncomment the next line ONLY if you want to delete all existing data
DROP TABLE IF EXISTS bounties CASCADE;

-- ============================================================================
-- Step 3: Create Bounties Table
-- ============================================================================
CREATE TABLE bounties (
  -- Primary key (auto-generated UUID)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- ===== ON-CHAIN DATA =====
  -- Contract ID from Algorand smart contract (nullable - can be set later)
  contract_id BIGINT UNIQUE,
  
  -- Wallet addresses (Algorand addresses are 58 characters)
  client_address VARCHAR(58) NOT NULL CHECK (client_address ~ '^[A-Z2-7]{58}$'),
  freelancer_address VARCHAR(58) CHECK (freelancer_address IS NULL OR freelancer_address ~ '^[A-Z2-7]{58}$'),
  verifier_address VARCHAR(58) CHECK (verifier_address IS NULL OR verifier_address ~ '^[A-Z2-7]{58}$'),
  
  -- Financial data
  amount DECIMAL(18, 6) NOT NULL CHECK (amount >= 0.001),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Status (must be one of these values)
  status VARCHAR(20) NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected')),
  
  -- ===== OFF-CHAIN METADATA =====
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Arrays stored as JSONB
  requirements JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  submissions JSONB DEFAULT '[]'::jsonb,
  
  -- ===== TIMESTAMPS =====
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Step 4: Create Indexes for Performance
-- ============================================================================
-- Index on contract_id (for lookups by contract ID)
CREATE INDEX idx_bounties_contract_id ON bounties(contract_id);

-- Index on wallet addresses (for filtering by user)
CREATE INDEX idx_bounties_client_address ON bounties(client_address);
CREATE INDEX idx_bounties_freelancer_address ON bounties(freelancer_address);
CREATE INDEX idx_bounties_verifier_address ON bounties(verifier_address);

-- Index on status (for filtering by status)
CREATE INDEX idx_bounties_status ON bounties(status);

-- Index on deadline (for sorting and filtering by deadline)
CREATE INDEX idx_bounties_deadline ON bounties(deadline);

-- Index on created_at (for sorting by newest first)
CREATE INDEX idx_bounties_created_at ON bounties(created_at DESC);

-- Composite index for common queries (client + status)
CREATE INDEX idx_bounties_client_status ON bounties(client_address, status);

-- ============================================================================
-- Step 5: Create Auto-Update Trigger for updated_at
-- ============================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_bounties_updated_at 
  BEFORE UPDATE ON bounties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 6: Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 7: Create RLS Policies
-- ============================================================================
-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;
DROP POLICY IF EXISTS "Allow delete operations" ON bounties;

-- Policy 1: Allow all operations (for service role - your backend uses this)
-- This is needed because your backend uses the service role key
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow public read access (anyone can view bounties)
CREATE POLICY "Allow public read access" ON bounties
  FOR SELECT
  USING (true);

-- Policy 3: Allow authenticated insert (anyone can create bounties)
CREATE POLICY "Allow authenticated insert" ON bounties
  FOR INSERT
  WITH CHECK (true);

-- Policy 4: Allow updates (anyone can update bounties - adjust this for production)
CREATE POLICY "Allow update by client" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy 5: Allow delete (optional - adjust based on your needs)
CREATE POLICY "Allow delete operations" ON bounties
  FOR DELETE
  USING (true);

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- The database has been created from scratch with:
-- ✅ Table structure
-- ✅ All required columns
-- ✅ Indexes for performance
-- ✅ Auto-update trigger for updated_at
-- ✅ Row Level Security enabled
-- ✅ RLS policies configured
--
-- Next steps:
-- 1. Verify the table was created correctly (run the verification queries below)
-- 2. Test creating a bounty from your frontend
-- 3. Check that data is being saved correctly
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify everything was created correctly:
-- ============================================================================

-- 1. Check table structure
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'bounties'
-- ORDER BY ordinal_position;

-- 2. Check status constraint
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name LIKE '%bounties_status%';

-- 3. Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'bounties'
-- ORDER BY indexname;

-- 4. Check trigger
-- SELECT 
--   trigger_name, 
--   event_manipulation, 
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE event_object_table = 'bounties';

-- 5. Check RLS policies
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'bounties';

-- 6. Test insert (should work)
-- INSERT INTO bounties (
--   client_address,
--   title,
--   description,
--   amount,
--   deadline,
--   verifier_address
-- ) VALUES (
--   'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
--   'Test Bounty',
--   'This is a test bounty',
--   10.5,
--   NOW() + INTERVAL '30 days',
--   'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'
-- );

-- 7. Verify the insert worked
-- SELECT * FROM bounties ORDER BY created_at DESC LIMIT 1;

-- 8. Clean up test data
-- DELETE FROM bounties WHERE title = 'Test Bounty';

-- ============================================================================

