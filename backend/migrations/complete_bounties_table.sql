-- ============================================================================
-- AlgoEase: Complete Bounties Table Schema
-- ============================================================================
-- Purpose: Create/update the bounties table with all required columns
-- Run this migration in your Supabase SQL Editor
-- ============================================================================
-- This is a complete migration that includes:
-- 1. All core bounty fields
-- 2. Transaction ID tracking columns
-- 3. Indexes for performance
-- 4. Automatic timestamp triggers
-- 5. Row Level Security (RLS) policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Create bounties table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bounties (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- On-chain blockchain data
  contract_id BIGINT UNIQUE,  -- Smart contract bounty ID (nullable until created on-chain)
  client_address VARCHAR(58) NOT NULL CHECK (client_address ~ '^[A-Z2-7]{58}$'),
  freelancer_address VARCHAR(58) CHECK (freelancer_address IS NULL OR freelancer_address ~ '^[A-Z2-7]{58}$'),
  verifier_address VARCHAR(58) CHECK (verifier_address IS NULL OR verifier_address ~ '^[A-Z2-7]{58}$'),
  amount DECIMAL(18, 6) NOT NULL CHECK (amount >= 0.001),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected')),
  
  -- Transaction IDs for tracking on-chain transactions
  accept_transaction_id VARCHAR(64) NULL,
  approve_transaction_id VARCHAR(64) NULL,
  reject_transaction_id VARCHAR(64) NULL,
  claim_transaction_id VARCHAR(64) NULL,
  refund_transaction_id VARCHAR(64) NULL,
  
  -- Off-chain metadata
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  submissions JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Ensure contract_id is nullable (in case table already exists)
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'contract_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE bounties ALTER COLUMN contract_id DROP NOT NULL;
        RAISE NOTICE 'Made contract_id nullable';
    END IF;
END $$;

-- ============================================================================
-- Update status constraint to include all valid statuses
-- ============================================================================
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected'));

-- ============================================================================
-- Add transaction_id columns if they don't exist (for existing tables)
-- ============================================================================
DO $$ 
BEGIN
    -- Accept transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'accept_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN accept_transaction_id VARCHAR(64) NULL;
    END IF;

    -- Approve transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'approve_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN approve_transaction_id VARCHAR(64) NULL;
    END IF;

    -- Reject transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'reject_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN reject_transaction_id VARCHAR(64) NULL;
    END IF;

    -- Claim transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'claim_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN claim_transaction_id VARCHAR(64) NULL;
    END IF;

    -- Refund transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'refund_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN refund_transaction_id VARCHAR(64) NULL;
    END IF;
END $$;

-- ============================================================================
-- Create indexes for better query performance
-- ============================================================================
-- Core indexes
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounties_client_address ON bounties(client_address);
CREATE INDEX IF NOT EXISTS idx_bounties_freelancer_address ON bounties(freelancer_address) WHERE freelancer_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounties_verifier_address ON bounties(verifier_address) WHERE verifier_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- Transaction ID indexes (partial indexes for non-null values)
CREATE INDEX IF NOT EXISTS idx_bounties_accept_transaction_id 
ON bounties(accept_transaction_id) WHERE accept_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_approve_transaction_id 
ON bounties(approve_transaction_id) WHERE approve_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_reject_transaction_id 
ON bounties(reject_transaction_id) WHERE reject_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_claim_transaction_id 
ON bounties(claim_transaction_id) WHERE claim_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_refund_transaction_id 
ON bounties(refund_transaction_id) WHERE refund_transaction_id IS NOT NULL;

-- ============================================================================
-- Create function to automatically update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create trigger to automatically update updated_at on row updates
-- ============================================================================
DROP TRIGGER IF EXISTS update_bounties_updated_at ON bounties;
CREATE TRIGGER update_bounties_updated_at 
  BEFORE UPDATE ON bounties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create RLS policies
-- ============================================================================
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;
DROP POLICY IF EXISTS "Allow public read and insert" ON bounties;

-- Policy: Allow all operations for service role (backend uses service role key)
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Public read access - anyone can read bounties
CREATE POLICY "Allow public read access" ON bounties
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated insert - anyone can create bounties
CREATE POLICY "Allow authenticated insert" ON bounties
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update by anyone (backend handles authorization)
CREATE POLICY "Allow update by client" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Add column comments for documentation
-- ============================================================================
COMMENT ON TABLE bounties IS 'AlgoEase bounties table - stores both on-chain and off-chain bounty data';
COMMENT ON COLUMN bounties.contract_id IS 'Smart contract bounty ID (bigint) - set after on-chain creation';
COMMENT ON COLUMN bounties.accept_transaction_id IS 'Transaction ID when freelancer accepts the bounty';
COMMENT ON COLUMN bounties.approve_transaction_id IS 'Transaction ID when verifier approves work (funds transfer to freelancer)';
COMMENT ON COLUMN bounties.reject_transaction_id IS 'Transaction ID when work is rejected (funds refunded to client)';
COMMENT ON COLUMN bounties.claim_transaction_id IS 'Transaction ID when freelancer claims approved bounty';
COMMENT ON COLUMN bounties.refund_transaction_id IS 'Transaction ID when bounty is refunded (manual or auto-refund)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Verification queries:
-- 
-- 1. Check all columns exist:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'bounties'
-- ORDER BY ordinal_position;
-- 
-- 2. Check transaction_id columns:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'bounties' 
-- AND column_name LIKE '%transaction_id%'
-- ORDER BY column_name;
-- 
-- 3. Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename = 'bounties'
-- ORDER BY indexname;
-- 
-- 4. Check RLS policies:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename = 'bounties';
-- 
-- 5. Check trigger:
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE event_object_schema = 'public'
-- AND event_object_table = 'bounties';
-- ============================================================================

