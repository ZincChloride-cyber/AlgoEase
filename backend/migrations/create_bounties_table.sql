-- Create bounties table for Supabase
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- On-chain data
  contract_id BIGINT UNIQUE,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id);
CREATE INDEX IF NOT EXISTS idx_bounties_client_address ON bounties(client_address);
CREATE INDEX IF NOT EXISTS idx_bounties_freelancer_address ON bounties(freelancer_address);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bounties_updated_at 
  BEFORE UPDATE ON bounties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- For service role key, RLS is bypassed, but for anon key, you'll need these policies
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Alternative: More restrictive policies (uncomment if using anon key)
-- CREATE POLICY "Allow public read access" ON bounties
--   FOR SELECT
--   USING (true);

-- CREATE POLICY "Allow authenticated insert" ON bounties
--   FOR INSERT
--   WITH CHECK (true);

-- CREATE POLICY "Allow update by client" ON bounties
--   FOR UPDATE
--   USING (true)
--   WITH CHECK (true);

