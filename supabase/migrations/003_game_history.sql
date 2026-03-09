-- Game history table for all games
CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL,
  player_1_email TEXT NOT NULL,
  player_2_email TEXT NOT NULL,
  winner_email TEXT,
  game_data JSONB,
  duration_seconds INTEGER,
  played_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_players CHECK (
    player_1_email IN ('sinharonitraj@gmail.com', 'radhikadidwania567@gmail.com') AND
    player_2_email IN ('sinharonitraj@gmail.com', 'radhikadidwania567@gmail.com')
  )
);

ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON game_history FOR ALL USING (is_allowed_user());

-- Player stats table
CREATE TABLE player_stats (
  user_email TEXT PRIMARY KEY,
  total_games_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  favorite_game TEXT,
  total_playtime_seconds INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_user CHECK (user_email IN ('sinharonitraj@gmail.com', 'radhikadidwania567@gmail.com'))
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON player_stats FOR ALL USING (is_allowed_user());

-- Insert initial player stats
INSERT INTO player_stats (user_email) VALUES
  ('sinharonitraj@gmail.com'),
  ('radhikadidwania567@gmail.com');

-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT 
  user_email,
  total_games_played,
  total_wins,
  total_losses,
  total_draws,
  ROUND(
    CASE 
      WHEN total_games_played > 0 
      THEN (total_wins::DECIMAL / total_games_played::DECIMAL) * 100 
      ELSE 0 
    END, 
    2
  ) as win_rate,
  favorite_game,
  total_playtime_seconds
FROM player_stats
ORDER BY total_wins DESC, win_rate DESC;

-- Indexes for performance
CREATE INDEX idx_game_history_player_1 ON game_history(player_1_email);
CREATE INDEX idx_game_history_player_2 ON game_history(player_2_email);
CREATE INDEX idx_game_history_played_at ON game_history(played_at DESC);
CREATE INDEX idx_game_history_game_type ON game_history(game_type);