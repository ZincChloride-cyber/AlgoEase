-- ============================================================================
-- AlgoEase Bounties Table - Complete SQL Migration
-- Run this migration in your Supabase SQL Editor
-- ============================================================================
-- This migration creates/updates the bounties table with all necessary features:
-- 1. contract_id is nullable (can be set after on-chain creation)
-- 2. Includes 'rejected' status in the status check constraint
-- 3. All necessary indexes for performance
-- 4. Automatic updated_at timestamp trigger
-- 5. Row Level Security (RLS) policies
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bounties table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- On-chain data
  contract_id BIGINT UNIQUE,  -- Nullable: can be set after on-chain creation
  client_address VARCHAR(58) NOT NULL CHECK (client_address ~ '^[A-Z2-7]{58}$'),
  freelancer_address VARCHAR(58) CHECK (freelancer_address IS NULL OR freelancer_address ~ '^[A-Z2-7]{58}$'),
  verifier_address VARCHAR(58) CHECK (verifier_address IS NULL OR verifier_address ~ '^[A-Z2-7]{58}$'),
  amount DECIMAL(18, 6) NOT NULL CHECK (amount >= 0.001),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected')),
  
  -- Off-chain metadata
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Submissions (stored as JSONB array)
  submissions JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Make contract_id nullable (if table already exists and contract_id is NOT NULL)
-- ============================================================================
ALTER TABLE bounties ALTER COLUMN contract_id DROP NOT NULL;

-- ============================================================================
-- Update status constraint to include 'rejected' status
-- ============================================================================
-- Drop the existing check constraint (if it exists)
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Add the new check constraint with 'rejected' status
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected'));

-- ============================================================================
-- Create indexes for better query performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id);
CREATE INDEX IF NOT EXISTS idx_bounties_client_address ON bounties(client_address);
CREATE INDEX IF NOT EXISTS idx_bounties_freelancer_address ON bounties(freelancer_address);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- ============================================================================
-- Create function to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- Create trigger to automatically update updated_at
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

-- Create policy to allow all operations (adjust based on your security needs)
-- For service role key, RLS is bypassed, but for anon key, you'll need these policies
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

-- Allow update by anyone (you can restrict this later)
CREATE POLICY "Allow update by client" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Verify the migration by running the following queries:
-- 
-- 1. Check table structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'bounties'
-- ORDER BY ordinal_position;
-- 
-- 2. Check status constraint:
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'bounties_status_check';
-- 
-- 3. Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'bounties';
-- 
-- 4. Check trigger:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'bounties';
-- 
-- 5. Check contract_id is nullable:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'bounties' AND column_name = 'contract_id';
-- ============================================================================

