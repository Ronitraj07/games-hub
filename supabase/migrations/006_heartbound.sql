-- ============================================================
-- Migration 006 — Heartbound Adventures tables
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Player profiles (avatar URL + display name) ──────────────
-- Your schema has no 'profiles' table so we create it here.
CREATE TABLE IF NOT EXISTS public.player_profiles (
  email             TEXT PRIMARY KEY,
  display_name      TEXT,
  avatar_url        TEXT,
  avatar_updated_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.player_profiles
  FOR SELECT USING (email = auth.jwt()->>'email');
CREATE POLICY "profiles_upsert_own" ON public.player_profiles
  FOR ALL USING (email = auth.jwt()->>'email');

-- ── Couple progress ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.couple_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_key        TEXT UNIQUE NOT NULL,
  bond_xp           INTEGER NOT NULL DEFAULT 0,
  bond_level        INTEGER NOT NULL DEFAULT 1,
  total_activities  INTEGER NOT NULL DEFAULT 0,
  islands_visited   TEXT[]  NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.couple_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "couple_progress_select" ON public.couple_progress
  FOR SELECT USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');
CREATE POLICY "couple_progress_upsert" ON public.couple_progress
  FOR ALL USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');

-- ── RPG Inventory (per player) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rpg_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email  TEXT NOT NULL,
  item_id     TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  item_type   TEXT NOT NULL,
  rarity      TEXT NOT NULL DEFAULT 'common',
  quantity    INTEGER NOT NULL DEFAULT 1,
  island_src  TEXT,
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_email, item_id)
);

ALTER TABLE public.rpg_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_own" ON public.rpg_inventory
  FOR ALL USING (user_email = auth.jwt()->>'email');

-- ── Couple Home (Island 12 furniture) ────────────────────────
CREATE TABLE IF NOT EXISTS public.couple_home (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_key   TEXT NOT NULL,
  item_id      TEXT NOT NULL,
  item_name    TEXT NOT NULL,
  pos_x        FLOAT NOT NULL DEFAULT 0,
  pos_y        FLOAT NOT NULL DEFAULT 0,
  pos_z        FLOAT NOT NULL DEFAULT 0,
  rotation_y   FLOAT NOT NULL DEFAULT 0,
  scale        FLOAT NOT NULL DEFAULT 1,
  placed_by    TEXT NOT NULL,
  placed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.couple_home ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_select" ON public.couple_home
  FOR SELECT USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');
CREATE POLICY "home_modify" ON public.couple_home
  FOR ALL USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');

-- ── Memory Book ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memory_book (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_key  TEXT NOT NULL,
  entry_type  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  island_id   INTEGER,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_book ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memory_select" ON public.memory_book
  FOR SELECT USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');
CREATE POLICY "memory_insert" ON public.memory_book
  FOR INSERT WITH CHECK (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');

-- ── Daily Challenges ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_key   TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  xp_reward    INTEGER NOT NULL DEFAULT 10,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(couple_key, challenge_id, expires_at)
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select" ON public.daily_challenges
  FOR SELECT USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');
CREATE POLICY "challenges_modify" ON public.daily_challenges
  FOR ALL USING (couple_key ILIKE '%' || (auth.jwt()->>'email') || '%');

-- ── NPC Interaction Log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.npc_interactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT NOT NULL,
  npc_id       TEXT NOT NULL,
  island_id    INTEGER NOT NULL,
  times_talked INTEGER NOT NULL DEFAULT 1,
  last_talked  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_email, npc_id)
);

ALTER TABLE public.npc_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "npc_own" ON public.npc_interactions
  FOR ALL USING (user_email = auth.jwt()->>'email');

-- ── Achievements ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email     TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  icon           TEXT,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_email, achievement_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_own" ON public.achievements
  FOR ALL USING (user_email = auth.jwt()->>'email');

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS couple_progress_updated_at ON public.couple_progress;
CREATE TRIGGER couple_progress_updated_at
  BEFORE UPDATE ON public.couple_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS player_profiles_updated_at ON public.player_profiles;
CREATE TRIGGER player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Bond XP RPC (atomic increment) ───────────────────────────
CREATE OR REPLACE FUNCTION increment_bond_xp(p_couple_key TEXT, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO public.couple_progress (couple_key, bond_xp)
    VALUES (p_couple_key, GREATEST(0, p_delta))
  ON CONFLICT (couple_key) DO UPDATE
    SET bond_xp    = couple_progress.bond_xp + GREATEST(0, p_delta),
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
