// ─────────────────────────────────────────────────────────────────────────────
// character/constants.ts  —  All palette / style option arrays
// ─────────────────────────────────────────────────────────────────────────────
import type {
  AvatarConfig, CapeStyle, HairStyle, MaskStyle, OutfitStyle, SkinTone,
} from './types';

// ── Skin tones ────────────────────────────────────────────────────────────────
export const SKIN_TONE_MAP: Record<SkinTone, string> = {
  pale:  '#fef0e6',
  warm:  '#fde7c3',
  peach: '#f5cba7',
  tan:   '#d4a574',
  brown: '#c68642',
  dark:  '#8d5524',
  ebony: '#5c3317',
  cool:  '#ead5c0',
};

// ── Hair colour presets ───────────────────────────────────────────────────────
export const HAIR_COLORS: string[] = [
  '#1a1a1a', '#3b1f0a', '#7c4b1e', '#c8a96e',
  '#d4af37', '#cc0000', '#9b59b6', '#2196f3',
  '#00c0a0', '#f1f1f1',
];

// ── Cape style labels ─────────────────────────────────────────────────────────
export const CAPE_STYLE_LABELS: Record<CapeStyle, string> = {
  standard: 'Standard',
  wide:     'Wide',
  split:    'Split',
  star:     'Star',
  tattered: 'Tattered',
  elegant:  'Elegant',
  seasonal: 'Seasonal',
  couples:  '💕 Couples',
};

// ── Hair style labels ─────────────────────────────────────────────────────────
export const HAIR_STYLE_LABELS: Record<HairStyle, string> = {
  flowing:    'Flowing',
  short:      'Short',
  braided:    'Braided',
  wild:       'Wild',
  bun:        'Bun',
  windswept:  'Windswept',
  ponytail:   'Ponytail',
  crownbraid: 'Crown Braid',
  curly:      'Curly',
  none:       'None',
};

// ── Mask style labels ─────────────────────────────────────────────────────────
export const MASK_STYLE_LABELS: Record<MaskStyle, string> = {
  none:     'None',
  leaf:     '🍃 Leaf',
  star:     '⭐ Star',
  crescent: '🌙 Crescent',
  smile:    '😊 Smile',
  flower:   '🌸 Flower',
  feather:  '🪶 Feather',
  crystal:  '💎 Crystal',
};

// ── Outfit style labels ───────────────────────────────────────────────────────
export const OUTFIT_STYLE_LABELS: Record<OutfitStyle, string> = {
  wanderer: 'Wanderer',
  mage:     'Mage',
  farmer:   'Farmer',
  dancer:   'Dancer',
  traveler: 'Traveler',
  guardian: 'Guardian',
};

// ── Outfit colour presets ─────────────────────────────────────────────────────
export const OUTFIT_COLORS: string[] = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#8b5cf6', '#f97316',
  '#64748b', '#0ea5e9', '#84cc16', '#e11d48',
];

// ── Accent colour presets ─────────────────────────────────────────────────────
export const ACCENT_COLORS: string[] = [
  '#f472b6', '#a78bfa', '#34d399', '#fbbf24',
  '#fb923c', '#38bdf8', '#e879f9', '#ffffff',
];

// ── Default avatar ────────────────────────────────────────────────────────────
export const DEFAULT_AVATAR: AvatarConfig = {
  capeColor:   '#6366f1',
  capeAccent:  '#a78bfa',
  capeStyle:   'standard',
  hairStyle:   'flowing',
  hairColor:   '#3b1f0a',
  maskStyle:   'none',
  outfitStyle: 'wanderer',
  outfitColor: '#6366f1',
  accentColor: '#f472b6',
  skinTone:    'warm',
  height:      1.0,
};

// ── World constants ───────────────────────────────────────────────────────────
export const WORLD_SPAWN     = { x: 505, y: 0, z: 505 } as const; // Island 1 spawn (centre of 1000×1000)
export const POND_RADIUS     = 3.8;
export const CHUNK_SIZE      = 100;   // each terrain chunk is 100×100 units
export const GRID_CELLS      = 10;    // 10×10 grid = 1000×1000 island
export const NPC_CULL_DIST   = 35;    // NPCs beyond this are unmounted
export const TREE_LOD_FULL   = 50;    // full mesh below this
export const TREE_LOD_BILL   = 120;   // billboard below this, culled above

// ── Camera constants ──────────────────────────────────────────────────────────
export const CAM_BASE_DIST   = 5.0;
export const CAM_HEAD_TARGET = 1.4;
export const CAM_FOV         = 68;
export const CAM_SHOULDER_X  = 0.5;
export const CAM_PITCH_MIN   = 0.05;
export const CAM_PITCH_MAX   = 1.1;
export const CAM_ZOOM_MIN    = 2.0;
export const CAM_ZOOM_MAX    = 14.0;
export const CAM_SPRING_ROT  = 8.0;
export const CAM_SPRING_POS  = 10.0;

// ── Movement constants ────────────────────────────────────────────────────────
export const MOVE_SPEED_WALK = 0.09;
export const MOVE_SPEED_RUN  = 0.18;  // hold Shift
export const MOVE_SPEED_FLY  = 0.14;
