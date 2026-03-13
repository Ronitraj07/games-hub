// Avatar system types

export type AvatarType = 'vroid' | 'default' | null

export interface DefaultAvatarData {
  baseModel: string
  skinTone: string
  hairColor: string
  outfitColor: string
}

export interface VRoidAvatarData {
  vroidAvatarUrl: string
  vroidUserId?: string
}

export interface AvatarProfile {
  avatarType: AvatarType
  defaultData?: DefaultAvatarData
  vroidData?: VRoidAvatarData
}

export const DEFAULT_CHARACTERS = [
  {
    id: 'character_1',
    name: 'Wanderer',
    modelUrl: null, // will be Supabase URL once uploaded
    thumbnail: '🧙',
    description: 'A mysterious traveller'
  },
  {
    id: 'character_2',
    name: 'Seeker',
    modelUrl: null,
    thumbnail: '🧝',
    description: 'A curious explorer'
  },
  {
    id: 'character_3',
    name: 'Guardian',
    modelUrl: null,
    thumbnail: '⚔️',
    description: 'A brave protector'
  },
]

export const SKIN_TONES = [
  { id: 'light', color: '#FDDBB4', label: 'Light' },
  { id: 'medium-light', color: '#E8B98A', label: 'Medium Light' },
  { id: 'medium', color: '#C68642', label: 'Medium' },
  { id: 'medium-dark', color: '#8D5524', label: 'Medium Dark' },
  { id: 'dark', color: '#4A2912', label: 'Dark' },
]

export const HAIR_COLORS = [
  { id: 'black', color: '#1A1A1A', label: 'Black' },
  { id: 'dark-brown', color: '#3B1F0E', label: 'Dark Brown' },
  { id: 'brown', color: '#6B3A2A', label: 'Brown' },
  { id: 'auburn', color: '#922B21', label: 'Auburn' },
  { id: 'blonde', color: '#D4AC0D', label: 'Blonde' },
  { id: 'white', color: '#F0F0F0', label: 'White' },
  { id: 'blue', color: '#1A5276', label: 'Blue' },
  { id: 'purple', color: '#6C3483', label: 'Purple' },
  { id: 'pink', color: '#C0392B', label: 'Pink' },
]

export const OUTFIT_COLORS = [
  { id: 'sky-blue', color: '#5DADE2', label: 'Sky Blue' },
  { id: 'forest-green', color: '#27AE60', label: 'Forest Green' },
  { id: 'deep-purple', color: '#7D3C98', label: 'Deep Purple' },
  { id: 'sunset-orange', color: '#E67E22', label: 'Sunset Orange' },
  { id: 'rose-red', color: '#C0392B', label: 'Rose Red' },
  { id: 'midnight-blue', color: '#1A3A5C', label: 'Midnight Blue' },
  { id: 'gold', color: '#D4AC0D', label: 'Gold' },
  { id: 'silver', color: '#BDC3C7', label: 'Silver' },
]
