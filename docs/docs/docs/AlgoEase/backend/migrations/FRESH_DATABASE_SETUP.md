# Fresh Database Setup Guide

This guide will help you recreate your AlgoEase database from scratch.

## ⚠️ WARNING

**This will DELETE ALL EXISTING DATA in the `bounties` table!**

Make sure you:
- Have backed up any important data (if needed)
- Are ready to start fresh
- Understand that this is a destructive operation

## 📋 Steps to Recreate Database

### Step 1: Open Supabase Dashboard

1. Go to https://app.supabase.com
2. Log in to your account
3. Select your project: **Adityasingh2824's Project** (or your project name)

### Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"New Query"** to create a new SQL query

### Step 3: Run the Migration

1. Open the file: `backend/migrations/00_create_database_fresh.sql`
2. **Copy the entire contents** of that file
3. **Paste it into the SQL Editor** in Supabase
4. Click **"Run"** (or press `Ctrl+Enter`)

### Step 4: Verify the Setup

After running the migration, you should see:
- ✅ Success message
- ✅ All tables, indexes, and policies created

You can verify by:

1. **Check the table exists:**
   - Go to **Table Editor** in the left sidebar
   - You should see the `bounties` table

2. **Check table structure:**
   - Click on the `bounties` table
   - You should see all columns:
     - `id` (UUID, primary key)
     - `contract_id` (BIGINT, nullable)
     - `client_address` (VARCHAR, required)
     - `freelancer_address` (VARCHAR, nullable)
     - `verifier_address` (VARCHAR, nullable)
     - `amount` (DECIMAL, required)
     - `deadline` (TIMESTAMP, required)
     - `status` (VARCHAR, default 'open')
     - `title` (VARCHAR, required)
     - `description` (TEXT, required)
     - `requirements` (JSONB, default [])
     - `tags` (JSONB, default [])
     - `submissions` (JSONB, default [])
     - `created_at` (TIMESTAMP, auto)
     - `updated_at` (TIMESTAMP, auto)

### Step 5: Test the Setup

1. **Start your backend server:**
   ```powershell
   cd backend
   npm start
   ```

2. **Test creating a bounty:**
   - Go to your frontend
   - Create a new bounty
   - Check that it appears in the Supabase table

3. **Verify data is saved:**
   - Go back to Supabase Table Editor
   - Refresh the `bounties` table
   - You should see your new bounty with:
     - ✅ `client_address` filled with your wallet address
     - ✅ All fields populated correctly
     - ✅ `contract_id` set (if available)

## 🔍 Troubleshooting

### If the migration fails:

1. **Check for syntax errors:**
   - Look for red error messages in the SQL Editor
   - Make sure you copied the entire file

2. **Check for existing dependencies:**
   - If you see errors about dependencies, you may need to drop other tables first
   - Check if any other tables reference `bounties`

3. **Check permissions:**
   - Make sure you're using the SQL Editor (not limited access)
   - You need admin access to drop/create tables

### If data is not saving:

1. **Check backend logs:**
   - Look for error messages when creating a bounty
   - Check if the API request is successful

2. **Check RLS policies:**
   - Make sure RLS policies are set correctly
   - Your backend should use the **service role key** (not anon key)

3. **Check Supabase connection:**
   - Verify your `.env` file has correct Supabase credentials
   - Test connection in backend logs

## ✅ Success Indicators

You'll know everything is working when:

- ✅ Migration runs without errors
- ✅ `bounties` table appears in Table Editor
- ✅ All columns are visible with correct data types
- ✅ You can create a bounty from the frontend
- ✅ The bounty appears in the database with all fields populated
- ✅ Your wallet address is saved in `client_address`

## 📝 Next Steps

After the database is set up:

1. ✅ Verify data is saving correctly
2. ✅ Test all bounty operations (create, update, accept, etc.)
3. ✅ Check that frontend can fetch bounties
4. ✅ Verify wallet addresses are being saved correctly

## 🔗 Useful Links

- Supabase Dashboard: https://app.supabase.com
- SQL Editor: https://app.supabase.com/project/_/sql
- Table Editor: https://app.supabase.com/project/_/editor

## 📞 Need Help?

If you encounter issues:

1. Check the backend console logs
2. Check browser console for frontend errors
3. Verify Supabase connection in backend logs
4. Test the API endpoints directly

---

**Note:** After running this migration, your database will be completely fresh and ready to accept new bounty data.


