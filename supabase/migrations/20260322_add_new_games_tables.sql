-- Supabase Migration: Add tables for new games
-- Created: 2026-03-22

-- 1. Detective Scenarios Table
CREATE TABLE IF NOT EXISTS public.detective_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  creator_email TEXT NOT NULL,
  suspect_data JSONB NOT NULL,
  scene_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX idx_detective_scenarios_difficulty ON public.detective_scenarios(difficulty);
CREATE INDEX idx_detective_scenarios_creator ON public.detective_scenarios(creator_email);

-- 2. Detective Results Table
CREATE TABLE IF NOT EXISTS public.detective_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_1_email TEXT NOT NULL,
  player_2_email TEXT,
  scenario_id TEXT NOT NULL,
  scenario_title TEXT NOT NULL,
  accused_suspect_id TEXT NOT NULL,
  correct_suspect_id TEXT NOT NULL,
  ending_id TEXT,
  investigation_accuracy NUMERIC(5,2) DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  evidence_found INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'vs-partner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX idx_detective_results_player1 ON public.detective_results(player_1_email);
CREATE INDEX idx_detective_results_player2 ON public.detective_results(player_2_email);
CREATE INDEX idx_detective_results_scenario ON public.detective_results(scenario_id);
CREATE INDEX idx_detective_results_created ON public.detective_results(created_at);

-- 3. Story Sessions Table
CREATE TABLE IF NOT EXISTS public.story_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_1_email TEXT NOT NULL,
  player_2_email TEXT,
  category TEXT NOT NULL CHECK (category IN ('romantic', 'adventure', 'mystery', 'comedy')),
  story_text TEXT,
  turns JSONB DEFAULT '[]'::jsonb,
  total_turns INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  exported BOOLEAN DEFAULT FALSE,
  export_format TEXT CHECK (export_format IS NULL OR export_format IN ('txt', 'html', 'pdf')),
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'vs-partner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX idx_story_sessions_player1 ON public.story_sessions(player_1_email);
CREATE INDEX idx_story_sessions_player2 ON public.story_sessions(player_2_email);
CREATE INDEX idx_story_sessions_category ON public.story_sessions(category);
CREATE INDEX idx_story_sessions_created ON public.story_sessions(created_at);
CREATE INDEX idx_story_sessions_completed ON public.story_sessions(completed_at);

-- 4. User Wheel Customizations Table
CREATE TABLE IF NOT EXISTS public.user_wheel_customs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  custom_dares JSONB DEFAULT '[]'::jsonb,
  favorite_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  difficulty_preference TEXT DEFAULT 'mild' CHECK (difficulty_preference IN ('mild', 'medium', 'spicy')),
  spicy_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX idx_user_wheel_customs_email ON public.user_wheel_customs(user_email);

-- 5. Scrabble Games Table
CREATE TABLE IF NOT EXISTS public.scrabble_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_1_email TEXT NOT NULL,
  player_2_email TEXT,
  final_scores JSONB NOT NULL,
  board_state JSONB,
  moves JSONB[] DEFAULT ARRAY[]::JSONB[],
  series_id TEXT,
  series_round INTEGER,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'vs-partner', 'vs-ai')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX idx_scrabble_games_player1 ON public.scrabble_games(player_1_email);
CREATE INDEX idx_scrabble_games_player2 ON public.scrabble_games(player_2_email);
CREATE INDEX idx_scrabble_games_series ON public.scrabble_games(series_id);
CREATE INDEX idx_scrabble_games_created ON public.scrabble_games(created_at);

-- 6. Extend existing game_results table with new metadata columns
ALTER TABLE public.game_results
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS game_duration_seconds INTEGER DEFAULT NULL;

-- Create index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_game_results_metadata ON public.game_results USING GIN(metadata);

-- 7. Grant permissions
GRANT ALL ON public.detective_scenarios TO authenticated;
GRANT ALL ON public.detective_results TO authenticated;
GRANT ALL ON public.story_sessions TO authenticated;
GRANT ALL ON public.user_wheel_customs TO authenticated;
GRANT ALL ON public.scrabble_games TO authenticated;

-- 8. Enable Row Level Security (optional but recommended)
ALTER TABLE public.detective_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detective_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wheel_customs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrabble_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow users to see their own data
CREATE POLICY "Users can view their own detective results"
  ON public.detective_results
  FOR SELECT USING (
    auth.jwt() ->> 'email' = player_1_email
    OR auth.jwt() ->> 'email' = player_2_email
  );

CREATE POLICY "Users can view their own stories"
  ON public.story_sessions
  FOR SELECT USING (
    auth.jwt() ->> 'email' = player_1_email
    OR auth.jwt() ->> 'email' = player_2_email
  );

CREATE POLICY "Users can view their own scrabble games"
  ON public.scrabble_games
  FOR SELECT USING (
    auth.jwt() ->> 'email' = player_1_email
    OR auth.jwt() ->> 'email' = player_2_email
  );

CREATE POLICY "Users can manage their own wheel customizations"
  ON public.user_wheel_customs
  FOR ALL USING (auth.jwt() ->> 'email' = user_email);
