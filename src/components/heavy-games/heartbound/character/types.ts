// ─────────────────────────────────────────────────────────────────────────────
// character/types.ts  —  All shared types for Heartbound character system
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

// ── Avatar config (Sky-style cosmetics) ──────────────────────────────────────
export interface AvatarConfig {
  // Cape
  capeColor:    string;
  capeAccent:   string;
  capeStyle:    CapeStyle;
  // Hair
  hairStyle:    HairStyle;
  hairColor:    string;
  // Mask / face
  maskStyle:    MaskStyle;
  // Outfit
  outfitStyle:  OutfitStyle;
  outfitColor:  string;
  accentColor:  string;
  // Skin
  skinTone:     SkinTone;
  // Scale
  height:       number;   // 0.85 – 1.15  multiplier
}

export type CapeStyle    = 'standard' | 'wide' | 'split' | 'star' | 'tattered' | 'elegant' | 'seasonal' | 'couples';
export type HairStyle    = 'flowing' | 'short' | 'braided' | 'wild' | 'bun' | 'windswept' | 'ponytail' | 'crownbraid' | 'curly' | 'none';
export type MaskStyle    = 'none' | 'leaf' | 'star' | 'crescent' | 'smile' | 'flower' | 'feather' | 'crystal';
export type OutfitStyle  = 'wanderer' | 'mage' | 'farmer' | 'dancer' | 'traveler' | 'guardian';
export type SkinTone     = 'warm' | 'peach' | 'tan' | 'brown' | 'dark' | 'ebony' | 'cool' | 'pale';

// ── Animation states ─────────────────────────────────────────────────────────
export type AnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'fly'
  | 'interact'
  | 'sit'
  | 'hug'
  | 'sidehug'
  | 'wave'
  | 'dance'
  | 'clap'
  | 'cheer'
  | 'highfive'
  | 'headpat'
  | 'point'
  | 'spin'
  | 'lean_forward'
  | 'tilt_down'
  | 'piggyback_rider'
  | 'carry_carrier'
  | 'carry_rider';

// ── Refs passed to useProceduralAnim ─────────────────────────────────────────
export interface CharacterRefs {
  root:   React.MutableRefObject<THREE.Group>;
  head:   React.MutableRefObject<THREE.Group>;
  torso:  React.MutableRefObject<THREE.Group>;
  lArm:   React.MutableRefObject<THREE.Group>;
  rArm:   React.MutableRefObject<THREE.Group>;
  lLeg:   React.MutableRefObject<THREE.Group>;
  rLeg:   React.MutableRefObject<THREE.Group>;
  cape:   React.MutableRefObject<THREE.Group>;
  hair:   React.MutableRefObject<THREE.Group>;
}

// ── NPC data ──────────────────────────────────────────────────────────────────
export interface NPCData {
  id:          string;
  name:        string;
  emoji:       string;          // legacy billboard emoji
  tx:          number;
  ty:          number;
  color:       string;          // legacy accent color
  xpReward:    number;
  lines:       string[];
  // Sky-spirit fields
  glowColor:   string;
  capeColor:   string;
  maskStyle:   MaskStyle;
  patrolPath?: [number, number][];
}

// ── Interaction ───────────────────────────────────────────────────────────────
export interface Interaction {
  id:                  string;
  label:               string;
  emoji:               string;
  requiresPartner:     boolean;
  bondLevelRequired:   number;
  duration:            number | 'hold';
  partnerMustAccept:   boolean;
  animState:           AnimState;
  partnerAnimState:    AnimState;
  particleEffect:      ParticleEffectType | null;
  bondXPReward:        number;
}

export type ParticleEffectType =
  | 'hearts'
  | 'sparkle'
  | 'petals'
  | 'heart_burst'
  | 'confetti'
  | 'stars'
  | 'notes';

// ── Quality tiers ─────────────────────────────────────────────────────────────
export type QualityTier = 'ultra' | 'high' | 'medium' | 'low';

export interface QualitySettings {
  chunkRadius:        number;
  grassDensity:       number;
  shadowMapSize:      number;
  shadowsEnabled:     boolean;
  postProcessing:     ('ssao' | 'bloom' | 'vignette')[];
  waterResolution:    number;
  waterReflections:   boolean;
  treeLODDistance:    number;
  particleMultiplier: number;
  capeSegments:       number;
  rainParticles:      number;
}
