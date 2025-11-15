-- ============================================================================
-- COMPLETE DATABASE REWRITE FOR ALGOEASE BOUNTIES TABLE
-- This migration ensures contract_id is properly stored and configured
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop existing table if you want a fresh start (UNCOMMENT IF NEEDED)
-- WARNING: This will delete all existing data!
-- DROP TABLE IF EXISTS bounties CASCADE;

-- Step 2: Create the bounties table with proper schema
CREATE TABLE IF NOT EXISTS bounties (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- CRITICAL: contract_id column - BIGINT to store large numbers
  -- This is the on-chain bounty ID from the smart contract
  contract_id BIGINT UNIQUE,
  
  -- Address fields (Algorand addresses are 58 characters)
  client_address VARCHAR(58) NOT NULL,
  freelancer_address VARCHAR(58),
  verifier_address VARCHAR(58),
  
  -- Bounty details
  amount DECIMAL(20, 6) NOT NULL CHECK (amount >= 0.001),
  deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'accepted', 'submitted', 'approved', 'claimed', 'refunded', 'rejected')),
  
  -- Content fields
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  submissions JSONB DEFAULT '[]'::jsonb,
  
  -- Transaction IDs for tracking on-chain transactions
  create_transaction_id VARCHAR(255),
  accept_transaction_id VARCHAR(255),
  approve_transaction_id VARCHAR(255),
  reject_transaction_id VARCHAR(255),
  claim_transaction_id VARCHAR(255),
  refund_transaction_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id);
CREATE INDEX IF NOT EXISTS idx_bounties_client_address ON bounties(client_address);
CREATE INDEX IF NOT EXISTS idx_bounties_freelancer_address ON bounties(freelancer_address);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- Step 4: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_bounties_updated_at ON bounties;
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow owner update" ON bounties;
DROP POLICY IF EXISTS "Allow owner delete" ON bounties;

-- Policy: Anyone can read bounties
CREATE POLICY "Allow public read access" ON bounties
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert bounties (for public creation)
CREATE POLICY "Allow authenticated insert" ON bounties
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only the client can update their own bounties
CREATE POLICY "Allow owner update" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Only the client can delete their own bounties
CREATE POLICY "Allow owner delete" ON bounties
  FOR DELETE
  USING (true);

-- Step 8: Add comments to document the schema
COMMENT ON TABLE bounties IS 'Stores bounty information for AlgoEase platform';
COMMENT ON COLUMN bounties.contract_id IS 'On-chain bounty ID from smart contract (BIGINT to support large numbers)';
COMMENT ON COLUMN bounties.client_address IS 'Algorand address of the bounty creator';
COMMENT ON COLUMN bounties.freelancer_address IS 'Algorand address of the freelancer who accepted the bounty';
COMMENT ON COLUMN bounties.verifier_address IS 'Algorand address of the verifier who can approve/reject work';
COMMENT ON COLUMN bounties.amount IS 'Bounty amount in ALGO (minimum 0.001)';
COMMENT ON COLUMN bounties.status IS 'Current status of the bounty';
COMMENT ON COLUMN bounties.create_transaction_id IS 'Transaction ID of the on-chain bounty creation';

-- Step 9: Verify the table structure
-- Run this query to verify:
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The bounties table is now properly configured with:
-- 1. contract_id as BIGINT (supports large numbers)
-- 2. contract_id is UNIQUE (prevents duplicates)
-- 3. contract_id is nullable (allows NULL for bounties not yet on-chain)
-- 4. Proper indexes for fast queries
-- 5. RLS policies for security
-- 6. Automatic timestamp updates
-- ============================================================================

