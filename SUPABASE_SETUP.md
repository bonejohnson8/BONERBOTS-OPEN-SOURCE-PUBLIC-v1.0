# Supabase Setup Guide

This guide provides the necessary SQL script and instructions to configure your Supabase project. This will serve as **The Memory** for your application—a single, real-time source of truth for the entire simulation state.

### Step 1: Create a Supabase Project

1.  Go to [supabase.com](https://supabase.com) and create a free account if you haven't already.
2.  Click on **"New project"**.
3.  Give your project a name and generate a secure database password.
4.  Wait for your project to be provisioned.

### Step 2: Run the Setup Script

1.  Once your project is ready, navigate to the **SQL Editor** from the left-hand menu (it looks like a database icon).
2.  Click **"+ New query"**.
3.  **Copy the entire SQL script below** and paste it into the query window.
4.  Click the **"RUN"** button.

This script is idempotent, meaning you can safely run it multiple times without causing errors.

```sql
-- 1. Create the table to hold the single state object
CREATE TABLE IF NOT EXISTS public.arena_state (
  id INT4 PRIMARY KEY DEFAULT 1,
  state JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure only one row can exist in the table
ALTER TABLE public.arena_state ADD CONSTRAINT single_row_check CHECK (id = 1);

-- 3. Enable Row Level Security (RLS) on the table
-- This is a critical security step. It ensures that, by default, no one can access the table.
ALTER TABLE public.arena_state ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy that allows public read-only access
-- This policy lets anyone with the public 'anon' key read data from the table,
-- which is what our spectator clients need.
CREATE POLICY "Allow public read-only access" ON public.arena_state
  FOR SELECT
  USING (true);
  
-- NOTE: We are intentionally NOT creating policies for INSERT, UPDATE, or DELETE.
-- This means write operations are forbidden for anyone using the public 'anon' key.
-- Only requests using a privileged key (like the 'service_role' key in our worker) can write to the table.

-- 5. Add the table to the Supabase Realtime publication
-- This command tells Supabase to broadcast any changes made to this table to all subscribed clients.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'arena_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_state;
  END IF;
END $$;

-- 6. Insert the initial empty state to prevent errors on the worker's first run
INSERT INTO public.arena_state (id, state)
VALUES (1, '{"bots": [], "marketData": []}')
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Get Your Credentials

1.  Navigate to **Project Settings** (the gear icon at the bottom of the left menu).
2.  Go to the **"API"** section.
3.  Under **"Project URL"**, copy your URL. This is your `SUPABASE_URL`.
4.  Under **"Project API Keys"**, copy the `anon` `public` key. This is your `SUPABASE_ANON_KEY`.

You now have everything you need from Supabase to configure the frontend application.
