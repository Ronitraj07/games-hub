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

function getBone(vrm: any, name: VRMHumanBoneName): THREE.Object3D | null {
  return vrm?.humanoid?.getNormalizedBoneNode(name) ?? null
}

/**
 * VRM NORMALIZED SPACE NOTES:
 *  • Arms at rest are horizontal (T-pose) → rotation.z = −1.2 makes them hang down
 *  • Walk arm swing is rotation.z (forward/back in normalized space)
 *  • Leg swing is rotation.x (forward/back)
 *  • Left side: positive z swings forward; Right side: negative z swings forward
 */
function applyPose(vrm: any, t: number, moving: boolean) {
  if (!vrm?.humanoid) return

  const freq  = 4.2                          // walk cycle speed
  const swing = Math.sin(t * freq)           // -1 → +1 oscillation
  const amp   = moving ? 1.0 : 0.0

  // ── Hips bob & sway ─────────────────────────────────────────────────
  const hips = getBone(vrm, VRMHumanBoneName.Hips)
  if (hips) {
    hips.position.y = moving ? Math.abs(Math.sin(t * freq * 2)) * 0.03 : 0
    hips.rotation.z = moving ? swing * 0.06 : 0
  }

  // ── Spine lean & sway ──────────────────────────────────────────────
  const spine = getBone(vrm, VRMHumanBoneName.Spine)
  const chest = getBone(vrm, VRMHumanBoneName.Chest)
  const head  = getBone(vrm, VRMHumanBoneName.Head)
  if (spine) {
    spine.rotation.x = moving ? 0.05 : 0            // slight forward lean when walking
    spine.rotation.z = moving ? swing * 0.04 : Math.sin(t * 1.0) * 0.008
  }
  if (chest) chest.rotation.z = moving ? -swing * 0.03 : 0
  if (head)  head.rotation.y  = moving ? swing * 0.04  : Math.sin(t * 0.6) * 0.025

  // ── Arms ───────────────────────────────────────────────────────────
  // In VRM normalized space arms are horizontal at rest (T-pose).
  // We need rotation.z ≈ -1.2 to bring them DOWN to sides (hanging).
  // Walk swing is then ADDED on top as a delta on z.
  const lUA = getBone(vrm, VRMHumanBoneName.LeftUpperArm)
  const rUA = getBone(vrm, VRMHumanBoneName.RightUpperArm)
  const lLA = getBone(vrm, VRMHumanBoneName.LeftLowerArm)
  const rLA = getBone(vrm, VRMHumanBoneName.RightLowerArm)

  const armSwingL = moving ?  swing * 0.4 : Math.sin(t * 1.0) * 0.015
  const armSwingR = moving ? -swing * 0.4 : Math.sin(t * 1.0) * 0.015

  if (lUA) {
    lUA.rotation.z = -1.1 + armSwingL   // -1.1 = natural hang; +swing = forward swing
    lUA.rotation.x =  0.05              // slight forward angle
  }
  if (rUA) {
    rUA.rotation.z =  1.1 + armSwingR   // mirror: positive z for right arm hang
    rUA.rotation.x =  0.05
  }
  // Elbow bends slightly when arm is swinging forward
  if (lLA) lLA.rotation.x = moving ? Math.max(0,  swing) * 0.25 : 0.04
  if (rLA) rLA.rotation.x = moving ? Math.max(0, -swing) * 0.25 : 0.04

  // ── Legs ───────────────────────────────────────────────────────────
  const lUL = getBone(vrm, VRMHumanBoneName.LeftUpperLeg)
  const rUL = getBone(vrm, VRMHumanBoneName.RightUpperLeg)
  const lLL = getBone(vrm, VRMHumanBoneName.LeftLowerLeg)
  const rLL = getBone(vrm, VRMHumanBoneName.RightLowerLeg)
  const lFt = getBone(vrm, VRMHumanBoneName.LeftFoot)
  const rFt = getBone(vrm, VRMHumanBoneName.RightFoot)

  const legAmp = 0.42
  if (lUL) lUL.rotation.x =  swing * legAmp * amp
  if (rUL) rUL.rotation.x = -swing * legAmp * amp
  // Knee: bends on the back-swinging leg
  if (lLL) lLL.rotation.x = Math.max(0, -swing) * legAmp * 0.6 * amp
  if (rLL) rLL.rotation.x = Math.max(0,  swing) * legAmp * 0.6 * amp
  // Foot angle
  if (lFt) lFt.rotation.x = moving ? -swing * 0.15 : 0
  if (rFt) rFt.rotation.x = moving ?  swing * 0.15 : 0
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
          .eq('email', email).single()
        if (data?.vrm_url) vrmUrl = data.vrm_url
        if (isLocalPlayer) {
          if (data?.equipped_accessories) setEquippedAccessories(data.equipped_accessories as AccessoryId[])
          if (data?.unlocked_accessories) setUnlockedAccessories(data.unlocked_accessories as AccessoryId[])
        }
      } catch (_) {}
      if (isLocalPlayer) {
        try {
          const { data: bond } = await supabase.from('couple_bond').select('level').single()
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
      if (vrmRef.current) { scene.remove(vrmRef.current.scene); vrmRef.current = null }
    }
  }, [email, uid])

  useFrame(() => {
    if (!vrmRef.current) return
    const delta = clockRef.current.getDelta()
    totalTimeRef.current += delta
    vrmRef.current.scene.position.copy(posRef.current)
    if (facingRef && movingRef?.current) {
      vrmRef.current.scene.rotation.y = THREE.MathUtils.lerp(
        vrmRef.current.scene.rotation.y, facingRef.current + Math.PI, 0.15,
      )
    }
    applyPose(vrmRef.current, totalTimeRef.current, movingRef?.current ?? false)
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
