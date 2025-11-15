# How to Run Migration in Supabase - Step by Step

This guide will walk you through running the database migration in Supabase.

## 📋 Prerequisites

- You have a Supabase account
- You have access to your Supabase project
- You have the migration file ready: `00_create_database_fresh.sql`

## 🚀 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. **Open your browser** and go to: **https://app.supabase.com**

2. **Log in** to your Supabase account (if not already logged in)

3. **Select your project** from the project list
   - Look for: **"Adityasingh2824's Project"** (or your project name)
   - Click on it to open the project dashboard

### Step 2: Navigate to SQL Editor

1. **Look at the left sidebar** - you'll see a menu with various options

2. **Click on "SQL Editor"** (it has a SQL/code icon)

3. You should now see:
   - Left panel: List of saved queries
   - Main panel: SQL query editor
   - Bottom panel: Query results (will appear after running)

### Step 3: Open the Migration File

1. **Open the migration file** on your computer:
   - Navigate to: `backend/migrations/00_create_database_fresh.sql`
   - Open it in any text editor (VS Code, Notepad, etc.)

2. **Select all the content:**
   - Press `Ctrl+A` (Windows) or `Cmd+A` (Mac) to select all
   - Or drag to select everything

3. **Copy the content:**
   - Press `Ctrl+C` (Windows) or `Cmd+C` (Mac) to copy

### Step 4: Paste and Run the Migration

1. **In Supabase SQL Editor:**
   - Click inside the main editor area (big text box)
   - Paste the copied migration: `Ctrl+V` (Windows) or `Cmd+V` (Mac)

2. **Verify the SQL:**
   - You should see the entire migration SQL code
   - It should start with `-- ============================================================================`
   - And end with `-- ============================================================================`

3. **Run the migration:**
   - **Option 1:** Click the **"Run"** button at the bottom right of the editor
   - **Option 2:** Press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)

### Step 5: Check the Results

1. **Look at the results panel** at the bottom:

   **✅ Success indicators:**
   - Green checkmark icon
   - Message: "Success. No rows returned" or similar
   - No error messages

   **❌ Error indicators:**
   - Red error icon
   - Error message describing what went wrong

2. **If you see errors:**
   - Read the error message carefully
   - Common issues:
     - **Syntax errors**: Check if you copied the entire file correctly
     - **Permission errors**: Make sure you're using the SQL Editor (not limited access)
     - **Table exists**: The table might already exist - try dropping it first

### Step 6: Verify the Table Was Created

1. **Go to Table Editor:**
   - In the left sidebar, click **"Table Editor"**
   - Or click the database icon

2. **Check for the `bounties` table:**
   - You should see a table called `bounties` in the list
   - If you don't see it, click "Refresh" or reload the page

3. **Open the `bounties` table:**
   - Click on `bounties` to open it
   - You should see all the columns:
     - `id`
     - `contract_id`
     - `client_address`
     - `freelancer_address`
     - `verifier_address`
     - `amount`
     - `deadline`
     - `status`
     - `title`
     - `description`
     - `requirements`
     - `tags`
     - `submissions`
     - `created_at`
     - `updated_at`

## 🎯 Alternative Method: Using SQL Query

If the above method doesn't work, you can also:

1. **In SQL Editor, click "New Query"**

2. **Type or paste:**
   ```sql
   -- First, drop the existing table
   DROP TABLE IF EXISTS bounties CASCADE;
   ```

3. **Run this query first** (to delete old data)

4. **Then paste and run the full migration** from `00_create_database_fresh.sql`

## ✅ Verification Queries

After running the migration, you can verify everything works by running these queries in SQL Editor:

### Query 1: Check Table Structure
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'bounties'
ORDER BY ordinal_position;
```

### Query 2: Test Insert (Optional)
```sql
-- This will create a test bounty
INSERT INTO bounties (
  client_address,
  title,
  description,
  amount,
  deadline,
  verifier_address
) VALUES (
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  'Test Bounty',
  'This is a test bounty to verify the database works',
  10.5,
  NOW() + INTERVAL '30 days',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'
);
```

### Query 3: Check the Test Data
```sql
SELECT * FROM bounties ORDER BY created_at DESC LIMIT 1;
```

### Query 4: Clean Up Test Data (After Testing)
```sql
DELETE FROM bounties WHERE title = 'Test Bounty';
```

## 🆘 Troubleshooting

### Problem: "Table already exists" error

**Solution:**
The migration includes `DROP TABLE IF EXISTS`, so this should work. But if you still get this error:

1. Manually drop the table first:
   ```sql
   DROP TABLE IF EXISTS bounties CASCADE;
   ```
2. Then run the full migration again

### Problem: "Permission denied" error

**Solution:**
- Make sure you're using the **SQL Editor** (not Table Editor)
- You need admin/owner access to create tables
- Check your Supabase project permissions

### Problem: "Syntax error" or unexpected token

**Solution:**
- Make sure you copied the **entire file** (from start to finish)
- Check that there are no extra characters or missing lines
- Try copying again from the file

### Problem: Migration runs but table doesn't appear

**Solution:**
- Refresh the Table Editor page
- Check if you're looking at the correct schema (`public`)
- Try running the verification query to check if table exists

### Problem: Can't find SQL Editor

**Solution:**
- Make sure you're on the project dashboard (not the account page)
- Look for "SQL Editor" in the left sidebar
- If you don't see it, you might need to upgrade your Supabase plan or check permissions

## 📸 Visual Guide (Text Description)

**Supabase Dashboard Layout:**
```
┌─────────────────────────────────────────┐
│  Supabase Logo    [Project Selector]    │
├──────┬──────────────────────────────────┤
│      │                                  │
│ [📊] │                                  │
│Table │                                  │
│Editor│                                  │
│      │      SQL Editor                  │
│ [📝] │      ┌──────────────────────┐   │
│SQL   │      │                      │   │
│Editor│      │  [Paste SQL here]    │   │
│      │      │                      │   │
│ [🔐] │      │                      │   │
│Auth  │      └──────────────────────┘   │
│      │            [Run] [Cancel]       │
│ ...  │                                  │
└──────┴──────────────────────────────────┘
```

## 🎉 Success!

Once the migration completes successfully:

1. ✅ The `bounties` table will be created
2. ✅ All columns will be set up correctly
3. ✅ Indexes will be created for performance
4. ✅ RLS policies will be configured
5. ✅ You can start creating bounties from your frontend

## 📝 Next Steps

After successfully running the migration:

1. **Restart your backend server:**
   ```powershell
   cd backend
   npm start
   ```

2. **Test creating a bounty:**
   - Go to your frontend
   - Create a new bounty
   - Check that it appears in Supabase Table Editor

3. **Verify data:**
   - Check that `client_address` is filled with your wallet address
   - Verify all fields are saved correctly

---

**Need Help?** If you encounter any issues, check the error message in Supabase and refer to the troubleshooting section above.

