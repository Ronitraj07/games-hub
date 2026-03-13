/**
 * VRMCharacter — Mixamo GLB animation retargeting
 *
 * Strategy:
 *  1. Load the VRM (mesh/materials/humanoid)
 *  2. Load idle.glb + walk.glb (Mixamo FBX→GLB, Without Skin)
 *  3. Retarget each AnimationClip's tracks by remapping
 *     Mixamo bone names → VRM getNormalizedBoneNode names
 *  4. Drive an AnimationMixer on the VRM scene
 *  5. CrossFade between idle ↔ walk based on movingRef
 *
 * Mixamo bone name format: "mixamorigHips" etc.
 * VRM normalized bone nodes are accessed via humanoid.getNormalizedBoneNode()
 * and their Object3D.name is the VRM bone name (e.g. "Hips", "LeftUpperArm").
 * We build a name→name map at load time so retargeting is O(1) per track.
 */
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

// ─── URLs ────────────────────────────────────────────────────────────────────
const BASE_ANIM = 'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/animations'
const IDLE_URL  = `${BASE_ANIM}/idle.glb`
const WALK_URL  = `${BASE_ANIM}/walk.glb`

// ─── Mixamo → VRM humanoid bone name map ────────────────────────────────────
// Mixamo exports bones as "mixamorigXxx" or just "Xxx" depending on converter.
// We handle both prefixed and unprefixed variants.
const MIXAMO_TO_VRM: Record<string, VRMHumanBoneName> = {
  // Hips / Spine
  mixamorigHips:          VRMHumanBoneName.Hips,
  mixamorigSpine:         VRMHumanBoneName.Spine,
  mixamorigSpine1:        VRMHumanBoneName.Chest,
  mixamorigSpine2:        VRMHumanBoneName.UpperChest,
  mixamorigNeck:          VRMHumanBoneName.Neck,
  mixamorigHead:          VRMHumanBoneName.Head,
  // Left Arm
  mixamorigLeftShoulder:  VRMHumanBoneName.LeftShoulder,
  mixamorigLeftArm:       VRMHumanBoneName.LeftUpperArm,
  mixamorigLeftForeArm:   VRMHumanBoneName.LeftLowerArm,
  mixamorigLeftHand:      VRMHumanBoneName.LeftHand,
  // Right Arm
  mixamorigRightShoulder: VRMHumanBoneName.RightShoulder,
  mixamorigRightArm:      VRMHumanBoneName.RightUpperArm,
  mixamorigRightForeArm:  VRMHumanBoneName.RightLowerArm,
  mixamorigRightHand:     VRMHumanBoneName.RightHand,
  // Left Leg
  mixamorigLeftUpLeg:     VRMHumanBoneName.LeftUpperLeg,
  mixamorigLeftLeg:       VRMHumanBoneName.LeftLowerLeg,
  mixamorigLeftFoot:      VRMHumanBoneName.LeftFoot,
  mixamorigLeftToeBase:   VRMHumanBoneName.LeftToes,
  // Right Leg
  mixamorigRightUpLeg:    VRMHumanBoneName.RightUpperLeg,
  mixamorigRightLeg:      VRMHumanBoneName.RightLowerLeg,
  mixamorigRightFoot:     VRMHumanBoneName.RightFoot,
  mixamorigRightToeBase:  VRMHumanBoneName.RightToes,
}

// Also accept un-prefixed names (some FBX→GLB converters strip "mixamorig")
const MIXAMO_UNPREFIXED: Record<string, VRMHumanBoneName> = {
  Hips:          VRMHumanBoneName.Hips,
  Spine:         VRMHumanBoneName.Spine,
  Spine1:        VRMHumanBoneName.Chest,
  Spine2:        VRMHumanBoneName.UpperChest,
  Neck:          VRMHumanBoneName.Neck,
  Head:          VRMHumanBoneName.Head,
  LeftShoulder:  VRMHumanBoneName.LeftShoulder,
  LeftArm:       VRMHumanBoneName.LeftUpperArm,
  LeftForeArm:   VRMHumanBoneName.LeftLowerArm,
  LeftHand:      VRMHumanBoneName.LeftHand,
  RightShoulder: VRMHumanBoneName.RightShoulder,
  RightArm:      VRMHumanBoneName.RightUpperArm,
  RightForeArm:  VRMHumanBoneName.RightLowerArm,
  RightHand:     VRMHumanBoneName.RightHand,
  LeftUpLeg:     VRMHumanBoneName.LeftUpperLeg,
  LeftLeg:       VRMHumanBoneName.LeftLowerLeg,
  LeftFoot:      VRMHumanBoneName.LeftFoot,
  LeftToeBase:   VRMHumanBoneName.LeftToes,
  RightUpLeg:    VRMHumanBoneName.RightUpperLeg,
  RightLeg:      VRMHumanBoneName.RightLowerLeg,
  RightFoot:     VRMHumanBoneName.RightFoot,
  RightToeBase:  VRMHumanBoneName.RightToes,
}

/**
 * Retarget a Mixamo AnimationClip to drive a VRM's normalized bone nodes.
 *
 * Each track name is like "mixamorigHips.quaternion" or "Hips.quaternion".
 * We remap the bone-name part to the VRM normalized bone node's Object3D name,
 * then replace the track's node name so THREE.AnimationMixer can find it.
 */
function retargetClip(
  clip: THREE.AnimationClip,
  vrm: any,
): THREE.AnimationClip {
  const newTracks: THREE.KeyframeTrack[] = []

  for (const track of clip.tracks) {
    // track.name format: "BoneName.property" or "BoneName.property[x]"
    const dotIdx   = track.name.indexOf('.')
    if (dotIdx === -1) continue
    const boneName = track.name.substring(0, dotIdx)
    const property = track.name.substring(dotIdx)          // e.g. ".quaternion"

    // Only keep rotation (quaternion) tracks — position tracks from Mixamo
    // cause the character to slide/jump because Mixamo root motion is baked in.
    // Exception: keep Hips position for vertical bob.
    const isQuat = property.startsWith('.quaternion')
    const isHipsPos = property.startsWith('.position') &&
      (boneName === 'mixamorigHips' || boneName === 'Hips')
    if (!isQuat && !isHipsPos) continue

    // Resolve VRM humanoid bone name
    const vrmBoneName: VRMHumanBoneName | undefined =
      MIXAMO_TO_VRM[boneName] ?? MIXAMO_UNPREFIXED[boneName]
    if (!vrmBoneName) continue

    // Get the actual Object3D from VRM normalized humanoid
    const node = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)
    if (!node) continue

    // Clone track and remap node name to VRM bone node name
    const cloned = track.clone()
    cloned.name = `${node.name}${property}`
    newTracks.push(cloned)
  }

  return new THREE.AnimationClip(clip.name, clip.duration, newTracks)
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  email:         string
  uid:           string
  posRef:        React.MutableRefObject<THREE.Vector3>
  movingRef?:    React.MutableRefObject<boolean>
  facingRef?:    React.MutableRefObject<number>
  isLocalPlayer: boolean
  onVRMLoaded?:  (vrm: any) => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export const VRMCharacter = ({
  email, uid, posRef, movingRef, facingRef, isLocalPlayer, onVRMLoaded,
}: Props) => {
  const { scene } = useThree()

  const vrmRef     = useRef<any>(null)
  const mixerRef   = useRef<THREE.AnimationMixer | null>(null)
  const idleActRef = useRef<THREE.AnimationAction | null>(null)
  const walkActRef = useRef<THREE.AnimationAction | null>(null)
  const wasMoving  = useRef(false)
  const clockRef   = useRef(new THREE.Clock())

  const {
    equippedAccessories, bondLevel,
    setVrmUrl, setEquippedAccessories, setUnlockedAccessories, setBondLevel,
  } = useAvatarStore()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // ── 1. Resolve VRM URL ────────────────────────────────────────────────
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

      // ── 2. Load VRM ───────────────────────────────────────────────────────
      const vrmGltf = await new Promise<any>((res, rej) =>
        loader.load(vrmUrl, res, undefined, rej)
      ).catch((e) => { console.error('[VRMCharacter] VRM load error:', e); return null })
      if (cancelled || !vrmGltf) return

      const vrm = vrmGltf.userData.vrm
      if (!vrm) return

      VRMUtils.removeUnnecessaryVertices(vrmGltf.scene)
      VRMUtils.combineSkeletons(vrmGltf.scene)
      VRMUtils.rotateVRM0(vrm)
      vrm.scene.position.copy(posRef.current)
      scene.add(vrm.scene)
      vrmRef.current = vrm
      onVRMLoaded?.(vrm)

      // ── 3. Load animation GLBs (plain GLTFLoader, no VRM plugin) ──────────
      const animLoader = new GLTFLoader()
      const [idleGltf, walkGltf] = await Promise.all([
        new Promise<any>((res, rej) => animLoader.load(IDLE_URL, res, undefined, rej))
          .catch((e) => { console.error('[VRMCharacter] idle.glb load error:', e); return null }),
        new Promise<any>((res, rej) => animLoader.load(WALK_URL, res, undefined, rej))
          .catch((e) => { console.error('[VRMCharacter] walk.glb load error:', e); return null }),
      ])
      if (cancelled) return

      // ── 4. Retarget clips ─────────────────────────────────────────────────
      const mixer = new THREE.AnimationMixer(vrm.scene)
      mixerRef.current = mixer

      if (idleGltf?.animations?.length) {
        const raw      = idleGltf.animations[0]
        const retarget = retargetClip(raw, vrm)
        const action   = mixer.clipAction(retarget)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
        idleActRef.current = action
      }

      if (walkGltf?.animations?.length) {
        const raw      = walkGltf.animations[0]
        const retarget = retargetClip(raw, vrm)
        const action   = mixer.clipAction(retarget)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.enabled = true
        action.setEffectiveWeight(0)
        action.play()
        walkActRef.current = action
      }
    }

    load()
    return () => {
      cancelled = true
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      idleActRef.current = null
      walkActRef.current = null
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene)
        vrmRef.current = null
      }
    }
  }, [email, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (!vrmRef.current || !mixerRef.current) return
    const delta   = clockRef.current.getDelta()
    const moving  = movingRef?.current ?? false
    const FADE_MS = 0.25 // crossfade duration in seconds

    // ── Crossfade idle ↔ walk ────────────────────────────────────────────────
    if (moving !== wasMoving.current) {
      wasMoving.current = moving
      if (moving) {
        // → fade to walk
        walkActRef.current?.reset().fadeIn(FADE_MS)
        idleActRef.current?.fadeOut(FADE_MS)
      } else {
        // → fade to idle
        idleActRef.current?.reset().fadeIn(FADE_MS)
        walkActRef.current?.fadeOut(FADE_MS)
      }
    }

    // ── Walk speed: scale time by actual movement (optional polish) ──────────
    if (walkActRef.current) {
      walkActRef.current.timeScale = moving ? 1.0 : 0
    }

    // ── Position ─────────────────────────────────────────────────────────────
    vrmRef.current.scene.position.copy(posRef.current)

    // ── Facing direction (shortest-path lerp) ────────────────────────────────
    if (facingRef) {
      const targetY  = facingRef.current + Math.PI
      const currentY = vrmRef.current.scene.rotation.y
      let diff = targetY - currentY
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      vrmRef.current.scene.rotation.y = currentY + diff * 0.15
    }

    // ── Advance mixer + VRM springs ──────────────────────────────────────────
    mixerRef.current.update(delta)
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
