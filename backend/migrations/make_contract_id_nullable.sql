-- Migration to make contract_id nullable
-- Run this migration in your Supabase SQL editor if the table already exists

-- Drop the existing NOT NULL constraint on contract_id
ALTER TABLE bounties ALTER COLUMN contract_id DROP NOT NULL;

-- The UNIQUE constraint will still apply, but NULL values are allowed (multiple NULLs are allowed in UNIQUE columns in PostgreSQL)

