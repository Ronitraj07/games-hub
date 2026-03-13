-- Avatar system migration
-- Run this in your Supabase SQL editor

-- Add avatar columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_type TEXT CHECK (avatar_type IN ('vroid', 'default')),
  ADD COLUMN IF NOT EXISTS avatar_data JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_type ON profiles(avatar_type);

-- Example of what avatar_data looks like:
-- For default avatar:
-- { "baseModel": "character_1", "skinTone": "#FDDBB4", "hairColor": "#1A1A1A", "outfitColor": "#5DADE2" }
--
-- For VRoid avatar:
-- { "vroidAvatarUrl": "https://hub.vroid.com/characters/...", "vroidUserId": "12345" }
