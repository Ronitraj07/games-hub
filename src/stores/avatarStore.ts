import { create } from 'zustand'
import { AvatarProfile, AvatarType, DefaultAvatarData, VRoidAvatarData } from '../types/avatar'

interface AvatarStore {
  avatarProfile: AvatarProfile | null
  isLoading: boolean
  setAvatarProfile: (profile: AvatarProfile) => void
  setDefaultAvatar: (data: DefaultAvatarData) => void
  setVRoidAvatar: (data: VRoidAvatarData) => void
  setAvatarType: (type: AvatarType) => void
  clearAvatar: () => void
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  avatarProfile: null,
  isLoading: false,

  setAvatarProfile: (profile) => set({ avatarProfile: profile }),

  setDefaultAvatar: (data) =>
    set({
      avatarProfile: {
        avatarType: 'default',
        defaultData: data,
      },
    }),

  setVRoidAvatar: (data) =>
    set({
      avatarProfile: {
        avatarType: 'vroid',
        vroidData: data,
      },
    }),

  setAvatarType: (type) =>
    set((state) => ({
      avatarProfile: state.avatarProfile
        ? { ...state.avatarProfile, avatarType: type }
        : { avatarType: type },
    })),

  clearAvatar: () => set({ avatarProfile: null }),
}))
