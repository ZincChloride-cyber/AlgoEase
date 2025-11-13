# Database Migrations for AlgoEase

This directory contains SQL migration files for the AlgoEase database schema.

## How to Run Migrations in Supabase

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your AlgoEase project

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New query"** to create a new SQL query

### Step 3: Run the Migration
1. Copy the contents of `run_all_migrations.sql` (or the specific migration file you need)
2. Paste it into the SQL editor
3. Click **"Run"** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

### Step 4: Verify the Migration
After running the migration, verify it worked by running this query:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;

-- Check status constraint
SELECT conname, consrc
FROM pg_constraint
WHERE conrelid = 'bounties'::regclass
AND conname = 'bounties_status_check';
```

## Migration Files

### `create_bounties_table.sql`
Initial table creation. Run this first if the table doesn't exist.

### `make_contract_id_nullable.sql`
Makes `contract_id` nullable. Required for bounties created before the contract is deployed.

### `add_rejected_status.sql`
Adds 'rejected' status to the status check constraint.

### `run_all_migrations.sql`
Combined migration file that includes both migrations above. Use this if you need to apply both changes.

## Troubleshooting

### Error: "relation 'bounties' does not exist"
- Run `create_bounties_table.sql` first to create the table

### Error: "constraint does not exist"
- This is normal if the constraint hasn't been created yet
- The migration uses `DROP CONSTRAINT IF EXISTS` to handle this gracefully

### Error: "column 'contract_id' is already nullable"
- This means the migration has already been applied
- You can safely skip this migration

## Notes

- Always backup your database before running migrations in production
- Test migrations on a development/staging database first
- Migrations are idempotent (can be run multiple times safely)
- The `IF EXISTS` and `IF NOT EXISTS` clauses prevent errors if migrations are run multiple times
