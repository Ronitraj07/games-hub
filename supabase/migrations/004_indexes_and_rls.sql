-- Additional indexes for optimization
CREATE INDEX idx_characters_level ON characters(level DESC);
CREATE INDEX idx_characters_created_at ON characters(created_at DESC);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_rarity ON items(rarity DESC);
CREATE INDEX idx_inventory_item_id ON inventory(item_id);
CREATE INDEX idx_skills_class ON skills(class);
CREATE INDEX idx_game_sessions_started_at ON game_sessions(started_at DESC);
CREATE INDEX idx_game_sessions_ended_at ON game_sessions(ended_at DESC);

-- Function to update character's updated_at timestamp
CREATE OR REPLACE FUNCTION update_character_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for character updates
CREATE TRIGGER character_updated
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_character_timestamp();

-- Function to update player_stats updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for player_stats updates
CREATE TRIGGER player_stats_updated
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_timestamp();

-- Grant appropriate permissions
GRANT SELECT ON leaderboard TO authenticated;
GRANT ALL ON characters TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON character_skills TO authenticated;
GRANT ALL ON game_sessions TO authenticated;
GRANT ALL ON combat_actions TO authenticated;
GRANT ALL ON game_history TO authenticated;
GRANT ALL ON player_stats TO authenticated;
GRANT SELECT ON items TO authenticated;
GRANT SELECT ON skills TO authenticated;