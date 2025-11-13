-- Quick verification query - Run this to confirm the migration worked
-- Copy and paste this into Supabase SQL Editor and run it

-- Check if contract_id is nullable
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bounties'
AND column_name = 'contract_id';

-- Expected Result:
-- column_name: contract_id
-- data_type: bigint
-- is_nullable: YES  <-- This confirms it's nullable!

-- Check the status constraint includes 'rejected'
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'bounties'::regclass
AND conname = 'bounties_status_check';

-- Expected Result:
-- constraint_name: bounties_status_check
-- constraint_definition: CHECK (status = ANY (ARRAY['open'::text, 'accepted'::text, 'approved'::text, 'claimed'::text, 'refunded'::text, 'rejected'::text]))
--                                                                    ^^^ This confirms 'rejected' is included!

