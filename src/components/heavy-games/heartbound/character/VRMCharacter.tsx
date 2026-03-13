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

// VRM NORMALIZED BONE SPACE — confirmed from @pixiv/three-vrm docs + examples:
// • All rotations are RELATIVE to rest T-pose (rest = 0,0,0)
// • Arms are horizontal at rest → rotation.z = ∓1.2 hangs them DOWN at sides
// • Walk arm swing = rotation.x (forward/back) — NOT z
// • rotation.z on upper arm = how much it stays out from body (outward hang angle)
// Reference: https://www.minakami.land/post/r3f-vrm/
//   leftUpperArm.rotation.set(-1, 1, -1) → arms bent down+forward
function getBone(vrm: any, name: VRMHumanBoneName): THREE.Object3D | null {
  return vrm?.humanoid?.getNormalizedBoneNode(name) ?? null
}

// Smooth lerp helper to avoid snapping
function lerpRot(bone: THREE.Object3D | null, axis: 'x'|'y'|'z', target: number, alpha: number) {
  if (!bone) return
  bone.rotation[axis] = THREE.MathUtils.lerp(bone.rotation[axis], target, alpha)
}

export function applyVRMPose(vrm: any, t: number, moving: boolean) {
  if (!vrm?.humanoid) return

  const alpha = 0.18  // smoothing — prevents snapping between idle/walk
  const freq  = 4.0
  const swing = Math.sin(t * freq)          // −1 → +1
  const phase = Math.abs(Math.sin(t * freq)) // 0 → 1 (always positive, for bob)

  // ── HIPS ────────────────────────────────────────────────────────────────────
  const hips = getBone(vrm, VRMHumanBoneName.Hips)
  if (hips) {
    // Only hips POSITION sync is supported in normalized space per @pixiv/three-vrm issue #1585
    hips.position.y = moving ? phase * 0.025 : 0
    lerpRot(hips, 'z', moving ? swing * 0.05 : 0, alpha)
    lerpRot(hips, 'y', moving ? swing * 0.04 : 0, alpha)
  }

  // ── SPINE / CHEST ───────────────────────────────────────────────────────────
  const spine = getBone(vrm, VRMHumanBoneName.Spine)
  const chest = getBone(vrm, VRMHumanBoneName.Chest)
  lerpRot(spine, 'x', moving ?  0.06 : 0, alpha)    // slight forward lean when walking
  lerpRot(spine, 'z', moving ? -swing * 0.03 : Math.sin(t * 0.9) * 0.007, alpha)
  lerpRot(chest, 'z', moving ?  swing * 0.025 : 0, alpha) // counter-rotate to spine

  // ── HEAD ────────────────────────────────────────────────────────────────────
  const head = getBone(vrm, VRMHumanBoneName.Head)
  lerpRot(head, 'y', moving ? swing * 0.035 : Math.sin(t * 0.55) * 0.02, alpha)
  lerpRot(head, 'x', 0, alpha) // always neutral vertical

  // ── ARMS ────────────────────────────────────────────────────────────────────
  // KEY INSIGHT: In VRM normalized T-pose, arms are HORIZONTAL.
  // To make them hang at sides:
  //   Left  upperArm: rotation.z = -1.2  (rotate inward = down for left)
  //   Right upperArm: rotation.z = +1.2  (rotate inward = down for right)
  // Walk swing is rotation.X (forward/back), added on top of hang.
  // Small outward angle kept on Z so arms don't clip into body.

  const lUA = getBone(vrm, VRMHumanBoneName.LeftUpperArm)
  const rUA = getBone(vrm, VRMHumanBoneName.RightUpperArm)
  const lLA = getBone(vrm, VRMHumanBoneName.LeftLowerArm)
  const rLA = getBone(vrm, VRMHumanBoneName.RightLowerArm)

  // Arm walk swing amplitude
  const armSwing = moving ? swing * 0.38 : 0
  const idleSway = Math.sin(t * 1.0) * 0.012

  lerpRot(lUA, 'z', -1.15,  0.25) // hang down, stay constant (no lerp needed for rest pose)
  lerpRot(rUA, 'z',  1.15,  0.25)
  lerpRot(lUA, 'x', moving ?  armSwing : idleSway, alpha) // forward/back swing
  lerpRot(rUA, 'x', moving ? -armSwing : idleSway, alpha)

  // Elbow: bends slightly when that arm swings forward
  const lElbowBend = moving ? Math.max(0,  swing) * 0.22 : 0.04
  const rElbowBend = moving ? Math.max(0, -swing) * 0.22 : 0.04
  lerpRot(lLA, 'x', lElbowBend, alpha)
  lerpRot(rLA, 'x', rElbowBend, alpha)

  // ── LEGS ────────────────────────────────────────────────────────────────────
  const lUL = getBone(vrm, VRMHumanBoneName.LeftUpperLeg)
  const rUL = getBone(vrm, VRMHumanBoneName.RightUpperLeg)
  const lLL = getBone(vrm, VRMHumanBoneName.LeftLowerLeg)
  const rLL = getBone(vrm, VRMHumanBoneName.RightLowerLeg)
  const lFt = getBone(vrm, VRMHumanBoneName.LeftFoot)
  const rFt = getBone(vrm, VRMHumanBoneName.RightFoot)

  const legAmp = moving ? 0.44 : 0
  lerpRot(lUL, 'x',  swing * legAmp, alpha)
  lerpRot(rUL, 'x', -swing * legAmp, alpha)
  // Knee bends on trailing (backward-swinging) leg
  lerpRot(lLL, 'x', moving ? Math.max(0, -swing) * 0.38 : 0, alpha)
  lerpRot(rLL, 'x', moving ? Math.max(0,  swing) * 0.38 : 0, alpha)
  // Foot flexes with stride
  lerpRot(lFt, 'x', moving ? -swing * 0.12 : 0, alpha)
  lerpRot(rFt, 'x', moving ?  swing * 0.12 : 0, alpha)
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

    // Smoothly rotate character to face movement direction
    if (facingRef) {
      const targetY = facingRef.current + Math.PI
      const currentY = vrmRef.current.scene.rotation.y
      // Shortest-path lerp to avoid spinning 360°
      let diff = targetY - currentY
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      vrmRef.current.scene.rotation.y = currentY + diff * 0.15
    }

    applyVRMPose(vrmRef.current, totalTimeRef.current, movingRef?.current ?? false)
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
