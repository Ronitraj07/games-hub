// ============================================================
// Heartbound Adventures — TypeScript Types
// ============================================================

// ── Avatar ───────────────────────────────────────────────────
export interface PlayerAvatar {
  url: string;             // Ready Player Me .glb URL
  updatedAt: string;
}

// ── Island registry ──────────────────────────────────────────
export type IslandId = 1|2|3|4|5|6|7|8|9|10|11|12;

export interface IslandConfig {
  id: IslandId;
  name: string;
  theme: string;
  size: { x: number; z: number };   // in world units (1 unit = 5m)
  spawnPoint: { x: number; z: number };
  districts: DistrictConfig[];
  npcs: NPCConfig[];
  ambientTrack: string;             // filename in /public/audio/islands/
  fogNear: number;
  fogFar: number;
  hasInterior: boolean;
  unlockCondition: string | null;   // null = always available
}

export interface DistrictConfig {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  activities: ActivityConfig[];
}

// ── NPC ───────────────────────────────────────────────────────
export interface NPCConfig {
  id: string;
  name: string;
  modelPath: string;               // e.g. '/models/npcs/luna.glb'
  position: { x: number; z: number };
  patrolPath?: { x: number; z: number }[];
  dialogues: DialogueLine[];
  xpReward: number;
  islandId: IslandId;
  role: 'quest'|'merchant'|'ambient'|'special';
}

export interface DialogueLine {
  id: string;
  text: string;
  emotion: 'neutral'|'happy'|'sad'|'excited'|'mysterious';
  triggers?: DialogueTrigger[];
}

export interface DialogueTrigger {
  type: 'give_item'|'start_quest'|'bond_xp'|'unlock_area';
  value: string | number;
}

// ── Activities ───────────────────────────────────────────────
export type ActivityType =
  | 'gather'
  | 'fish'
  | 'cook'
  | 'quest'
  | 'minigame'
  | 'couple'
  | 'explore'
  | 'build'
  | 'photo';

export interface ActivityConfig {
  id: string;
  type: ActivityType;
  name: string;
  position: { x: number; z: number };
  bondXpReward: number;
  itemRewards?: string[];
  requiresPartner: boolean;
  cooldownMinutes: number;
}

// ── Inventory ────────────────────────────────────────────────
export type ItemRarity = 'common'|'uncommon'|'rare'|'legendary';
export type ItemType = 'flower'|'crystal'|'food'|'furniture'|'key_item'|'fish'|'material';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;        // emoji or path to icon sprite
  stackable: boolean;
  maxStack: number;
  islandSrc: IslandId | null;
}

export interface InventoryItem extends ItemDef {
  quantity: number;
  obtainedAt: string;
}

// ── Bond System ──────────────────────────────────────────────
export interface CoupleProgress {
  coupleKey: string;
  bondXp: number;
  bondLevel: number;
  totalActivities: number;
  islandsVisited: IslandId[];
}

export interface BondMilestone {
  level: number;
  xpRequired: number;
  title: string;
  unlocks: string;
  celebrationColor: string;
}

export const BOND_MILESTONES: BondMilestone[] = [
  { level:1,  xpRequired:0,   title:'Strangers',      unlocks:'Basic exploration',          celebrationColor:'#94a3b8' },
  { level:2,  xpRequired:50,  title:'Acquaintances',  unlocks:'Campfire interaction',        celebrationColor:'#84cc16' },
  { level:3,  xpRequired:150, title:'Friends',        unlocks:'Gift system',                 celebrationColor:'#22d3ee' },
  { level:4,  xpRequired:300, title:'Close Friends',  unlocks:'Island 3 - Sakura Drift',    celebrationColor:'#f472b6' },
  { level:5,  xpRequired:500, title:'Companions',     unlocks:'Emote wheel + hand-holding',  celebrationColor:'#a78bfa' },
  { level:6,  xpRequired:750, title:'Partners',       unlocks:'Island 5 - Tidal Harbor',    celebrationColor:'#fb923c' },
  { level:7,  xpRequired:1000,title:'Soulmates',      unlocks:'Cooking system',              celebrationColor:'#f43f5e' },
  { level:8,  xpRequired:1400,title:'Bound Hearts',   unlocks:'Island 7 - Sunken Atoll',    celebrationColor:'#ec4899' },
  { level:9,  xpRequired:1900,title:'Eternal Bond',   unlocks:'Island 12 - The Heartland',  celebrationColor:'#e11d48' },
  { level:10, xpRequired:2500,title:'Heartbound',     unlocks:'All islands + secret area',  celebrationColor:'#be185d' },
];

// ── Player state (Firebase real-time) ────────────────────────
export interface HeartboundPlayerState {
  email: string;
  name: string;
  avatarUrl: string;
  x: number;
  z: number;
  islandId: IslandId;
  animationState: AnimationState;
  facingAngle: number;
  online: boolean;
  lastSeen: number;
}

export type AnimationState = 'idle'|'walk'|'run'|'sit'|'wave'|'dance'|'fish'|'pickup'|'talk';

// ── Weather ──────────────────────────────────────────────────
export type WeatherState = 'sunny'|'cloudy'|'rain'|'storm'|'snow'|'fog';

export interface WeatherConfig {
  state: WeatherState;
  transitionDuration: number; // seconds
  rainIntensity: number;      // 0–1
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
}

// ── Home building ────────────────────────────────────────────
export interface PlacedItem {
  id: string;
  itemId: string;
  itemName: string;
  posX: number;
  posY: number;
  posZ: number;
  rotationY: number;
  scale: number;
  placedBy: string;
  modelPath: string;
}

// ── Memory Book ──────────────────────────────────────────────
export type MemoryEntryType = 'first_visit'|'photo'|'achievement'|'bond_level'|'quest_complete';

export interface MemoryEntry {
  id: string;
  type: MemoryEntryType;
  title: string;
  description: string;
  islandId: IslandId | null;
  photoUrl: string | null;
  createdAt: string;
}

// ── Chunk system ─────────────────────────────────────────────
export interface ChunkCoord {
  cx: number;   // chunk x index
  cz: number;   // chunk z index
}

export interface ChunkData {
  coord: ChunkCoord;
  worldX: number;  // world-space origin of chunk
  worldZ: number;
  size: number;    // chunk size in units
}

// ── Quality presets ──────────────────────────────────────────
export type QualityPreset = 'ultra'|'high'|'medium'|'low';

export interface QualitySettings {
  preset: QualityPreset;
  chunkRadius: number;        // 1 = 3×3, 2 = 5×5
  grassDensity: number;       // blades per chunk
  shadowMapSize: number;      // px
  postProcessing: boolean;
  ssao: boolean;
  waterReflectionRes: number; // px
  treeLodDistance: number;    // units
  particleMultiplier: number; // 0–1
  antialias: boolean;
}

export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  ultra:  { preset:'ultra',  chunkRadius:2, grassDensity:10000, shadowMapSize:2048, postProcessing:true,  ssao:true,  waterReflectionRes:512, treeLodDistance:60, particleMultiplier:1.0, antialias:true  },
  high:   { preset:'high',   chunkRadius:1, grassDensity:6000,  shadowMapSize:1024, postProcessing:true,  ssao:false, waterReflectionRes:256, treeLodDistance:40, particleMultiplier:0.6, antialias:true  },
  medium: { preset:'medium', chunkRadius:1, grassDensity:3000,  shadowMapSize:512,  postProcessing:true,  ssao:false, waterReflectionRes:128, treeLodDistance:25, particleMultiplier:0.3, antialias:false },
  low:    { preset:'low',    chunkRadius:1, grassDensity:0,     shadowMapSize:0,    postProcessing:false, ssao:false, waterReflectionRes:0,   treeLodDistance:15, particleMultiplier:0.1, antialias:false },
};
