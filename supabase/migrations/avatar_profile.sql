-- Avatar Profile Migration
-- Creates the profiles table with avatar support
-- Run this in your Supabase SQL Editor

-- 1. Create the profiles table (linked to Firebase UID)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,              -- Firebase UID (e.g. "abc123xyz")
  email TEXT,                       -- Player email from Firebase
  display_name TEXT,                -- Player display name
  avatar_type TEXT CHECK (avatar_type IN ('vroid', 'default')),
  avatar_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_type ON profiles(avatar_type);

-- 3. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: anyone can read/write (since we use Firebase auth, not Supabase auth)
-- We rely on Firebase UID matching for security
CREATE POLICY "Allow all operations on profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Done!
-- avatar_data examples:
-- Default: { "baseModel": "character_1", "skinTone": "#FDDBB4", "hairColor": "#1A1A1A", "outfitColor": "#5DADE2" }
-- VRoid:   { "vroidAvatarUrl": "https://hub.vroid.com/characters/...", "vroidUserId": "12345" }
