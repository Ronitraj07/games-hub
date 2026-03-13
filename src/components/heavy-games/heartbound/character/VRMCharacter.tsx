/**
 * VRMCharacter — Mixamo GLB animation retargeting
 *
 * Works with both VRM 0.x and VRM 1.x.
 * Mixer root = normalizedHumanBonesRoot (VRM1) or vrm.scene (VRM0 fallback).
 * Idle plays at weight 1 by default; walk starts at weight 0 and fades in.
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

function coreBoneName(raw: string): string {
  const pipeIdx = raw.lastIndexOf('|')
  let name = pipeIdx !== -1 ? raw.slice(pipeIdx + 1) : raw
  if (name.startsWith('mixamorig_'))      name = name.slice('mixamorig_'.length)
  else if (name.startsWith('mixamorig:')) name = name.slice('mixamorig:'.length)
  else if (name.startsWith('mixamorig'))  name = name.slice('mixamorig'.length)
  return name
}

function retargetClip(
  clip: THREE.AnimationClip,
  vrm: any,
  mixerRoot: THREE.Object3D,
  label: string
): THREE.AnimationClip {
  const newTracks: THREE.KeyframeTrack[] = []

  for (const track of clip.tracks) {
    const dotIdx  = track.name.indexOf('.')
    if (dotIdx === -1) continue
    const rawBone  = track.name.substring(0, dotIdx)
    const property = track.name.substring(dotIdx)
    const core     = coreBoneName(rawBone)

    const isQuat    = property.startsWith('.quaternion')
    const isHipsPos = property.startsWith('.position') && core === 'Hips'
    if (!isQuat && !isHipsPos) continue

    const vrmBoneName = CORE_TO_VRM[core]
    if (!vrmBoneName) continue

    const node = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)
    if (!node) continue

    // Build the path relative to mixerRoot so AnimationMixer resolves it
    const path = buildPath(node, mixerRoot)
    if (path === null) continue

    const cloned = track.clone()
    // If node IS the root, path is empty string → just use property without leading dot
    cloned.name = path ? `${path}${property}` : node.name + property
    newTracks.push(cloned)
  }

  console.info(`[VRMCharacter] ${label}: ${newTracks.length} tracks retargeted`)
  return new THREE.AnimationClip(clip.name, clip.duration, newTracks)
}

/**
 * Build the dot-separated path from mixerRoot down to target node.
 * AnimationMixer uses this path to traverse the scene graph.
 * Returns null if node is not a descendant of root.
 */
function buildPath(node: THREE.Object3D, root: THREE.Object3D): string | null {
  const parts: string[] = []
  let current: THREE.Object3D | null = node
  while (current && current !== root) {
    parts.unshift(current.name)
    current = current.parent
  }
  if (current !== root) return null
  return parts.join('/')
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

      // ── 2. Bond level
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

      const vrmMeta = vrm.meta?.metaVersion ?? vrm.meta?.version ?? '?'
      console.info('[VRMCharacter] VRM meta version:', vrmMeta)

      // ── 4. Pick mixer root
      // VRM1: normalizedHumanBonesRoot exists and is the correct target
      // VRM0: use vrm.scene directly (VRMUtils.rotateVRM0 already fixed axes)
      const mixerRoot: THREE.Object3D =
        vrm.humanoid?.normalizedHumanBonesRoot ?? vrm.scene
      console.info('[VRMCharacter] mixer root:', mixerRoot.name || mixerRoot.type)

      // ── 5. Load animation GLBs
      const animLoader = new GLTFLoader()
      const [idleGltf, walkGltf] = await Promise.all([
        new Promise<any>((res, rej) => animLoader.load(IDLE_URL, res, undefined, rej))
          .catch(e => { console.error('[VRMCharacter] idle.glb error:', e); return null }),
        new Promise<any>((res, rej) => animLoader.load(WALK_URL, res, undefined, rej))
          .catch(e => { console.error('[VRMCharacter] walk.glb error:', e); return null }),
      ])
      if (cancelled) return

      // ── 6. Retarget + AnimationMixer
      const mixer = new THREE.AnimationMixer(mixerRoot)
      mixerRef.current = mixer

      if (idleGltf?.animations?.length) {
        const clip   = retargetClip(idleGltf.animations[0], vrm, mixerRoot, 'idle')
        const action = mixer.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.setEffectiveWeight(1)   // idle starts VISIBLE
        action.setEffectiveTimeScale(1)
        action.play()
        idleActRef.current = action
      }

      if (walkGltf?.animations?.length) {
        const clip   = retargetClip(walkGltf.animations[0], vrm, mixerRoot, 'walk')
        const action = mixer.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.setEffectiveWeight(0)   // walk starts invisible
        action.setEffectiveTimeScale(1)
        action.play()
        walkActRef.current = action
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

    // Crossfade idle ↔ walk on state change
    if (moving !== wasMoving.current) {
      wasMoving.current = moving
      if (moving) {
        idleActRef.current?.fadeOut(0.3)
        walkActRef.current?.reset().fadeIn(0.3)
      } else {
        walkActRef.current?.fadeOut(0.3)
        idleActRef.current?.reset().fadeIn(0.3)
      }
    }

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
