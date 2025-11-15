-- ============================================================================
-- VERIFY BOUNTIES TABLE EXISTS AND STRUCTURE
-- Run this to check if the bounties table is set up correctly
-- ============================================================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'bounties'
) AS table_exists;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;

-- Count bounties (should be 0 if no bounties created yet)
SELECT 
  COUNT(*) as total_bounties,
  COUNT(contract_id) as bounties_with_contract_id,
  COUNT(*) - COUNT(contract_id) as bounties_with_null_contract_id
FROM bounties;

-- Show any existing bounties (empty if none exist)
SELECT 
  id,
  contract_id,
  title,
  client_address,
  status,
  amount,
  created_at
FROM bounties
ORDER BY created_at DESC
LIMIT 10;

