# How to Find Your Supabase Service Role Key

## Step-by-Step Guide

### 1. Log in to Supabase
- Go to https://supabase.com
- Sign in to your account

### 2. Select Your Project
- From the dashboard, click on your project (or create a new one if you haven't already)

### 3. Navigate to API Settings
- In the left sidebar, click on **Settings** (gear icon at the bottom)
- Then click on **API** in the settings menu

### 4. Find Your Keys
You'll see a page with several sections:

#### **Project URL**
- Located at the top under "Project URL"
- Looks like: `https://xxxxxxxxxxxxx.supabase.co`
- This is your `SUPABASE_URL`

#### **Project API keys**
This section contains multiple keys:

1. **anon** `public` key
   - This is the public/anonymous key
   - Safe to use in frontend code
   - Respects Row Level Security (RLS) policies

2. **service_role** `secret` key ⭐ **THIS IS WHAT YOU NEED**
   - This is the service role key
   - **Keep this secret!** Never expose it in frontend code
   - Bypasses Row Level Security (RLS)
   - Use this in your backend `.env` file

### 5. Copy the Service Role Key
- Click the **eye icon** 👁️ next to the `service_role` key to reveal it
- Click the **copy icon** 📋 to copy it
- Paste it into your `backend/.env` file as `SUPABASE_SERVICE_ROLE_KEY`

## Visual Guide

```
Supabase Dashboard
├── Left Sidebar
│   └── Settings (⚙️ icon at bottom)
│       └── API
│           ├── Project URL: https://xxxxx.supabase.co
│           └── Project API keys
│               ├── anon public (for frontend)
│               └── service_role secret ⭐ (for backend)
```

## Security Warning ⚠️

**IMPORTANT**: The `service_role` key has full access to your database and bypasses all security policies. 

- ✅ **DO**: Use it in your backend server code
- ✅ **DO**: Store it in `.env` file (never commit `.env` to git)
- ❌ **DON'T**: Use it in frontend/client-side code
- ❌ **DON'T**: Commit it to version control
- ❌ **DON'T**: Share it publicly

## Example `.env` File

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.example-signature
```

## Alternative: Using Anon Key

If you prefer to use the `anon` key instead (more secure but requires proper RLS policies):

1. Use `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY` in your `.env`
2. Update the RLS policies in the SQL migration to allow the operations you need
3. This is more secure but requires more configuration

For most backend use cases, the `service_role` key is recommended.

## Troubleshooting

**Can't find the Settings menu?**
- Make sure you're logged in
- Make sure you've selected a project
- The Settings icon is usually at the bottom of the left sidebar

**Key is hidden?**
- Click the eye icon 👁️ to reveal it
- You may need to confirm your password

**Key not working?**
- Make sure you copied the entire key (they're very long)
- Check for any extra spaces before/after
- Make sure you're using the `service_role` key, not the `anon` key
- Verify your project URL is correct

