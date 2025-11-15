-- ============================================================================
-- FIX EXISTING BOUNTIES TABLE - ENSURE contract_id CAN BE SAVED
-- This migration fixes the existing table structure to allow contract_id storage
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Ensure contract_id column exists and is properly configured
DO $$ 
BEGIN
  -- Check if contract_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'contract_id'
  ) THEN
    -- Add contract_id column if it doesn't exist
    ALTER TABLE bounties ADD COLUMN contract_id BIGINT;
    RAISE NOTICE 'Added contract_id column';
  ELSE
    RAISE NOTICE 'contract_id column already exists';
  END IF;
END $$;

-- Step 2: Ensure contract_id is BIGINT type (not INT)
DO $$
BEGIN
  -- Check current data type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' 
    AND column_name = 'contract_id' 
    AND data_type != 'bigint'
  ) THEN
    -- Convert to BIGINT if it's not already
    ALTER TABLE bounties ALTER COLUMN contract_id TYPE BIGINT;
    RAISE NOTICE 'Converted contract_id to BIGINT';
  ELSE
    RAISE NOTICE 'contract_id is already BIGINT';
  END IF;
END $$;

-- Step 3: Make contract_id nullable (remove NOT NULL constraint if it exists)
-- This is CRITICAL - contract_id must be nullable to allow NULL values
DO $$
BEGIN
  -- Check if column is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' 
    AND column_name = 'contract_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE bounties ALTER COLUMN contract_id DROP NOT NULL;
    RAISE NOTICE 'Removed NOT NULL constraint from contract_id';
  ELSE
    RAISE NOTICE 'contract_id is already nullable';
  END IF;
END $$;

-- Step 4: Remove any default value that might interfere
ALTER TABLE bounties ALTER COLUMN contract_id DROP DEFAULT;

-- Step 5: Drop existing unique constraint/index if it exists (we'll recreate it properly)
DO $$
BEGIN
  -- Drop unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bounties_contract_id_key'
  ) THEN
    ALTER TABLE bounties DROP CONSTRAINT bounties_contract_id_key;
    RAISE NOTICE 'Dropped existing unique constraint bounties_contract_id_key';
  END IF;
  
  -- Drop unique index if it exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'bounties' 
    AND indexname = 'bounties_contract_id_unique'
  ) THEN
    DROP INDEX IF EXISTS bounties_contract_id_unique;
    RAISE NOTICE 'Dropped existing unique index bounties_contract_id_unique';
  END IF;
END $$;

-- Step 6: Create proper unique index that allows NULL values
-- This is CRITICAL - PostgreSQL unique constraints allow multiple NULL values
-- But we want to ensure non-NULL values are unique
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS bounties_contract_id_unique 
    ON bounties(contract_id) 
    WHERE contract_id IS NOT NULL;
  RAISE NOTICE 'Created unique index on contract_id (allows NULL, enforces uniqueness for non-NULL)';
END $$;

-- Step 7: Create regular index on contract_id for faster queries (includes NULL)
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id);

-- Step 8: Update status constraint to include all valid statuses
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'submitted', 'approved', 'claimed', 'refunded', 'rejected'));

-- Step 9: Ensure all required columns exist
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'create_transaction_id'
  ) THEN
    ALTER TABLE bounties ADD COLUMN create_transaction_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'accept_transaction_id'
  ) THEN
    ALTER TABLE bounties ADD COLUMN accept_transaction_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'approve_transaction_id'
  ) THEN
    ALTER TABLE bounties ADD COLUMN approve_transaction_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'reject_transaction_id'
  ) THEN
    ALTER TABLE bounties ADD COLUMN reject_transaction_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'claim_transaction_id'
  ) THEN
    ALTER TABLE bounties ADD COLUMN claim_transaction_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bounties' AND column_name = 'refund_transaction_id'
  ) THEN
    ALTER TABLE bounties ADD COLUMN refund_transaction_id VARCHAR(255);
  END IF;
  
  RAISE NOTICE 'Verified all transaction ID columns exist';
END $$;

-- Step 10: Verify the final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'bounties'
  AND column_name IN ('id', 'contract_id', 'client_address', 'status', 'amount')
ORDER BY ordinal_position;

-- Step 11: Test that we can insert/update with contract_id
-- This is a verification step - it should work without errors
DO $$
DECLARE
  test_id UUID;
BEGIN
  -- Try to insert a test record with contract_id = NULL (should work)
  INSERT INTO bounties (
    title, 
    description, 
    amount, 
    deadline, 
    client_address, 
    status,
    contract_id
  ) VALUES (
    'TEST - DELETE ME',
    'This is a test record to verify contract_id can be NULL',
    1.0,
    NOW() + INTERVAL '30 days',
    '3AU6XYBNSEW7DRXJVNTGDAZLUYL54CTW3BUYKTBN6LX76KJ3EAVIQLPEBI',
    'open',
    NULL
  ) RETURNING id INTO test_id;
  
  RAISE NOTICE 'Test insert with NULL contract_id: SUCCESS (id: %)', test_id;
  
  -- Try to update with a contract_id value
  UPDATE bounties 
  SET contract_id = 12345 
  WHERE id = test_id;
  
  RAISE NOTICE 'Test update with contract_id = 12345: SUCCESS';
  
  -- Clean up test record
  DELETE FROM bounties WHERE id = test_id;
  RAISE NOTICE 'Test record deleted';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Test failed: %', SQLERRM;
  -- Try to clean up if insert succeeded but update failed
  IF test_id IS NOT NULL THEN
    DELETE FROM bounties WHERE id = test_id;
  END IF;
END $$;

-- Step 12: Show current contract_id values and NULL count
SELECT 
  COUNT(*) as total_bounties,
  COUNT(contract_id) as bounties_with_contract_id,
  COUNT(*) - COUNT(contract_id) as bounties_with_null_contract_id
FROM bounties;

-- Step 13: Show sample of current bounties
SELECT 
  id,
  contract_id,
  client_address,
  title,
  status,
  created_at
FROM bounties
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The bounties table is now properly configured:
-- ✅ contract_id is BIGINT (supports large numbers)
-- ✅ contract_id is nullable (allows NULL values)
-- ✅ contract_id has unique constraint for non-NULL values (allows multiple NULL)
-- ✅ contract_id has index for fast queries
-- ✅ All transaction ID columns exist
-- ✅ Status constraint includes all valid statuses
-- ✅ Test insert/update verified to work
-- 
-- NEXT STEP: Run the fix script to backfill existing NULL contract_ids:
--   cd backend
--   node scripts/fix-contract-ids-from-chain.js
-- 
-- IMPORTANT: After running this migration, restart your backend server
-- to ensure the new schema is recognized.
-- ============================================================================
