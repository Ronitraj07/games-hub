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
  email:          string
  uid:            string
  posRef:         React.MutableRefObject<THREE.Vector3>  // live ref from MeadowHaven3D
  isLocalPlayer:  boolean
  onVRMLoaded?:   (vrm: any) => void
}

export const VRMCharacter = ({ email, uid, posRef, isLocalPlayer, onVRMLoaded }: Props) => {
  const { scene } = useThree()
  const vrmRef    = useRef<any>(null)
  const clockRef  = useRef(new THREE.Clock())

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

          // Place at current live position
          vrm.scene.position.copy(posRef.current)
          scene.add(vrm.scene)
          vrmRef.current = vrm
          onVRMLoaded?.(vrm)
        },
        undefined,
        (err: unknown) => console.error('[VRMCharacter] load error:', err)
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

  // Every frame: push live posRef into the VRM scene + tick spring bones
  useFrame(() => {
    if (!vrmRef.current) return
    const delta = clockRef.current.getDelta()
    vrmRef.current.scene.position.copy(posRef.current)   // ← THE KEY LINE
    vrmRef.current.update(delta)
  })

  return (
    <AccessorySystem
      equipped={isLocalPlayer ? equippedAccessories : []}
      position={posRef.current}
      bondLevel={bondLevel}
    />
  )
}
