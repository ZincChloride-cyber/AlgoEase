-- ============================================================================
-- AlgoEase: Add submit_transaction_id Column to Bounties Table
-- ============================================================================
-- Purpose: Track on-chain transaction ID when freelancer submits work
-- Required for V6 contract which includes submit_bounty action
-- ============================================================================

-- Add submit_transaction_id column safely (only if it doesn't exist)
DO $$ 
BEGIN
    -- Submit transaction ID - tracks when freelancer submits completed work
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'bounties' 
        AND column_name = 'submit_transaction_id'
    ) THEN
        ALTER TABLE bounties 
        ADD COLUMN submit_transaction_id VARCHAR(64) NULL;
        
        RAISE NOTICE 'Added column: submit_transaction_id';
    ELSE
        RAISE NOTICE 'Column submit_transaction_id already exists, skipping...';
    END IF;
END $$;

-- ============================================================================
-- Create index for submit_transaction_id (for faster lookups)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bounties_submit_transaction_id 
ON bounties(submit_transaction_id) 
WHERE submit_transaction_id IS NOT NULL;

-- ============================================================================
-- Add comment to column for documentation
-- ============================================================================
COMMENT ON COLUMN bounties.submit_transaction_id IS 
'Transaction ID from blockchain when freelancer submits completed work';

-- ============================================================================
-- Migration Complete
-- ============================================================================

