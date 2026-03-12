-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 0 Migration — Heartbound Adventures
-- Firebase Google Auth + Supabase DB (no Supabase Auth)
-- Existing tables use: couple_key, user_email, player_profiles
-- This migration ONLY adds missing columns — does NOT recreate existing tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ── player_profiles: add avatar_config + tutorial_complete ──────────────────────
ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{
    "capeColor":   "#6366f1",
    "capeAccent":  "#a78bfa",
    "capeStyle":   "standard",
    "hairStyle":   "flowing",
    "hairColor":   "#3b1f0a",
    "maskStyle":   "none",
    "outfitStyle": "wanderer",
    "outfitColor": "#6366f1",
    "accentColor": "#f472b6",
    "skinTone":    "warm",
    "height":      1.0
  }',
  ADD COLUMN IF NOT EXISTS tutorial_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- ── rpg_inventory: add description + emoji columns ──────────────────────────────
ALTER TABLE rpg_inventory
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS emoji       TEXT;

-- ── couple_progress: add milestones_reached ────────────────────────────────────
ALTER TABLE couple_progress
  ADD COLUMN IF NOT EXISTS milestones_reached TEXT[] NOT NULL DEFAULT '{}';

-- ── Verify ──────────────────────────────────────────────────────────────────────
SELECT 'Phase 0 migration complete ✅' AS status;
