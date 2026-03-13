import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils, VRMHumanBoneName } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { AccessorySystem } from '../../../avatar/AccessorySystem'
import { useAvatarStore } from '../../../../stores/avatarStore'
import { PLAYER_VRMS } from '../../../../lib/modelUrls'
import { supabase } from '../../../../lib/supabase'
import { AccessoryId } from '../../../../types/accessories'

interface Props {
  email:         string
  uid:           string
  posRef:        React.MutableRefObject<THREE.Vector3>
  movingRef?:    React.MutableRefObject<boolean>
  facingRef?:    React.MutableRefObject<number>
  isLocalPlayer: boolean
  onVRMLoaded?:  (vrm: any) => void
}

/**
 * MUST use getNormalizedBoneNode — it returns a bone in VRM normalized space
 * where rotation 0,0,0 = bind/rest pose, so our values are additive and visible.
 * getRawBoneNode returns the raw skeleton bone which has baked parent transforms
 * that silently cancel out any rotations we set.
 */
function getBone(vrm: any, name: VRMHumanBoneName): THREE.Object3D | null {
  return vrm?.humanoid?.getNormalizedBoneNode(name) ?? null
}

function applyPose(vrm: any, t: number, moving: boolean) {
  if (!vrm?.humanoid) return

  const freq  = 5.0
  const swing = Math.sin(t * freq)
  const amp   = moving ? 0.5 : 0.0

  // ── Spine / head ──────────────────────────────────────────────────────────
  const spine = getBone(vrm, VRMHumanBoneName.Spine)
  const chest = getBone(vrm, VRMHumanBoneName.Chest)
  const head  = getBone(vrm, VRMHumanBoneName.Head)

  if (spine) spine.rotation.z = moving ? -swing * 0.03 : Math.sin(t * 1.2) * 0.012
  if (chest) chest.rotation.z = moving ? -swing * 0.02 : 0
  if (head)  head.rotation.y  = moving ? swing * 0.05  : Math.sin(t * 0.7) * 0.03

  // ── Arms ──────────────────────────────────────────────────────────────────
  const lUA = getBone(vrm, VRMHumanBoneName.LeftUpperArm)
  const rUA = getBone(vrm, VRMHumanBoneName.RightUpperArm)
  const lLA = getBone(vrm, VRMHumanBoneName.LeftLowerArm)
  const rLA = getBone(vrm, VRMHumanBoneName.RightLowerArm)

  // Idle: arms hang slightly out; Walk: swing front/back
  if (lUA) {
    lUA.rotation.x = moving ?  swing * amp * 0.55 : Math.sin(t * 1.2) * 0.02
    lUA.rotation.z =  0.18   // natural outward hang
  }
  if (rUA) {
    rUA.rotation.x = moving ? -swing * amp * 0.55 : Math.sin(t * 1.2) * 0.02
    rUA.rotation.z = -0.18
  }
  if (lLA) lLA.rotation.x = moving ? Math.max(0,  swing) * 0.35 : 0.05
  if (rLA) rLA.rotation.x = moving ? Math.max(0, -swing) * 0.35 : 0.05

  // ── Legs ──────────────────────────────────────────────────────────────────
  const lUL = getBone(vrm, VRMHumanBoneName.LeftUpperLeg)
  const rUL = getBone(vrm, VRMHumanBoneName.RightUpperLeg)
  const lLL = getBone(vrm, VRMHumanBoneName.LeftLowerLeg)
  const rLL = getBone(vrm, VRMHumanBoneName.RightLowerLeg)

  if (lUL) lUL.rotation.x =  swing * amp
  if (rUL) rUL.rotation.x = -swing * amp
  // Knee bends on the trailing leg
  if (lLL) lLL.rotation.x = Math.max(0, -swing) * amp * 0.55
  if (rLL) rLL.rotation.x = Math.max(0,  swing) * amp * 0.55

  // ── Hip vertical bob ──────────────────────────────────────────────────────
  const hips = getBone(vrm, VRMHumanBoneName.Hips)
  if (hips) {
    hips.position.y = moving ? Math.abs(swing) * 0.035 : 0
    hips.rotation.z = moving ?  swing * 0.03            : 0
  }
}

export const VRMCharacter = ({
  email, uid, posRef, movingRef, facingRef, isLocalPlayer, onVRMLoaded,
}: Props) => {
  const { scene }    = useThree()
  const vrmRef       = useRef<any>(null)
  const clockRef     = useRef(new THREE.Clock())
  const totalTimeRef = useRef(0)

  const {
    equippedAccessories, bondLevel,
    setVrmUrl, setEquippedAccessories, setUnlockedAccessories, setBondLevel,
  } = useAvatarStore()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
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

      if (isLocalPlayer) {
        try {
          const { data: bond } = await supabase
            .from('couple_bond').select('level').single()
          if (bond?.level) setBondLevel(bond.level)
        } catch (_) {}
      }

      if (isLocalPlayer) setVrmUrl(vrmUrl)

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

  useFrame(() => {
    if (!vrmRef.current) return
    const delta = clockRef.current.getDelta()
    totalTimeRef.current += delta

    // Position sync
    vrmRef.current.scene.position.copy(posRef.current)

    // Face direction of movement
    if (facingRef && movingRef?.current) {
      vrmRef.current.scene.rotation.y = THREE.MathUtils.lerp(
        vrmRef.current.scene.rotation.y,
        facingRef.current + Math.PI,
        0.18,
      )
    }

    // Procedural pose via normalized bones
    applyPose(vrmRef.current, totalTimeRef.current, movingRef?.current ?? false)

    // Tick spring bones / LookAt
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
