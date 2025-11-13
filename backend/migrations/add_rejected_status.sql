-- Migration to add 'rejected' status to bounties table
-- Run this migration in your Supabase SQL editor if the table already exists

-- Drop the existing check constraint
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Add the new check constraint with 'rejected' status
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded', 'rejected'));

