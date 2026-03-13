export type AccessoryId =
  | 'sakura_petals'
  | 'sparkle_aura'
  | 'butterfly_companions'
  | 'heart_trail'
  | 'golden_glow'
  | 'halo'        // Stage 2 — GLB (locked until file downloaded)
  | 'crown'       // Stage 2 — GLB
  | 'wings'       // Stage 2 — GLB
  | 'orb'         // Stage 2 — GLB

export type AccessoryType = 'particle' | 'glb'

export interface AccessoryConfig {
  id: AccessoryId
  label: string
  emoji: string
  type: AccessoryType
  unlockLevel: number
  available: boolean       // false = GLB not downloaded yet
  file?: string            // only for type: 'glb'
  bone?: string            // only for type: 'glb'
  description: string
}

export const ACCESSORIES: AccessoryConfig[] = [
  {
    id: 'sakura_petals',
    label: 'Sakura Petals',
    emoji: '🌸',
    type: 'particle',
    unlockLevel: 1,
    available: true,
    description: 'Cherry blossom petals drift around you'
  },
  {
    id: 'sparkle_aura',
    label: 'Sparkle Aura',
    emoji: '✨',
    type: 'particle',
    unlockLevel: 5,
    available: true,
    description: 'Golden stars float around your body'
  },
  {
    id: 'butterfly_companions',
    label: 'Butterfly Companions',
    emoji: '🦋',
    type: 'particle',
    unlockLevel: 10,
    available: true,
    description: 'Two glowing butterflies orbit you'
  },
  {
    id: 'heart_trail',
    label: 'Heart Trail',
    emoji: '💕',
    type: 'particle',
    unlockLevel: 20,
    available: true,
    description: 'Hearts float upward as you walk'
  },
  {
    id: 'golden_glow',
    label: 'Golden Glow',
    emoji: '🌟',
    type: 'particle',
    unlockLevel: 30,
    available: true,
    description: 'Warm golden light radiates from your body'
  },
  // Stage 2 — GLB accessories (available: false until files downloaded)
  {
    id: 'halo',
    label: 'Halo',
    emoji: '😇',
    type: 'glb',
    unlockLevel: 15,
    available: false,
    file: '/accessories/halo.glb',
    bone: 'head',
    description: 'A soft golden halo above your head'
  },
  {
    id: 'crown',
    label: 'Crown',
    emoji: '👑',
    type: 'glb',
    unlockLevel: 25,
    available: false,
    file: '/accessories/crown.glb',
    bone: 'head',
    description: 'A jeweled crown fit for royalty'
  },
  {
    id: 'wings',
    label: 'Angel Wings',
    emoji: '🪽',
    type: 'glb',
    unlockLevel: 50,
    available: false,
    file: '/accessories/wings.glb',
    bone: 'spine',
    description: 'Ethereal wings with gentle physics'
  },
  {
    id: 'orb',
    label: 'Mystic Orb',
    emoji: '🔮',
    type: 'glb',
    unlockLevel: 40,
    available: false,
    file: '/accessories/orb.glb',
    bone: 'rightHand',
    description: 'A glowing orb that floats beside you'
  },
]
