# How to Run the SQL Migration in Supabase

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Log in and select your project

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query** button (top right)

3. **Copy and Paste the SQL**
   - Copy the entire contents of `create_bounties_table.sql`
   - Paste it into the SQL editor

4. **Run the Migration**
   - Click **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for "Success" message

5. **Verify**
   - Go to **Table Editor** in the left sidebar
   - You should see the `bounties` table listed

## Full SQL to Copy

Copy everything below this line:

---

```sql
-- Create bounties table for Supabase
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bounties table
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- On-chain data
  contract_id BIGINT UNIQUE NOT NULL,
  client_address VARCHAR(58) NOT NULL CHECK (client_address ~ '^[A-Z2-7]{58}$'),
  freelancer_address VARCHAR(58) CHECK (freelancer_address IS NULL OR freelancer_address ~ '^[A-Z2-7]{58}$'),
  verifier_address VARCHAR(58) CHECK (verifier_address IS NULL OR verifier_address ~ '^[A-Z2-7]{58}$'),
  amount DECIMAL(18, 6) NOT NULL CHECK (amount >= 0.001),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'approved', 'claimed', 'refunded')),
  
  -- Off-chain metadata
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Submissions (stored as JSONB array)
  submissions JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bounties_contract_id ON bounties(contract_id);
CREATE INDEX IF NOT EXISTS idx_bounties_client_address ON bounties(client_address);
CREATE INDEX IF NOT EXISTS idx_bounties_freelancer_address ON bounties(freelancer_address);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bounties_updated_at 
  BEFORE UPDATE ON bounties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- For service role key, RLS is bypassed, but for anon key, you'll need these policies
CREATE POLICY "Allow all operations for service role" ON bounties
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Visual Guide

```
Supabase Dashboard
├── Left Sidebar
│   └── SQL Editor (📝 icon)
│       └── New Query button
│           └── Paste SQL here
│               └── Click Run (▶️) or Ctrl+Enter
```

## Expected Result

After running successfully, you should see:
- ✅ "Success. No rows returned" message
- The `bounties` table appears in **Table Editor**

## Troubleshooting

**Error: "relation already exists"**
- The table already exists, which is fine
- The `CREATE TABLE IF NOT EXISTS` prevents errors

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check that you have the correct permissions

**Error: "extension uuid-ossp does not exist"**
- This is rare, but if it happens, contact Supabase support
- The extension should be available by default

## Next Steps

After running the migration:
1. Verify the table exists in **Table Editor**
2. Configure your `.env` file with Supabase credentials
3. Test your backend connection

