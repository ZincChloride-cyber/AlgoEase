# Error Fix Guide

## Issues Identified

### 1. Supabase "requested path is invalid" Error

**Problem**: You're trying to access `qsdrxpunfhzrouxxeskl.supabase.co` directly in the browser. This is incorrect - Supabase URLs require specific API paths or should be accessed through the dashboard.

**Solution**: 
- **To access Supabase Dashboard**: Go to https://app.supabase.com
- **For API endpoints**: Use paths like `/rest/v1/bounties` or `/rest/v1/bounties?id=eq.1`
- **Full API URL example**: `https://qsdrxpunfhzrouxxeskl.supabase.co/rest/v1/bounties`

### 2. Browser Extension JavaScript Error

**Problem**: A browser extension's content script (`content.js`) is trying to process the Supabase error page and calling `.trim()` on the number `1` instead of a string.

**Error**: `TypeError: 1.trim is not a function`

**Solutions**:
1. **Disable the problematic extension**: Check your browser extensions and temporarily disable any that might be processing page content
2. **Access Supabase correctly**: Once you access Supabase through the dashboard or proper API endpoints, this error should disappear
3. **Update/remove the extension**: If the error persists, consider updating or removing the browser extension causing the issue

### 3. 404 Resource Error

**Problem**: Some resource is failing to load (likely related to the incorrect Supabase URL access).

**Solution**: This will resolve once you access Supabase correctly.

## How to Fix

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Log in to your account
3. Select your project (the one with URL `qsdrxpunfhzrouxxeskl.supabase.co`)

### Step 2: Verify Your Backend Configuration

Make sure your `backend/.env` file has the correct Supabase URL:

```env
SUPABASE_URL=https://qsdrxpunfhzrouxxeskl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**: 
- The URL should start with `https://` (not `http://`)
- The URL should NOT include any API paths (like `/rest/v1`)
- Get your service role key from: Supabase Dashboard → Settings → API → Service Role Key

### Step 3: Test Your Supabase Connection

Run your backend server and check if it connects to Supabase:

```bash
cd backend
npm start
```

Look for a message like: `✓ Database connection test successful` or `📦 Supabase Connected: https://qsdrxpunfhzrouxxeskl.supabase.co`

### Step 4: Run Your SQL Migrations

If you haven't already, run the SQL migration to create the `bounties` table:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `backend/migrations/fix_rls_policies.sql`
3. Paste and run it in the SQL Editor

### Step 5: Disable Problematic Browser Extensions (if needed)

If the JavaScript error persists:
1. Open your browser's extension manager
2. Temporarily disable extensions one by one to identify which one is causing the issue
3. The error is likely from an extension that processes page content or DOM selectors

## Common Supabase URL Patterns

✅ **Correct**:
- Dashboard: `https://app.supabase.com`
- API Base: `https://qsdrxpunfhzrouxxeskl.supabase.co`
- REST API: `https://qsdrxpunfhzrouxxeskl.supabase.co/rest/v1/bounties`
- Auth API: `https://qsdrxpunfhzrouxxeskl.supabase.co/auth/v1/...`

❌ **Incorrect**:
- Direct domain access: `qsdrxpunfhzrouxxeskl.supabase.co` (in browser)
- Without https: `http://qsdrxpunfhzrouxxeskl.supabase.co`
- With wrong path: `https://qsdrxpunfhzrouxxeskl.supabase.co/api`

## Next Steps

1. ✅ Access Supabase Dashboard correctly
2. ✅ Verify backend `.env` configuration
3. ✅ Run SQL migrations
4. ✅ Test backend connection
5. ✅ Fix/disable browser extension if needed

