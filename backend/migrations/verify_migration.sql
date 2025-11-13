-- Verification queries for AlgoEase migrations
-- Run these queries to verify the migrations were applied correctly

-- ============================================================================
-- Verify 1: Check if contract_id is nullable
-- ============================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
AND column_name = 'contract_id';

-- Expected result: is_nullable should be 'YES'

-- ============================================================================
-- Verify 2: Check the status constraint includes 'rejected'
-- ============================================================================
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bounties'::regclass
AND conname = 'bounties_status_check';

-- Expected result: Should show constraint with 'rejected' in the CHECK clause

-- ============================================================================
-- Verify 3: Check all columns in bounties table
-- ============================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;

-- ============================================================================
-- Verify 4: Test inserting a bounty with NULL contract_id (optional test)
-- ============================================================================
-- Uncomment and run this if you want to test that NULL contract_id is allowed
-- (Make sure to replace with valid test data)
/*
INSERT INTO bounties (
    client_address,
    amount,
    deadline,
    status,
    title,
    description
) VALUES (
    'TESTADDRESS1234567890123456789012345678901234567890123456789012',
    1.0,
    NOW() + INTERVAL '30 days',
    'open',
    'Test Bounty',
    'This is a test bounty to verify NULL contract_id is allowed'
);
*/

-- ============================================================================
-- Verify 5: Test that 'rejected' status is allowed (optional test)
-- ============================================================================
-- Uncomment and run this if you want to test that 'rejected' status is allowed
-- (Make sure to replace with valid test data)
/*
UPDATE bounties 
SET status = 'rejected' 
WHERE id = 'your-test-bounty-id-here';
*/

