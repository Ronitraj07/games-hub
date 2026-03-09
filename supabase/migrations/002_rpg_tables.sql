-- Characters table for RPG games
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  mana INTEGER DEFAULT 50,
  max_mana INTEGER DEFAULT 50,
  stamina INTEGER DEFAULT 100,
  max_stamina INTEGER DEFAULT 100,
  gold INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"strength": 10, "dexterity": 10, "intelligence": 10, "vitality": 10, "luck": 10}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_class CHECK (class IN ('warrior', 'mage', 'rogue', 'archer')),
  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 100),
  CONSTRAINT valid_experience CHECK (experience >= 0),
  CONSTRAINT valid_health CHECK (health >= 0 AND health <= max_health),
  CONSTRAINT valid_mana CHECK (mana >= 0 AND mana <= max_mana),
  CONSTRAINT valid_stamina CHECK (stamina >= 0 AND stamina <= max_stamina)
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON characters FOR ALL USING (is_allowed_user());

-- Items master table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  rarity INTEGER DEFAULT 1,
  required_level INTEGER DEFAULT 1,
  stats JSONB,
  effects JSONB,
  icon_url TEXT,
  sell_price INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_type CHECK (type IN ('weapon', 'armor', 'helmet', 'boots', 'accessory', 'consumable')),
  CONSTRAINT valid_rarity CHECK (rarity BETWEEN 1 AND 5)
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_read_items" ON items FOR SELECT USING (is_allowed_user());

-- Inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  slot TEXT,
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON inventory FOR ALL USING (is_allowed_user());

-- Skills master table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  class TEXT,
  level_required INTEGER DEFAULT 1,
  cooldown INTEGER DEFAULT 0,
  mana_cost INTEGER DEFAULT 0,
  damage INTEGER DEFAULT 0,
  effect JSONB,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_read_skills" ON skills FOR SELECT USING (is_allowed_user());

-- Character skills junction table
CREATE TABLE character_skills (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id),
  level INTEGER DEFAULT 1,
  learned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (character_id, skill_id)
);

ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON character_skills FOR ALL USING (is_allowed_user());

-- Game sessions for RPG games
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL,
  player_1_id UUID REFERENCES characters(id),
  player_2_id UUID REFERENCES characters(id),
  status TEXT DEFAULT 'active',
  game_state JSONB,
  winner_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'abandoned'))
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON game_sessions FOR ALL USING (is_allowed_user());

-- Combat actions log
CREATE TABLE combat_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id),
  action_type TEXT NOT NULL,
  target_id UUID,
  skill_id UUID REFERENCES skills(id),
  item_id UUID REFERENCES items(id),
  damage_dealt INTEGER DEFAULT 0,
  healing_done INTEGER DEFAULT 0,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

ALTER TABLE combat_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whitelist_only" ON combat_actions FOR ALL USING (is_allowed_user());

-- Indexes for performance
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_user_email ON characters(user_email);
CREATE INDEX idx_inventory_character_id ON inventory(character_id);
CREATE INDEX idx_inventory_equipped ON inventory(equipped);
CREATE INDEX idx_character_skills_character_id ON character_skills(character_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_combat_actions_session_id ON combat_actions(session_id);
CREATE INDEX idx_combat_actions_timestamp ON combat_actions(timestamp);