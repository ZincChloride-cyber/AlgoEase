-- ============================================================================
-- AlgoEase: Database Schema Redesign for New Contract
-- ============================================================================
-- Purpose: Update bounties table to match the new smart contract structure
-- New Contract Details:
--   - Contract ID: 749702537
--   - No deadline field (deadline removed)
--   - No verifier field (creator only approves)
--   - Status includes 'submitted' state
--   - Transaction IDs for all actions
-- ============================================================================
-- This migration:
-- 1. Makes deadline nullable (not used by contract)
-- 2. Makes verifier_address nullable (not used by contract)
-- 3. Adds 'submitted' status to status constraint
-- 4. Adds create_transaction_id if missing
-- 5. Ensures all transaction_id fields exist
-- 6. Updates indexes
-- ============================================================================

-- ============================================================================
-- 1. Make deadline nullable (contract doesn't use deadlines)
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'deadline'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE bounties ALTER COLUMN deadline DROP NOT NULL;
        RAISE NOTICE 'Made deadline nullable';
    ELSE
        RAISE NOTICE 'deadline column is already nullable or does not exist';
    END IF;
END $$;

-- ============================================================================
-- 2. Ensure verifier_address is nullable (contract doesn't use verifier)
-- ============================================================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'verifier_address'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE bounties ALTER COLUMN verifier_address DROP NOT NULL;
        RAISE NOTICE 'Made verifier_address nullable';
    ELSE
        RAISE NOTICE 'verifier_address column is already nullable or does not exist';
    END IF;
END $$;

-- ============================================================================
-- 3. Update status constraint to include 'submitted' status
-- Contract statuses: 0=OPEN, 1=ACCEPTED, 2=SUBMITTED, 3=APPROVED, 4=CLAIMED, 5=REJECTED, 6=REFUNDED
-- ============================================================================
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'accepted', 'submitted', 'approved', 'claimed', 'refunded', 'rejected'));

-- ============================================================================
-- 4. Add create_transaction_id if it doesn't exist
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'create_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN create_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added create_transaction_id column';
    ELSE
        RAISE NOTICE 'create_transaction_id column already exists';
    END IF;
END $$;

-- ============================================================================
-- 5. Ensure all transaction_id columns exist (with proper naming)
-- ============================================================================
DO $$ 
BEGIN
    -- Accept transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'accept_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN accept_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added accept_transaction_id column';
    END IF;

    -- Submit transaction ID (may not exist yet)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'submit_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN submit_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added submit_transaction_id column';
    END IF;

    -- Approve transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'approve_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN approve_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added approve_transaction_id column';
    END IF;

    -- Reject transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'reject_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN reject_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added reject_transaction_id column';
    END IF;

    -- Claim transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'claim_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN claim_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added claim_transaction_id column';
    END IF;

    -- Refund transaction ID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'refund_transaction_id'
    ) THEN
        ALTER TABLE bounties ADD COLUMN refund_transaction_id VARCHAR(64) NULL;
        RAISE NOTICE 'Added refund_transaction_id column';
    END IF;
END $$;

-- ============================================================================
-- 6. Update indexes - remove deadline index (deadline is now optional/nullable)
-- Add indexes for transaction IDs if they don't exist
-- ============================================================================
-- Remove deadline index since deadline is optional
DROP INDEX IF EXISTS idx_bounties_deadline;

-- Add indexes for transaction IDs (partial indexes for non-null values)
CREATE INDEX IF NOT EXISTS idx_bounties_create_transaction_id 
  ON bounties(create_transaction_id) WHERE create_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_submit_transaction_id 
  ON bounties(submit_transaction_id) WHERE submit_transaction_id IS NOT NULL;

-- Ensure other transaction ID indexes exist
CREATE INDEX IF NOT EXISTS idx_bounties_accept_transaction_id 
  ON bounties(accept_transaction_id) WHERE accept_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_approve_transaction_id 
  ON bounties(approve_transaction_id) WHERE approve_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_reject_transaction_id 
  ON bounties(reject_transaction_id) WHERE reject_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_claim_transaction_id 
  ON bounties(claim_transaction_id) WHERE claim_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounties_refund_transaction_id 
  ON bounties(refund_transaction_id) WHERE refund_transaction_id IS NOT NULL;

-- ============================================================================
-- 7. Add column comments for documentation
-- ============================================================================
COMMENT ON COLUMN bounties.deadline IS 'Optional deadline (nullable) - not used by the new smart contract';
COMMENT ON COLUMN bounties.verifier_address IS 'Optional verifier address (nullable) - new contract uses creator-only approval, this field is kept for backward compatibility';
COMMENT ON COLUMN bounties.status IS 'Bounty status: open, accepted, submitted, approved, claimed, refunded, rejected';
COMMENT ON COLUMN bounties.create_transaction_id IS 'Transaction ID when bounty was created on-chain';
COMMENT ON COLUMN bounties.submit_transaction_id IS 'Transaction ID when freelancer submits work';
COMMENT ON COLUMN bounties.contract_id IS 'Smart contract bounty ID (bigint) - nullable until set after on-chain creation';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Verification queries:
-- 
-- 1. Check all columns and their nullability:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'bounties'
-- ORDER BY ordinal_position;
-- 
-- 2. Check status constraint includes 'submitted':
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'bounties_status_check';
-- 
-- 3. Check transaction_id columns:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name = 'bounties' 
-- AND column_name LIKE '%transaction_id%'
-- ORDER BY column_name;
-- 
-- 4. Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename = 'bounties'
-- ORDER BY indexname;
-- ============================================================================

