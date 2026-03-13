import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAvatarStore } from '../stores/avatarStore'
import { AvatarProfile, DefaultAvatarData, VRoidAvatarData } from '../types/avatar'

export const useAvatarProfile = (firebaseUid: string | null) => {
  const [loading, setLoading] = useState(true)
  const [hasAvatar, setHasAvatar] = useState(false)
  const { setAvatarProfile } = useAvatarStore()

  // Load avatar profile from Supabase on mount
  useEffect(() => {
    if (!firebaseUid) {
      setLoading(false)
      return
    }
    loadAvatarProfile(firebaseUid)
  }, [firebaseUid])

  const loadAvatarProfile = async (uid: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_type, avatar_data')
        .eq('id', uid)
        .single()

      if (error || !data?.avatar_type) {
        setHasAvatar(false)
      } else {
        const profile: AvatarProfile = {
          avatarType: data.avatar_type,
          defaultData: data.avatar_type === 'default' ? data.avatar_data : undefined,
          vroidData: data.avatar_type === 'vroid' ? data.avatar_data : undefined,
        }
        setAvatarProfile(profile)
        setHasAvatar(true)
      }
    } catch (err) {
      console.error('Failed to load avatar profile:', err)
      setHasAvatar(false)
    } finally {
      setLoading(false)
    }
  }

  // Save default avatar to Supabase
  const saveDefaultAvatar = async (uid: string, data: DefaultAvatarData) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: uid,
        avatar_type: 'default',
        avatar_data: data,
        updated_at: new Date().toISOString(),
      })

    if (!error) {
      setHasAvatar(true)
    }
    return !error
  }

  // Save VRoid avatar to Supabase
  const saveVRoidAvatar = async (uid: string, data: VRoidAvatarData) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: uid,
        avatar_type: 'vroid',
        avatar_data: data,
        updated_at: new Date().toISOString(),
      })

    if (!error) {
      setHasAvatar(true)
    }
    return !error
  }

  return { loading, hasAvatar, saveDefaultAvatar, saveVRoidAvatar, loadAvatarProfile }
}
