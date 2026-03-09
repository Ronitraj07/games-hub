# Database Schema Documentation

Complete database architecture for Couple Games Hub with Firebase Realtime Database and Supabase PostgreSQL.

## Overview

**Database Strategy**:
- **Firebase Realtime Database**: Real-time game sessions, presence, simple game data
- **Supabase PostgreSQL**: User data, RPG systems, game history, analytics

---

## Firebase Realtime Database Structure

### Sessions Node

Stores active game sessions with real-time updates.

```json
{
  "sessions": {
    "sessionId_123": {
      "gameType": "tictactoe",
      "players": {
        "player1": "sinharonitraj@gmail.com",
        "player2": "radhikadidwania567@gmail.com"
      },
      "gameState": {
        "board": [null, "X", null, "O", "X", null, null, null, "O"],
        "currentTurn": "X",
        "winner": null,
        "status": "active"
      },
      "createdAt": 1709997600000,
      "lastMove": 1709997650000
    }
  }
}
```

**Fields**:
- `gameType`: string (tictactoe, connect4, wordscramble, etc.)
- `players`: object with player1 and player2 emails
- `gameState`: object (varies by game type)
- `createdAt`: timestamp
- `lastMove`: timestamp

### Presence Node

Tracks online/offline status of users.

```json
{
  "presence": {
    "userId_abc": {
      "email": "sinharonitraj@gmail.com",
      "status": "online",
      "lastSeen": 1709997700000,
      "currentGame": "sessionId_123"
    }
  }
}
```

**Fields**:
- `email`: string
- `status`: "online" | "offline" | "in-game"
- `lastSeen`: timestamp
- `currentGame`: string (session ID) or null

---

## Supabase PostgreSQL Schema

### 1. allowed_emails

**Purpose**: Whitelist of authorized users

**Schema**:
```sql
CREATE TABLE allowed_emails (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW()
);
```

**Sample Data**:
| email | name | added_at |
|-------|------|----------|
| sinharonitraj@gmail.com | Ronit | 2026-03-09 14:22:00 |
| radhikadidwania567@gmail.com | Radhika | 2026-03-09 14:22:00 |

**RLS Policy**: Read-only for authenticated users

---

### 2. characters

**Purpose**: RPG character data for Dungeon Crawlers and Battle Arena

**Schema**:
```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL, -- warrior, mage, rogue, archer
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
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**JSONB stats structure**:
```json
{
  "strength": 10,
  "dexterity": 10,
  "intelligence": 10,
  "vitality": 10,
  "luck": 10
}
```

**Indexes**:
- `idx_characters_user_id` on `user_id`
- `idx_characters_user_email` on `user_email`

**RLS Policy**: Users can only access their own characters

---

### 3. items

**Purpose**: Master list of all items in RPG games

**Schema**:
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- weapon, armor, helmet, boots, accessory, consumable
  rarity INTEGER DEFAULT 1, -- 1-5 (common to legendary)
  required_level INTEGER DEFAULT 1,
  stats JSONB,
  effects JSONB,
  icon_url TEXT,
  sell_price INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**JSONB stats example**:
```json
{
  "attack": 15,
  "defense": 5,
  "speed": 2
}
```

**JSONB effects example**:
```json
{
  "heal": 50,
  "buff_duration": 10,
  "buff_type": "strength"
}
```

**RLS Policy**: Read-only for authenticated users

---

### 4. inventory

**Purpose**: Character inventory and equipped items

**Schema**:
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  slot TEXT, -- weapon, armor, helmet, boots, accessory1, accessory2, bag1-20
  quantity INTEGER DEFAULT 1,
  equipped BOOLEAN DEFAULT FALSE,
  acquired_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_inventory_character_id` on `character_id`
- `idx_inventory_equipped` on `equipped`

**RLS Policy**: Users can only access inventory of their own characters

---

### 5. skills

**Purpose**: Master list of all skills/abilities

**Schema**:
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  class TEXT, -- warrior, mage, rogue, archer, or null for universal
  level_required INTEGER DEFAULT 1,
  cooldown INTEGER DEFAULT 0, -- seconds
  mana_cost INTEGER DEFAULT 0,
  damage INTEGER DEFAULT 0,
  effect JSONB,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**JSONB effect example**:
```json
{
  "type": "damage_over_time",
  "duration": 5,
  "tick_damage": 10,
  "debuff": "poison"
}
```

**RLS Policy**: Read-only for authenticated users

---

### 6. character_skills

**Purpose**: Skills learned by each character

**Schema**:
```sql
CREATE TABLE character_skills (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id),
  level INTEGER DEFAULT 1,
  learned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (character_id, skill_id)
);
```

**Index**:
- `idx_character_skills_character_id` on `character_id`

**RLS Policy**: Users can only access skills of their own characters

---

### 7. game_sessions

**Purpose**: RPG game session tracking

**Schema**:
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL, -- dungeon_crawlers, battle_arena
  player_1_id UUID REFERENCES characters(id),
  player_2_id UUID REFERENCES characters(id),
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  game_state JSONB,
  winner_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);
```

**JSONB game_state example** (Dungeon Crawlers):
```json
{
  "current_floor": 3,
  "current_room": 5,
  "enemies_defeated": 12,
  "loot_collected": ["uuid1", "uuid2"],
  "team_health": {"player1": 80, "player2": 65}
}
```

**Index**:
- `idx_game_sessions_status` on `status`

**RLS Policy**: Users can only access their own game sessions

---

### 8. combat_actions

**Purpose**: Log of all combat actions in RPG games

**Schema**:
```sql
CREATE TABLE combat_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id),
  action_type TEXT NOT NULL, -- attack, skill, item, defend
  target_id UUID,
  skill_id UUID REFERENCES skills(id),
  item_id UUID REFERENCES items(id),
  damage_dealt INTEGER DEFAULT 0,
  healing_done INTEGER DEFAULT 0,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_combat_actions_session_id` on `session_id`
- `idx_combat_actions_timestamp` on `timestamp`

**RLS Policy**: Users can only access combat actions from their own sessions

---

### 9. game_history

**Purpose**: Historical record of all games played

**Schema**:
```sql
CREATE TABLE game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL,
  player_1_email TEXT NOT NULL,
  player_2_email TEXT NOT NULL,
  winner_email TEXT,
  game_data JSONB,
  duration_seconds INTEGER,
  played_at TIMESTAMP DEFAULT NOW()
);
```

**JSONB game_data example**:
```json
{
  "final_score": {"player1": 3, "player2": 2},
  "total_moves": 25,
  "winning_move": "X placed at [2,2]"
}
```

**Indexes**:
- `idx_game_history_player_1` on `player_1_email`
- `idx_game_history_player_2` on `player_2_email`
- `idx_game_history_played_at` on `played_at DESC`
- `idx_game_history_game_type` on `game_type`

**RLS Policy**: Users can only access games they participated in

---

### 10. player_stats

**Purpose**: Aggregate statistics for each player

**Schema**:
```sql
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
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**JSONB achievements example**:
```json
[
  {
    "id": "first_win",
    "name": "First Victory",
    "unlocked_at": "2026-03-09T14:30:00Z"
  },
  {
    "id": "win_streak_5",
    "name": "On Fire!",
    "unlocked_at": "2026-03-10T16:45:00Z"
  }
]
```

**RLS Policy**: Users can only access their own stats

---

### 11. leaderboard (View)

**Purpose**: Computed leaderboard view

**Schema**:
```sql
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
```

---

## Security Functions

### is_allowed_user()

Checks if current authenticated user is in whitelist.

```sql
CREATE OR REPLACE FUNCTION is_allowed_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_emails 
    WHERE email = auth.email()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### current_user_email()

Returns email of current authenticated user.

```sql
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.email();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Database Relationships

```
allowed_emails (2 rows fixed)

characters
├── inventory → items
├── character_skills → skills
├── game_sessions (as player_1 or player_2)
└── combat_actions

game_sessions
└── combat_actions

game_history (standalone)

player_stats (2 rows, 1 per user)
└── leaderboard (view)
```

---

## Migration Order

1. **001_email_whitelist.sql**: Core security and whitelist
2. **002_rpg_tables.sql**: RPG system tables
3. **003_game_history.sql**: Game tracking and stats
4. **004_indexes_and_rls.sql**: Performance and security

---

## Backup Strategy

### Supabase
- Automatic daily backups (retained 7 days on free tier)
- Manual backups: Dashboard → Database → Backups

### Firebase
- Automated exports (paid plan)
- Manual export: Firebase Console → Realtime Database → Export JSON

---

## Performance Considerations

### Indexes Created
- All foreign keys automatically indexed
- Email columns for fast user lookups
- Timestamp columns for chronological queries
- Status columns for filtering active data
- Equipped column for inventory queries

### Query Optimization
- Use JSONB indexes for frequently queried JSON fields
- Limit query results with pagination
- Use views for complex aggregations (leaderboard)

---

**Last Updated**: March 9, 2026
**Schema Version**: 1.0.0