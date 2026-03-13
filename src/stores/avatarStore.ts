import { create } from 'zustand'
import { AccessoryId } from '../types/accessories'

interface AvatarStore {
  vrmUrl: string | null
  equippedAccessories: AccessoryId[]
  unlockedAccessories: AccessoryId[]
  bondLevel: number
  setVrmUrl: (url: string) => void
  setEquippedAccessories: (accessories: AccessoryId[]) => void
  setUnlockedAccessories: (accessories: AccessoryId[]) => void
  setBondLevel: (level: number) => void
  equipAccessory: (id: AccessoryId) => void
  unequipAccessory: (id: AccessoryId) => void
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  vrmUrl: null,
  equippedAccessories: ['sakura_petals'], // default starter accessory
  unlockedAccessories: ['sakura_petals'],
  bondLevel: 1,

  setVrmUrl: (url) => set({ vrmUrl: url }),
  setEquippedAccessories: (accessories) => set({ equippedAccessories: accessories }),
  setUnlockedAccessories: (accessories) => set({ unlockedAccessories: accessories }),
  setBondLevel: (level) => set({ bondLevel: level }),

  equipAccessory: (id) =>
    set((state) => ({
      equippedAccessories: state.equippedAccessories.includes(id)
        ? state.equippedAccessories
        : [...state.equippedAccessories, id],
    })),

  unequipAccessory: (id) =>
    set((state) => ({
      equippedAccessories: state.equippedAccessories.filter((a) => a !== id),
    })),
}))
