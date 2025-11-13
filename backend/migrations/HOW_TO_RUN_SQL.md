# How to Run SQL Migrations in Supabase

## ⚠️ Important: You're Getting "requested path is invalid" Error

This error means you're trying to run SQL in the wrong place. You need to use the **SQL Editor**, not the REST API endpoint.

## ✅ Correct Steps:

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (the one with URL like `qsdrxpunfhzrouxxeskl.supabase.co`)

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"** (it has a database icon)
2. You should see a text area where you can write SQL queries

### Step 3: Run the Migration
1. Click **"New Query"** button (top right)
2. Copy the entire contents of `fix_rls_policies_simple.sql`
3. Paste it into the SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify It Worked
After running, you should see:
- ✅ Success message: "Success. No rows returned"
- Or a table showing the policies were created

## 🔍 Alternative: Verify Policies Exist

Run this query in the SQL Editor to check if policies exist:

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'bounties';
```

You should see 4 policies listed.

## ❌ What NOT to Do:

- ❌ Don't paste SQL into the browser address bar
- ❌ Don't use the REST API endpoint (the URL in your address bar)
- ❌ Don't use the Table Editor (that's for viewing data, not running SQL)

## 📸 Visual Guide:

1. **Dashboard** → Your Project
2. **Left Sidebar** → Click "SQL Editor" (database icon)
3. **New Query** → Paste SQL → **Run**

## 🆘 Still Having Issues?

If you still get errors:

1. **Check if table exists:**
   ```sql
   SELECT * FROM bounties LIMIT 1;
   ```

2. **If table doesn't exist, run the full migration first:**
   - Go to SQL Editor
   - Run `supabase_bounties_table.sql` first
   - Then run `fix_rls_policies_simple.sql`

3. **Check your Supabase project URL:**
   - Make sure you're in the correct project
   - The URL should match your `.env` file

## 📝 Quick Copy-Paste SQL:

Here's the SQL to copy (from `fix_rls_policies_simple.sql`):

```sql
DROP POLICY IF EXISTS "Allow all operations for service role" ON bounties;
DROP POLICY IF EXISTS "Allow public read access" ON bounties;
DROP POLICY IF EXISTS "Allow authenticated insert" ON bounties;
DROP POLICY IF EXISTS "Allow update by client" ON bounties;
DROP POLICY IF EXISTS "Allow public read and insert" ON bounties;

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


