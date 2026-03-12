-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 0 Migration — Heartbound Adventures
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extend users table ───────────────────────────────────────────────────────
ALTER TABLE users
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
  }';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tutorial_complete BOOLEAN DEFAULT FALSE;

-- ── Couple progress ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_progress (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id           TEXT        NOT NULL UNIQUE,
  bond_xp             INTEGER     NOT NULL DEFAULT 0,
  bond_level          INTEGER     NOT NULL DEFAULT 1,
  unlocked_islands    TEXT[]      NOT NULL DEFAULT '{}',
  milestones_reached  TEXT[]      NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_couple_progress_couple
  ON couple_progress (couple_id);

-- ── Couple home ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS couple_home (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   TEXT        NOT NULL UNIQUE,
  furniture   JSONB       NOT NULL DEFAULT '[]',
  home_theme  TEXT        NOT NULL DEFAULT 'meadow',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Memory book ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_book (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   TEXT        NOT NULL,
  entry_type  TEXT        NOT NULL CHECK (entry_type IN ('photo','first_visit','achievement','milestone','interaction')),
  title       TEXT,
  content     TEXT,
  image_url   TEXT,
  island_id   INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_book_couple
  ON memory_book (couple_id, created_at DESC);

-- ── RPG inventory ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rpg_inventory (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     TEXT        NOT NULL,
  quantity    INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_rpg_inventory_user
  ON rpg_inventory (user_id);

-- ── Daily challenges ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_challenges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id   TEXT        NOT NULL,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  challenges  JSONB       NOT NULL DEFAULT '[]',
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  UNIQUE (couple_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_couple_date
  ON daily_challenges (couple_id, date DESC);

-- ── Achievements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  TEXT        NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user
  ON achievements (user_id);

-- ── RLS policies (enable row-level security) ──────────────────────────────────
ALTER TABLE couple_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_home      ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_book      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpg_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements     ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own inventory
CREATE POLICY IF NOT EXISTS "inventory_owner" ON rpg_inventory
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only read/write their own achievements
CREATE POLICY IF NOT EXISTS "achievements_owner" ON achievements
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
