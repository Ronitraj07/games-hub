/**
 * VRMCharacter — Mixamo GLB animation retargeting
 *
 * Robust bone matching: strips any known Mixamo prefix variant before lookup.
 * Handles: "mixamorigHips", "mixamorig:Hips", "Hips", "Armature|mixamorigHips" etc.
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

const BASE_ANIM = 'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/animations'
const IDLE_URL  = `${BASE_ANIM}/idle.glb`
const WALK_URL  = `${BASE_ANIM}/walk.glb`

// ─── Core Mixamo bone name → VRM humanoid bone ──────────────────────────────────
// Key = Mixamo bone name WITHOUT any prefix (prefix is stripped at runtime).
// Covers both FBX-for-Unity naming and standard Mixamo naming.
const CORE_TO_VRM: Record<string, VRMHumanBoneName> = {
  Hips:           VRMHumanBoneName.Hips,
  Spine:          VRMHumanBoneName.Spine,
  Spine1:         VRMHumanBoneName.Chest,
  Spine2:         VRMHumanBoneName.UpperChest,
  Neck:           VRMHumanBoneName.Neck,
  Head:           VRMHumanBoneName.Head,
  LeftShoulder:   VRMHumanBoneName.LeftShoulder,
  LeftArm:        VRMHumanBoneName.LeftUpperArm,
  LeftForeArm:    VRMHumanBoneName.LeftLowerArm,
  LeftHand:       VRMHumanBoneName.LeftHand,
  RightShoulder:  VRMHumanBoneName.RightShoulder,
  RightArm:       VRMHumanBoneName.RightUpperArm,
  RightForeArm:   VRMHumanBoneName.RightLowerArm,
  RightHand:      VRMHumanBoneName.RightHand,
  LeftUpLeg:      VRMHumanBoneName.LeftUpperLeg,
  LeftLeg:        VRMHumanBoneName.LeftLowerLeg,
  LeftFoot:       VRMHumanBoneName.LeftFoot,
  LeftToeBase:    VRMHumanBoneName.LeftToes,
  RightUpLeg:     VRMHumanBoneName.RightUpperLeg,
  RightLeg:       VRMHumanBoneName.RightLowerLeg,
  RightFoot:      VRMHumanBoneName.RightFoot,
  RightToeBase:   VRMHumanBoneName.RightToes,
}

/**
 * Strip any Mixamo prefix variant to get the core bone name.
 * Handles:
 *   "mixamorigHips"      → "Hips"
 *   "mixamorig:Hips"     → "Hips"
 *   "Armature|Hips"      → "Hips"
 *   "Hips"               → "Hips"   (already clean)
 */
function coreBoneName(raw: string): string {
  // Strip object path prefix like "Armature|"
  const pipeParts = raw.split('|')
  let name = pipeParts[pipeParts.length - 1]
  // Strip "mixamorig:" prefix
  if (name.startsWith('mixamorig:')) name = name.slice('mixamorig:'.length)
  // Strip "mixamorig" prefix (no colon)
  else if (name.startsWith('mixamorig')) name = name.slice('mixamorig'.length)
  return name
}

function retargetClip(clip: THREE.AnimationClip, vrm: any, label: string): THREE.AnimationClip {
  const newTracks: THREE.KeyframeTrack[] = []
  const unmatched = new Set<string>()

  for (const track of clip.tracks) {
    const dotIdx = track.name.indexOf('.')
    if (dotIdx === -1) continue
    const rawBone = track.name.substring(0, dotIdx)
    const property = track.name.substring(dotIdx)

    const isQuat    = property.startsWith('.quaternion')
    const core      = coreBoneName(rawBone)
    const isHipsPos = property.startsWith('.position') && core === 'Hips'
    if (!isQuat && !isHipsPos) continue

    const vrmBoneName = CORE_TO_VRM[core]
    if (!vrmBoneName) { unmatched.add(rawBone); continue }

    const node = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)
    if (!node) continue

    const cloned = track.clone()
    cloned.name  = `${node.name}${property}`
    newTracks.push(cloned)
  }

  if (unmatched.size > 0) {
    console.warn(`[VRMCharacter] ${label}: unmatched bones (safe to ignore finger/eye bones):`, [...unmatched])
  }
  if (newTracks.length === 0) {
    console.error(
      `[VRMCharacter] ${label}: 0 tracks retargeted!`,
      'Raw track names:', clip.tracks.slice(0, 6).map(t => t.name),
      '\nIf all bones show above, the FBX→GLB converter may have dropped animations.',
      '\nTry re-converting with https://imagetostl.com/convert/file/fbx/to/glb instead.'
    )
  } else {
    console.info(`[VRMCharacter] ${label}: retargeted ${newTracks.length} tracks OK`)
  }

  return new THREE.AnimationClip(clip.name, clip.duration, newTracks)
}

interface Props {
  email:         string
  uid:           string
  posRef:        React.MutableRefObject<THREE.Vector3>
  movingRef?:    React.MutableRefObject<boolean>
  facingRef?:    React.MutableRefObject<number>
  isLocalPlayer: boolean
  onVRMLoaded?:  (vrm: any) => void
}

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
      // ── 1. Resolve VRM URL
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

      // ── 2. Bond level (maybeSingle — no 404 when row absent)
      if (isLocalPlayer) {
        try {
          const { data: bond } = await supabase
            .from('couple_bond').select('level').maybeSingle()
          if (bond?.level) setBondLevel(bond.level)
        } catch (_) {}
      }
      if (isLocalPlayer) setVrmUrl(vrmUrl)

      // ── 3. Load VRM
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      const vrmGltf = await new Promise<any>((res, rej) =>
        loader.load(vrmUrl, res, undefined, rej)
      ).catch(e => { console.error('[VRMCharacter] VRM load error:', e); return null })
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

      // ── 4. Load animation GLBs in parallel
      const animLoader = new GLTFLoader()
      const [idleGltf, walkGltf] = await Promise.all([
        new Promise<any>((res, rej) => animLoader.load(IDLE_URL, res, undefined, rej))
          .catch(e => { console.error('[VRMCharacter] idle.glb error:', e); return null }),
        new Promise<any>((res, rej) => animLoader.load(WALK_URL, res, undefined, rej))
          .catch(e => { console.error('[VRMCharacter] walk.glb error:', e); return null }),
      ])
      if (cancelled) return

      // Log what we got so we can debug bone names if needed
      console.info('[VRMCharacter] idle clips:', idleGltf?.animations?.length,
        idleGltf?.animations?.[0]?.tracks?.slice(0,4).map((t: any) => t.name))
      console.info('[VRMCharacter] walk clips:', walkGltf?.animations?.length,
        walkGltf?.animations?.[0]?.tracks?.slice(0,4).map((t: any) => t.name))

      // ── 5. Retarget + AnimationMixer
      const mixer = new THREE.AnimationMixer(vrm.scene)
      mixerRef.current = mixer

      if (idleGltf?.animations?.length) {
        const action = mixer.clipAction(retargetClip(idleGltf.animations[0], vrm, 'idle'))
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
        idleActRef.current = action
      } else {
        console.error('[VRMCharacter] idle.glb has NO animation clips — re-convert the FBX')
      }

      if (walkGltf?.animations?.length) {
        const action = mixer.clipAction(retargetClip(walkGltf.animations[0], vrm, 'walk'))
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.setEffectiveWeight(0)
        action.play()
        walkActRef.current = action
      } else {
        console.error('[VRMCharacter] walk.glb has NO animation clips — re-convert the FBX')
      }
    }

    load()
    return () => {
      cancelled = true
      mixerRef.current?.stopAllAction()
      mixerRef.current = null; idleActRef.current = null; walkActRef.current = null
      if (vrmRef.current) { scene.remove(vrmRef.current.scene); vrmRef.current = null }
    }
  }, [email, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (!vrmRef.current || !mixerRef.current) return
    const delta  = clockRef.current.getDelta()
    const moving = movingRef?.current ?? false

    if (moving !== wasMoving.current) {
      wasMoving.current = moving
      if (moving) {
        walkActRef.current?.reset().fadeIn(0.25)
        idleActRef.current?.fadeOut(0.25)
      } else {
        idleActRef.current?.reset().fadeIn(0.25)
        walkActRef.current?.fadeOut(0.25)
      }
    }
    if (walkActRef.current) walkActRef.current.timeScale = moving ? 1.0 : 0

    vrmRef.current.scene.position.copy(posRef.current)

    if (facingRef) {
      const targetY  = facingRef.current + Math.PI
      const currentY = vrmRef.current.scene.rotation.y
      let diff = targetY - currentY
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      vrmRef.current.scene.rotation.y = currentY + diff * 0.15
    }

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
