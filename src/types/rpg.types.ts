// Character Types
export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'archer';

export interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  vitality: number;
  luck: number;
}

export interface Character {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  stats: CharacterStats;
  createdAt: string;
  updatedAt: string;
}

// Item Types
export type ItemType = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'consumable';
export type Rarity = 1 | 2 | 3 | 4 | 5;

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  requiredLevel: number;
  stats?: Partial<CharacterStats>;
  effects?: Record<string, any>;
  iconUrl?: string;
  sellPrice: number;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  characterId: string;
  itemId: string;
  item?: Item;
  slot?: string;
  quantity: number;
  equipped: boolean;
  acquiredAt: string;
}

// Skill Types
export interface Skill {
  id: string;
  name: string;
  description: string;
  class?: CharacterClass;
  levelRequired: number;
  cooldown: number;
  manaCost: number;
  damage: number;
  effect?: Record<string, any>;
  iconUrl?: string;
  createdAt: string;
}

export interface CharacterSkill {
  characterId: string;
  skillId: string;
  skill?: Skill;
  level: number;
  learnedAt: string;
}

// Combat Types
export type ActionType = 'attack' | 'skill' | 'item' | 'defend' | 'flee';

export interface CombatAction {
  id: string;
  sessionId: string;
  characterId: string;
  actionType: ActionType;
  targetId?: string;
  skillId?: string;
  itemId?: string;
  damageDealt: number;
  healingDone: number;
  data?: Record<string, any>;
  timestamp: string;
}

// Game Session Types
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface GameSession {
  id: string;
  gameType: string;
  player1Id: string;
  player2Id: string;
  status: SessionStatus;
  gameState?: Record<string, any>;
  winnerId?: string;
  startedAt: string;
  endedAt?: string;
}