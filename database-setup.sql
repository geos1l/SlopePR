-- ============================================
-- SLOPE ROYALE - Database Setup Script
-- ============================================
-- Run this in Supabase SQL Editor to set up your database
-- This script is idempotent - safe to run multiple times

-- ============================================
-- 1. Fix the user signup trigger function
-- ============================================
-- Updates your existing trigger to handle errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, show_on_leaderboard)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    true  -- Default to showing on leaderboard
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================
-- 2. Set up RLS policies for exercises table
-- ============================================
-- Allow public read access (exercises are reference data)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to exercises" ON exercises;

CREATE POLICY "Allow public read access to exercises"
  ON exercises FOR SELECT
  USING (true);

-- ============================================
-- 3. Ensure profiles table has correct structure
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    ALTER TABLE profiles ADD COLUMN first_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    ALTER TABLE profiles ADD COLUMN last_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'clan_id') THEN
    ALTER TABLE profiles ADD COLUMN clan_id UUID;
  END IF;
  
  -- Add show_on_leaderboard column (default true - users are on leaderboard by default)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'show_on_leaderboard') THEN
    ALTER TABLE profiles ADD COLUMN show_on_leaderboard BOOLEAN DEFAULT true;
    -- Set existing users to true by default
    UPDATE profiles SET show_on_leaderboard = true WHERE show_on_leaderboard IS NULL;
  END IF;
END $$;

-- ============================================
-- 4. Set up RLS policies for profiles table
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow anyone to view profiles that are on leaderboard (for leaderboard display)
CREATE POLICY "Anyone can view leaderboard profiles"
  ON profiles FOR SELECT
  USING (show_on_leaderboard = true);

CREATE POLICY "Enable insert for authenticated users only"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 5. Set up RLS policies for logs table
-- ============================================
-- Enable RLS on logs table
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own logs" ON logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON logs;
DROP POLICY IF EXISTS "Users can update own logs" ON logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON logs;

-- Allow users to view their own logs
CREATE POLICY "Users can view own logs"
  ON logs FOR SELECT
  USING (auth.uid() = user_id);

-- Allow anyone to view logs from users who are on the leaderboard
-- This enables the leaderboard feature to work for logged-out users
CREATE POLICY "Anyone can view leaderboard user logs"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = logs.user_id
      AND profiles.show_on_leaderboard = true
    )
  );

-- Allow users to insert their own logs
CREATE POLICY "Users can insert own logs"
  ON logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own logs
CREATE POLICY "Users can update own logs"
  ON logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own logs
CREATE POLICY "Users can delete own logs"
  ON logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. Ensure logs table allows NULL weight
-- ============================================
-- Make weight column nullable (for bodyweight exercises)
DO $$
BEGIN
  -- Check if weight column exists and is not nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'logs' 
    AND column_name = 'weight' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE logs ALTER COLUMN weight DROP NOT NULL;
  END IF;
END $$;

