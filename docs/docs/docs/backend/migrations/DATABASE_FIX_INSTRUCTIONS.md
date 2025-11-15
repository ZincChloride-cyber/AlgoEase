# Database Fix Instructions

## Problem
Bounties are not being stored after creation and are not displaying on the frontend.

## Root Causes Identified
1. **RLS Policies**: Row Level Security policies may be blocking reads/writes
2. **Data Formatting**: Issues with date formatting and JSONB field handling
3. **Query Handling**: Empty result handling and error logging improvements

## Solution Steps

### Step 1: Run the RLS Policy Fix Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- File: backend/migrations/fix_rls_policies.sql
```

Or manually run:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;

-- Create new policies
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access" ON bounties
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert" ON bounties
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update by client" ON bounties
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

### Step 2: Verify Database Connection

Make sure your `.env` file has the correct Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: Use the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to bypass RLS when needed.

### Step 3: Restart Backend Server

After running the migration, restart your backend server:

```bash
cd backend
npm start
# or
node server.js
```

### Step 4: Test Bounty Creation

1. Create a bounty through the frontend
2. Check backend logs for:
   - `✅ Bounty inserted successfully` message
   - Any error messages

### Step 5: Verify Bounties are Stored

Run this query in Supabase SQL Editor to check if bounties exist:

```sql
SELECT id, title, status, created_at, contract_id 
FROM bounties 
ORDER BY created_at DESC 
LIMIT 10;
```

### Step 6: Test Frontend Display

1. Navigate to the bounties list page
2. Check browser console for any API errors
3. Check backend logs for query results

## Code Changes Made

### 1. Bounty Model (`backend/models/Bounty.js`)
- ✅ Improved error handling in `find()` method
- ✅ Better empty result handling
- ✅ Fixed date formatting in `toDBFormat()`
- ✅ Improved JSONB field validation
- ✅ Better logging for debugging

### 2. RLS Policies (`backend/migrations/`)
- ✅ Added public read access policy
- ✅ Added authenticated insert policy
- ✅ Added update policy

### 3. Routes (`backend/routes/bounties.js`)
- ✅ Already had good error handling
- ✅ Logging improvements

## Troubleshooting

### If bounties still don't appear:

1. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'bounties';
   ```

2. **Check if bounties exist in database**:
   ```sql
   SELECT COUNT(*) FROM bounties;
   ```

3. **Check backend logs** for:
   - Database connection errors
   - Query errors
   - RLS policy violations

4. **Check frontend console** for:
   - API request/response errors
   - Network errors
   - Authentication errors

5. **Verify Supabase credentials** in `.env` file

6. **Test API directly**:
   ```bash
   curl http://localhost:5000/api/bounties
   ```

## Expected Behavior After Fix

1. ✅ Bounties are saved to database when created
2. ✅ Bounties appear in the frontend list
3. ✅ Bounties can be filtered and paginated
4. ✅ Bounties can be viewed in detail
5. ✅ Backend logs show successful queries

## Additional Notes

- The service role key bypasses RLS, but the policies are still needed for anon key access
- If using anon key, make sure the RLS policies are correctly set
- All timestamps are stored in UTC
- Contract ID can be null initially and updated later



