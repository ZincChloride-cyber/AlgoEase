# SQL Migration Guide for AlgoEase Bounties Table

## Overview

This guide provides SQL migration scripts for creating and updating the bounties table in Supabase.

## Migration Scripts

### 1. Complete Table Creation (`create_bounties_table_complete.sql`)

**Use this if**: You're creating the table for the first time.

**Location**: `backend/migrations/create_bounties_table_complete.sql`

**Features**:
- Creates bounties table with all necessary columns
- `contract_id` is **nullable** (can be set after on-chain creation)
- Includes `'rejected'` status in the status check constraint
- All necessary indexes for performance
- Automatic `updated_at` timestamp trigger
- Row Level Security (RLS) policies

**To run**:
1. Open Supabase SQL Editor
2. Copy the contents of `backend/migrations/create_bounties_table_complete.sql`
3. Paste into SQL Editor
4. Click "Run" to execute

### 2. Update Existing Table (`update_bounties_table.sql`)

**Use this if**: You already have a bounties table and need to update it.

**Location**: `backend/migrations/update_bounties_table.sql`

**Features**:
- Makes `contract_id` nullable (if it was NOT NULL)
- Adds `'rejected'` status to the status check constraint
- Ensures all indexes exist
- Ensures `updated_at` trigger exists
- Ensures RLS policies exist

**To run**:
1. Open Supabase SQL Editor
2. Copy the contents of `backend/migrations/update_bounties_table.sql`
3. Paste into SQL Editor
4. Click "Run" to execute

## Table Schema

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `contract_id` | BIGINT | **Yes** | On-chain contract ID (nullable) |
| `client_address` | VARCHAR(58) | No | Client's Algorand address |
| `freelancer_address` | VARCHAR(58) | Yes | Freelancer's Algorand address |
| `verifier_address` | VARCHAR(58) | Yes | Verifier's Algorand address |
| `amount` | DECIMAL(18, 6) | No | Bounty amount in ALGO |
| `deadline` | TIMESTAMP WITH TIME ZONE | No | Bounty deadline |
| `status` | VARCHAR(20) | No | Bounty status (see below) |
| `title` | VARCHAR(200) | No | Bounty title |
| `description` | TEXT | No | Bounty description |
| `requirements` | JSONB | Yes | Bounty requirements (array) |
| `tags` | JSONB | Yes | Bounty tags (array) |
| `submissions` | JSONB | Yes | Bounty submissions (array) |
| `created_at` | TIMESTAMP WITH TIME ZONE | No | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No | Last update timestamp |

### Status Values

The `status` column accepts the following values:
- `'open'` - Bounty is open for acceptance
- `'accepted'` - Bounty has been accepted by a freelancer
- `'approved'` - Bounty work has been approved by verifier
- `'claimed'` - Bounty payment has been claimed by freelancer
- `'refunded'` - Bounty has been refunded to client
- `'rejected'` - Bounty work has been rejected by verifier

### Constraints

1. **contract_id**: Must be unique if not null
2. **client_address**: Must match Algorand address format (`^[A-Z2-7]{58}$`)
3. **freelancer_address**: Must match Algorand address format if not null
4. **verifier_address**: Must match Algorand address format if not null
5. **amount**: Must be >= 0.001 ALGO
6. **status**: Must be one of the valid status values

### Indexes

1. `idx_bounties_contract_id` - Index on `contract_id` (for lookups)
2. `idx_bounties_client_address` - Index on `client_address` (for filtering)
3. `idx_bounties_freelancer_address` - Index on `freelancer_address` (for filtering)
4. `idx_bounties_status` - Index on `status` (for filtering)
5. `idx_bounties_deadline` - Index on `deadline` (for sorting)
6. `idx_bounties_created_at` - Index on `created_at DESC` (for sorting)

### Triggers

1. **update_bounties_updated_at** - Automatically updates `updated_at` timestamp on row update

### Row Level Security (RLS)

1. **Allow all operations for service role** - Allows all operations for service role key
2. **Alternative policies** - More restrictive policies available (commented out)

## Verification Queries

### Verify Table Structure
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;
```

### Verify Status Constraint
```sql
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'bounties_status_check';
```

### Verify Indexes
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'bounties';
```

### Verify Trigger
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'bounties';
```

### Verify contract_id is Nullable
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bounties' AND column_name = 'contract_id';
```

## Common Issues

### Issue: contract_id is NOT NULL
**Solution**: Run `update_bounties_table.sql` to make it nullable

### Issue: 'rejected' status not allowed
**Solution**: Run `update_bounties_table.sql` to add 'rejected' to the status constraint

### Issue: Missing indexes
**Solution**: Run `update_bounties_table.sql` to create missing indexes

### Issue: updated_at not updating
**Solution**: Run `update_bounties_table.sql` to create the trigger

### Issue: RLS blocking operations
**Solution**: Verify RLS policies are created correctly in the migration script

## Migration Order

1. **First Time Setup**: Run `create_bounties_table_complete.sql`
2. **Update Existing Table**: Run `update_bounties_table.sql`
3. **Verify Migration**: Run verification queries above

## Notes

- **contract_id is nullable**: This allows bounties to be created in the database before they're created on-chain
- **Status constraint**: Includes all 6 status values (open, accepted, approved, claimed, refunded, rejected)
- **Indexes**: All indexes are created with `IF NOT EXISTS` to avoid errors
- **Triggers**: Trigger is dropped and recreated to ensure it's up to date
- **RLS Policies**: Policies are dropped and recreated to avoid conflicts

## Next Steps

1. Run the appropriate migration script in Supabase SQL Editor
2. Verify the migration using the verification queries
3. Test the backend API to ensure it works with the updated schema
4. Test the frontend to ensure it displays bounties correctly

## Support

If you encounter any issues:
1. Check the Supabase logs for errors
2. Verify the migration script syntax is correct
3. Check that you have the necessary permissions
4. Verify the table structure matches the expected schema


