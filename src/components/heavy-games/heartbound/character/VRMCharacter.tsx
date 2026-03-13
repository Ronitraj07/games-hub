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

// Simple procedural walk animation applied to VRM humanoid bones
function applyWalkPose(vrm: any, t: number, moving: boolean) {
  const humanoid = vrm?.humanoid
  if (!humanoid) return

  const getBone = (name: VRMHumanBoneName) =>
    humanoid.getRawBoneNode(name) as THREE.Object3D | null

  // Idle sway
  const sway = moving ? 0 : Math.sin(t * 1.5) * 0.015

  const spine = getBone(VRMHumanBoneName.Spine)
  if (spine) spine.rotation.z = sway

  const head = getBone(VRMHumanBoneName.Head)
  if (head) head.rotation.y = moving ? Math.sin(t * 4) * 0.06 : Math.sin(t * 0.8) * 0.04

  if (!moving) {
    // Reset limbs to idle
    const lArm = getBone(VRMHumanBoneName.LeftUpperArm)
    const rArm = getBone(VRMHumanBoneName.RightUpperArm)
    if (lArm) { lArm.rotation.z =  0.3 + Math.sin(t * 1.5) * 0.04 }
    if (rArm) { rArm.rotation.z = -0.3 - Math.sin(t * 1.5) * 0.04 }
    return
  }

  // Walk cycle — opposite arm/leg swing
  const freq = 4.5, amp = 0.45
  const swing = Math.sin(t * freq)

  const lUpperArm = getBone(VRMHumanBoneName.LeftUpperArm)
  const rUpperArm = getBone(VRMHumanBoneName.RightUpperArm)
  const lLowerArm = getBone(VRMHumanBoneName.LeftLowerArm)
  const rLowerArm = getBone(VRMHumanBoneName.RightLowerArm)
  const lUpperLeg = getBone(VRMHumanBoneName.LeftUpperLeg)
  const rUpperLeg = getBone(VRMHumanBoneName.RightUpperLeg)
  const lLowerLeg = getBone(VRMHumanBoneName.LeftLowerLeg)
  const rLowerLeg = getBone(VRMHumanBoneName.RightLowerLeg)
  const hips      = getBone(VRMHumanBoneName.Hips)

  if (lUpperArm) { lUpperArm.rotation.x =  swing * amp * 0.6; lUpperArm.rotation.z =  0.25 }
  if (rUpperArm) { rUpperArm.rotation.x = -swing * amp * 0.6; rUpperArm.rotation.z = -0.25 }
  if (lLowerArm) { lLowerArm.rotation.x = Math.max(0,  swing) * 0.4 }
  if (rLowerArm) { rLowerArm.rotation.x = Math.max(0, -swing) * 0.4 }

  if (lUpperLeg) lUpperLeg.rotation.x =  swing * amp
  if (rUpperLeg) rUpperLeg.rotation.x = -swing * amp
  if (lLowerLeg) lLowerLeg.rotation.x = Math.max(0,  swing) * amp * 0.6
  if (rLowerLeg) rLowerLeg.rotation.x = Math.max(0, -swing) * amp * 0.6

  // Hip bob
  if (hips) hips.position.y = Math.abs(Math.sin(t * freq)) * 0.04
  if (spine) spine.rotation.z = -swing * 0.04
}

export const VRMCharacter = ({
  email, uid, posRef, movingRef, facingRef, isLocalPlayer, onVRMLoaded,
}: Props) => {
  const { scene }  = useThree()
  const vrmRef     = useRef<any>(null)
  const clockRef   = useRef(new THREE.Clock())
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

    // Sync position
    vrmRef.current.scene.position.copy(posRef.current)

    // Rotate to face movement direction
    if (facingRef && movingRef?.current) {
      vrmRef.current.scene.rotation.y = THREE.MathUtils.lerp(
        vrmRef.current.scene.rotation.y,
        facingRef.current + Math.PI,
        0.18,
      )
    }

    // Procedural walk / idle animation
    const isMoving = movingRef?.current ?? false
    applyWalkPose(vrmRef.current, totalTimeRef.current, isMoving)

    // VRM spring bones
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
