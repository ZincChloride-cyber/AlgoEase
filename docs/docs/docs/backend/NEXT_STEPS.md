# Next Steps After Migration ✅

## Step 1: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **service_role** key (click the eye icon to reveal it, then copy)

## Step 2: Create .env File

1. In your backend folder, create a `.env` file (copy from `env.example`)
2. Add your Supabase credentials:

```env
# Database - Supabase Configuration
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

Replace with your actual values from Step 1.

## Step 3: Test the Connection

1. Start your backend server:
   ```bash
   npm start
   ```

2. You should see:
   ```
   📦 Supabase Connected: https://your-project-id.supabase.co
   🚀 AlgoEase Backend API running on port 5000
   ```

3. Test the API:
   - Open: http://localhost:5000/health
   - Should return: `{"status":"OK",...}`

## Step 4: Test Database Operations

Try creating a test bounty via API or test the endpoints.

## Troubleshooting

**Error: "Missing Supabase configuration"**
- Make sure `.env` file exists in the `backend` folder
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- No quotes needed around the values

**Error: "relation does not exist"**
- Make sure you ran the SQL migration successfully
- Check that the `bounties` table appears in Table Editor

**Connection works but queries fail**
- Verify your service role key is correct
- Check that RLS policies are set up (should be done by migration)

