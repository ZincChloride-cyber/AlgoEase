-- ============================================================================
-- AlgoEase: Add Transaction ID Columns to Bounties Table
-- ============================================================================
-- Purpose: Track on-chain transaction IDs for each bounty action
-- Run this migration in your Supabase SQL Editor
-- ============================================================================
-- This migration adds transaction_id columns to track blockchain transactions
-- for: accept, approve, reject, claim, and refund actions
-- ============================================================================

-- Add transaction_id columns safely (only if they don't exist)
DO $$ 
BEGIN
    -- Create transaction ID - tracks when bounty is created on-chain
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'create_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN create_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added create_transaction_id column';
    END IF;
    
    -- Accept transaction ID - tracks when freelancer accepts the bounty
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'accept_transaction_id'
    ) THEN
        ALTER TABLE bounties 
        ADD COLUMN accept_transaction_id VARCHAR(64) NULL;
        
        RAISE NOTICE 'Added column: accept_transaction_id';
    ELSE
        RAISE NOTICE 'Column accept_transaction_id already exists, skipping...';
    END IF;

    -- Approve transaction ID - tracks when verifier approves work (funds transfer to freelancer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'approve_transaction_id'
    ) THEN
        ALTER TABLE bounties 
        ADD COLUMN approve_transaction_id VARCHAR(64) NULL;
        
        RAISE NOTICE 'Added column: approve_transaction_id';
    ELSE
        RAISE NOTICE 'Column approve_transaction_id already exists, skipping...';
    END IF;

    -- Reject transaction ID - tracks when work is rejected (funds refunded to client)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'reject_transaction_id'
    ) THEN
        ALTER TABLE bounties 
        ADD COLUMN reject_transaction_id VARCHAR(64) NULL;
        
        RAISE NOTICE 'Added column: reject_transaction_id';
    ELSE
        RAISE NOTICE 'Column reject_transaction_id already exists, skipping...';
    END IF;

    -- Claim transaction ID - tracks when freelancer claims approved bounty
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'claim_transaction_id'
    ) THEN
        ALTER TABLE bounties 
        ADD COLUMN claim_transaction_id VARCHAR(64) NULL;
        
        RAISE NOTICE 'Added column: claim_transaction_id';
    ELSE
        RAISE NOTICE 'Column claim_transaction_id already exists, skipping...';
    END IF;

    -- Refund transaction ID - tracks when bounty is refunded (manual or auto)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'refund_transaction_id'
    ) THEN
        ALTER TABLE bounties 
        ADD COLUMN refund_transaction_id VARCHAR(64) NULL;
        
        RAISE NOTICE 'Added column: refund_transaction_id';
    ELSE
        RAISE NOTICE 'Column refund_transaction_id already exists, skipping...';
    END IF;
END $$;

-- ============================================================================
-- Create indexes for transaction IDs (for faster lookups)
-- ============================================================================
-- Partial indexes (only index non-null values) for better performance
CREATE INDEX IF NOT EXISTS idx_bounties_create_transaction_id 
ON bounties(create_transaction_id) 
WHERE create_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_accept_transaction_id 
ON bounties(accept_transaction_id) 
WHERE accept_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_approve_transaction_id 
ON bounties(approve_transaction_id) 
WHERE approve_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_reject_transaction_id 
ON bounties(reject_transaction_id) 
WHERE reject_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_claim_transaction_id 
ON bounties(claim_transaction_id) 
WHERE claim_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_refund_transaction_id 
ON bounties(refund_transaction_id) 
WHERE refund_transaction_id IS NOT NULL;

-- ============================================================================
-- Add comments to columns for documentation
-- ============================================================================
COMMENT ON COLUMN bounties.create_transaction_id IS 
'Transaction ID from blockchain when bounty is created on-chain';

COMMENT ON COLUMN bounties.accept_transaction_id IS 
'Transaction ID from blockchain when freelancer accepts the bounty';

COMMENT ON COLUMN bounties.approve_transaction_id IS 
'Transaction ID from blockchain when verifier approves work (funds transfer to freelancer)';

COMMENT ON COLUMN bounties.reject_transaction_id IS 
'Transaction ID from blockchain when work is rejected (funds refunded to client)';

COMMENT ON COLUMN bounties.claim_transaction_id IS 
'Transaction ID from blockchain when freelancer claims approved bounty';

COMMENT ON COLUMN bounties.refund_transaction_id IS 
'Transaction ID from blockchain when bounty is refunded (manual or auto-refund)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Verification queries:
-- 
-- 1. Check all transaction_id columns were added:
-- SELECT column_name, data_type, is_nullable, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'bounties' 
-- AND column_name LIKE '%transaction_id%'
-- ORDER BY column_name;
-- 
-- 2. Check indexes were created:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename = 'bounties'
-- AND indexname LIKE '%transaction_id%'
-- ORDER BY indexname;
-- 
-- 3. Verify column comments:
-- SELECT 
--     c.column_name,
--     obj_description(c.oid, 'pg_class') as table_comment,
--     col_description(c.oid, c.ordinal_position) as column_comment
-- FROM information_schema.columns c
-- JOIN pg_class ON pg_class.relname = c.table_name
-- WHERE c.table_schema = 'public'
-- AND c.table_name = 'bounties'
-- AND c.column_name LIKE '%transaction_id%'
-- ORDER BY c.column_name;
-- ============================================================================
