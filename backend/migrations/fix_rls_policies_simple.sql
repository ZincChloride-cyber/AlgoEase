-- Fix RLS Policies for Bounties Table
-- Copy and paste this entire file into Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;
DROP POLICY IF EXISTS "Allow public read and insert" ON bounties;

-- Create new policies
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access" ON bounties
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert" ON bounties
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update by client" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);




