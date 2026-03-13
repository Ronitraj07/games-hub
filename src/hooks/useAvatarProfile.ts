import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PlayerProfile {
  id: string
  email: string
  display_name: string
  vrm_url: string
  unlocked_accessories: string[]
  equipped_accessories: string[]
}

export const useAvatarProfile = (firebaseUid: string | null) => {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)

  useEffect(() => {
    if (!firebaseUid) {
      setLoading(false)
      return
    }
    loadProfile(firebaseUid)
  }, [firebaseUid])

  const loadProfile = async (uid: string) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
      if (data) setProfile(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return { loading, profile }
}
