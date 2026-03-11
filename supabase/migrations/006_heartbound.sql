-- ============================================================
-- Migration 006 — Heartbound Adventures tables
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- ============================================================

-- ── Player profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.player_profiles (
  email             TEXT PRIMARY KEY,
  display_name      TEXT,
  avatar_url        TEXT,
  avatar_updated_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select"      ON public.player_profiles;
DROP POLICY IF EXISTS "profiles_insert"      ON public.player_profiles;
DROP POLICY IF EXISTS "profiles_update"      ON public.player_profiles;
DROP POLICY IF EXISTS "profiles_select_own"  ON public.player_profiles;
DROP POLICY IF EXISTS "profiles_upsert_own"  ON public.player_profiles;
CREATE POLICY "profiles_select" ON public.player_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.player_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.player_profiles FOR UPDATE USING (true);

-- ── Couple progress ───────────────────────────────────────────────
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
DROP POLICY IF EXISTS "couple_progress_select" ON public.couple_progress;
DROP POLICY IF EXISTS "couple_progress_upsert" ON public.couple_progress;
DROP POLICY IF EXISTS "couple_progress_insert" ON public.couple_progress;
DROP POLICY IF EXISTS "couple_progress_update" ON public.couple_progress;
CREATE POLICY "couple_progress_select" ON public.couple_progress FOR SELECT USING (true);
CREATE POLICY "couple_progress_insert" ON public.couple_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "couple_progress_update" ON public.couple_progress FOR UPDATE USING (true);

-- ── RPG Inventory ──────────────────────────────────────────────────
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
DROP POLICY IF EXISTS "inventory_own"    ON public.rpg_inventory;
DROP POLICY IF EXISTS "inventory_select" ON public.rpg_inventory;
DROP POLICY IF EXISTS "inventory_insert" ON public.rpg_inventory;
DROP POLICY IF EXISTS "inventory_update" ON public.rpg_inventory;
DROP POLICY IF EXISTS "inventory_delete" ON public.rpg_inventory;
CREATE POLICY "inventory_select" ON public.rpg_inventory FOR SELECT USING (true);
CREATE POLICY "inventory_insert" ON public.rpg_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "inventory_update" ON public.rpg_inventory FOR UPDATE USING (true);
CREATE POLICY "inventory_delete" ON public.rpg_inventory FOR DELETE USING (true);

-- ── Couple Home ─────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS "home_select" ON public.couple_home;
DROP POLICY IF EXISTS "home_modify" ON public.couple_home;
DROP POLICY IF EXISTS "home_insert" ON public.couple_home;
DROP POLICY IF EXISTS "home_update" ON public.couple_home;
DROP POLICY IF EXISTS "home_delete" ON public.couple_home;
CREATE POLICY "home_select" ON public.couple_home FOR SELECT USING (true);
CREATE POLICY "home_insert" ON public.couple_home FOR INSERT WITH CHECK (true);
CREATE POLICY "home_update" ON public.couple_home FOR UPDATE USING (true);
CREATE POLICY "home_delete" ON public.couple_home FOR DELETE USING (true);

-- ── Memory Book ─────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS "memory_select" ON public.memory_book;
DROP POLICY IF EXISTS "memory_insert" ON public.memory_book;
DROP POLICY IF EXISTS "memory_delete" ON public.memory_book;
CREATE POLICY "memory_select" ON public.memory_book FOR SELECT USING (true);
CREATE POLICY "memory_insert" ON public.memory_book FOR INSERT WITH CHECK (true);
CREATE POLICY "memory_delete" ON public.memory_book FOR DELETE USING (true);

-- ── Daily Challenges ─────────────────────────────────────────────
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
DROP POLICY IF EXISTS "challenges_select" ON public.daily_challenges;
DROP POLICY IF EXISTS "challenges_modify" ON public.daily_challenges;
DROP POLICY IF EXISTS "challenges_insert" ON public.daily_challenges;
DROP POLICY IF EXISTS "challenges_update" ON public.daily_challenges;
DROP POLICY IF EXISTS "challenges_delete" ON public.daily_challenges;
CREATE POLICY "challenges_select" ON public.daily_challenges FOR SELECT USING (true);
CREATE POLICY "challenges_insert" ON public.daily_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "challenges_update" ON public.daily_challenges FOR UPDATE USING (true);
CREATE POLICY "challenges_delete" ON public.daily_challenges FOR DELETE USING (true);

-- ── NPC Interactions ───────────────────────────────────────────────
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
DROP POLICY IF EXISTS "npc_own"    ON public.npc_interactions;
DROP POLICY IF EXISTS "npc_select" ON public.npc_interactions;
DROP POLICY IF EXISTS "npc_insert" ON public.npc_interactions;
DROP POLICY IF EXISTS "npc_update" ON public.npc_interactions;
CREATE POLICY "npc_select" ON public.npc_interactions FOR SELECT USING (true);
CREATE POLICY "npc_insert" ON public.npc_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "npc_update" ON public.npc_interactions FOR UPDATE USING (true);

-- ── Achievements ───────────────────────────────────────────────────
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
DROP POLICY IF EXISTS "achievements_own"    ON public.achievements;
DROP POLICY IF EXISTS "achievements_select" ON public.achievements;
DROP POLICY IF EXISTS "achievements_insert" ON public.achievements;
DROP POLICY IF EXISTS "achievements_delete" ON public.achievements;
CREATE POLICY "achievements_select" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "achievements_insert" ON public.achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "achievements_delete" ON public.achievements FOR DELETE USING (true);

-- ── updated_at triggers ──────────────────────────────────────────
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

-- ── Bond XP RPC ──────────────────────────────────────────────────
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
