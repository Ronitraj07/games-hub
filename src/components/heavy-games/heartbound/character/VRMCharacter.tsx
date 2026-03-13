import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { AccessorySystem } from '../../../avatar/AccessorySystem'
import { useAvatarStore } from '../../../../stores/avatarStore'
import { PLAYER_VRMS } from '../../../../lib/modelUrls'
import { supabase } from '../../../../lib/supabase'
import { AccessoryId } from '../../../../types/accessories'

interface Props {
  email: string
  uid: string
  position: THREE.Vector3
  isLocalPlayer: boolean
  onVRMLoaded?: (vrm: any) => void
}

export const VRMCharacter = ({ email, uid, position, isLocalPlayer, onVRMLoaded }: Props) => {
  const { scene } = useThree()
  const vrmRef = useRef<any>(null)
  const clockRef = useRef(new THREE.Clock())
  const posRef = useRef(position.clone())

  const {
    equippedAccessories,
    bondLevel,
    setVrmUrl,
    setEquippedAccessories,
    setUnlockedAccessories,
    setBondLevel,
  } = useAvatarStore()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // 1. Resolve VRM url (DB first, hardcoded fallback)
      let vrmUrl = PLAYER_VRMS[email]
      try {
        const { data } = await supabase
          .from('profiles')
          .select('vrm_url, equipped_accessories, unlocked_accessories')
          .eq('email', email)
          .single()
        if (data?.vrm_url) vrmUrl = data.vrm_url
        if (isLocalPlayer) {
          if (data?.equipped_accessories) setEquippedAccessories(data.equipped_accessories as AccessoryId[])
          if (data?.unlocked_accessories) setUnlockedAccessories(data.unlocked_accessories as AccessoryId[])
        }
      } catch (_) {}

      // 2. Load Bond level for local player
      if (isLocalPlayer) {
        try {
          const { data: bond } = await supabase
            .from('couple_bond')
            .select('level')
            .single()
          if (bond?.level) setBondLevel(bond.level)
        } catch (_) {}
      }

      setVrmUrl(vrmUrl)

      // 3. Load VRM
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))

      loader.load(
        vrmUrl,
        (gltf) => {
          if (cancelled) return
          const vrm = gltf.userData.vrm
          if (!vrm) return

          VRMUtils.removeUnnecessaryVertices(gltf.scene)
          VRMUtils.combineSkeletons(gltf.scene)
          VRMUtils.rotateVRM0(vrm)

          vrm.scene.position.copy(position)
          scene.add(vrm.scene)
          vrmRef.current = vrm
          posRef.current.copy(position)
          onVRMLoaded?.(vrm)
        },
        undefined,
        (err) => console.error('[VRMCharacter] load error:', err)
      )
    }

    load()
    return () => {
      cancelled = true
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene)
        vrmRef.current = null
      }
    }
  }, [email, uid])

  // Sync position ref every frame (so accessories follow character)
  useFrame(() => {
    if (!vrmRef.current) return
    const delta = clockRef.current.getDelta()
    vrmRef.current.update(delta)
    posRef.current.copy(vrmRef.current.scene.position)
  })

  return (
    // Accessories rendered as R3F children, follow posRef
    <AccessorySystem
      equipped={isLocalPlayer ? equippedAccessories : []}
      position={posRef.current}
      bondLevel={bondLevel}
    />
  )
}
