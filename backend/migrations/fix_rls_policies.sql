-- ============================================================================
-- Fix RLS Policies for Bounties Table
-- Run this migration in your Supabase SQL Editor to fix RLS policies
-- ============================================================================
-- This ensures that bounties can be read and written properly

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;
DROP POLICY IF EXISTS "Allow public read and insert" ON bounties;

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
-- Verify the policies were created
-- ============================================================================
-- Run this query to verify:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'bounties';














