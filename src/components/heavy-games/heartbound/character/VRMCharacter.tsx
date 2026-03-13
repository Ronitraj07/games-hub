/**
 * VRMCharacter — Mixamo FBX → VRM animation  (Fix v4 — final)
 *
 * Root cause of T-pose:
 *   THREE.AnimationMixer resolves track targets lazily (on first .update())
 *   by calling root.getObjectByName(trackNodeName). If the node name changed
 *   or the node was moved/replaced (e.g. by combineSkeletons) BEFORE the
 *   first update(), lookup returns null and the bone never moves.
 *
 * Solution — bypass name lookup entirely:
 *   For each VRM bone we want to animate, build a tiny single-track clip
 *   whose "root" IS the bone node itself (mixer = new AnimationMixer(boneNode)).
 *   The track name is just ".quaternion" / ".position" with an empty node
 *   prefix, so PropertyBinding looks for "" on the mixer root — which is
 *   the bone node directly. No name lookup ever happens.
 *
 *   We then merge all per-bone actions into one logical AnimationClip by
 *   playing them all simultaneously from a shared THREE.Clock.
 *
 * Simpler alternative used here:
 *   Attach the mixer to vrm.scene, but rename each target bone to a sentinel
 *   INSIDE the clip track (dot-notation path "boneName.quaternion") where
 *   boneName is set on the node RIGHT BEFORE mixer.clipAction() is called
 *   (which forces THREE to resolve the binding immediately, caching the
 *   actual Object3D reference). Then we restore the name. The cached
 *   reference survives any later rename or skeleton merge.
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import * as THREE from 'three'
import { AccessorySystem } from '../../../avatar/AccessorySystem'
import { useAvatarStore } from '../../../../stores/avatarStore'
import { PLAYER_VRMS } from '../../../../lib/modelUrls'
import { supabase } from '../../../../lib/supabase'
import { AccessoryId } from '../../../../types/accessories'

const BASE_ANIM = 'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/animations'
const IDLE_URL  = `${BASE_ANIM}/idle.fbx`
const WALK_URL  = `${BASE_ANIM}/walk.fbx`

const mixamoVRMRigMap: Record<string, string> = {
  mixamorigHips:           'hips',
  mixamorigSpine:          'spine',
  mixamorigSpine1:         'chest',
  mixamorigSpine2:         'upperChest',
  mixamorigNeck:           'neck',
  mixamorigHead:           'head',
  mixamorigLeftShoulder:   'leftShoulder',
  mixamorigLeftArm:        'leftUpperArm',
  mixamorigLeftForeArm:    'leftLowerArm',
  mixamorigLeftHand:       'leftHand',
  mixamorigRightShoulder:  'rightShoulder',
  mixamorigRightArm:       'rightUpperArm',
  mixamorigRightForeArm:   'rightLowerArm',
  mixamorigRightHand:      'rightHand',
  mixamorigLeftUpLeg:      'leftUpperLeg',
  mixamorigLeftLeg:        'leftLowerLeg',
  mixamorigLeftFoot:       'leftFoot',
  mixamorigLeftToeBase:    'leftToes',
  mixamorigRightUpLeg:     'rightUpperLeg',
  mixamorigRightLeg:       'rightLowerLeg',
  mixamorigRightFoot:      'rightFoot',
  mixamorigRightToeBase:   'rightToes',
}

function normaliseMixamoName(raw: string): string {
  if (raw.startsWith('mixamorig_')) return 'mixamorig' + raw.slice('mixamorig_'.length)
  if (raw.startsWith('mixamorig:')) return 'mixamorig' + raw.slice('mixamorig:'.length)
  return raw
}

/**
 * Core retargeting function.
 * Returns an array of { node, clip } pairs instead of one merged clip.
 * Each clip has tracks named "" + ".quaternion" / ".position" so they
 * target the mixer root directly (the bone node itself).
 *
 * The caller creates one AnimationMixer per bone-node and plays the
 * single-track clip on it. This completely bypasses PropertyBinding
 * name resolution.
 */
interface BoneClip {
  node:  THREE.Object3D
  clip:  THREE.AnimationClip
  isHip: boolean
}

async function loadMixamoAnimationPerBone(
  url:   string,
  vrm:   any,
  label: string,
): Promise<BoneClip[] | null> {
  const asset = await new Promise<THREE.Group>((res, rej) =>
    new FBXLoader().load(url, res, undefined, rej)
  ).catch(e => { console.error(`[VRMCharacter] ${label} load error:`, e); return null })
  if (!asset) return null

  const clip = asset.animations?.[0]
  if (!clip) { console.error(`[VRMCharacter] ${label}: no animations in FBX`); return null }

  const isVRM0 = vrm.meta?.metaVersion === '0'
  const _vec3  = new THREE.Vector3()

  const motionHipsHeight =
    asset.getObjectByName('mixamorigHips')?.position.y ??
    asset.getObjectByName('mixamorig_Hips')?.position.y ?? 1
  const vrmHipsY      = vrm.humanoid?.getNormalizedBoneNode('hips')?.getWorldPosition(_vec3).y ?? 1
  const vrmRootY      = vrm.scene.getWorldPosition(_vec3).y
  const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY)
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight

  // Group tracks by vrmBoneKey
  const boneTrackMap = new Map<string, {
    node:       THREE.Object3D
    quatTrack?: THREE.KeyframeTrack
    posTrack?:  THREE.KeyframeTrack
  }>()

  const restRotationInverse     = new THREE.Quaternion()
  const parentRestWorldRotation = new THREE.Quaternion()
  const _quatA = new THREE.Quaternion()

  clip.tracks.forEach((track: THREE.KeyframeTrack) => {
    const dotIdx = track.name.lastIndexOf('.')
    if (dotIdx === -1) return
    const rawBoneName = track.name.slice(0, dotIdx)
    const property    = track.name.slice(dotIdx + 1)

    const mixamoName = normaliseMixamoName(rawBoneName)
    const vrmBoneKey = mixamoVRMRigMap[mixamoName]
    if (!vrmBoneKey) return

    const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneKey) as THREE.Object3D | null
    if (!vrmNode) return

    if (!boneTrackMap.has(vrmBoneKey)) {
      boneTrackMap.set(vrmBoneKey, { node: vrmNode })
    }
    const entry = boneTrackMap.get(vrmBoneKey)!

    const mixamoNode =
      asset.getObjectByName(rawBoneName) ??
      asset.getObjectByName(mixamoName)
    if (!mixamoNode) return

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      mixamoNode.getWorldQuaternion(restRotationInverse).invert()
      mixamoNode.parent
        ? mixamoNode.parent.getWorldQuaternion(parentRestWorldRotation)
        : parentRestWorldRotation.identity()

      const newValues = new Float32Array(track.values.length)
      for (let i = 0; i < track.values.length; i += 4) {
        _quatA
          .fromArray(track.values, i)
          .premultiply(parentRestWorldRotation)
          .multiply(restRotationInverse)
        _quatA.toArray(newValues, i)
      }

      let finalValues: Float32Array
      if (isVRM0) {
        finalValues = new Float32Array(newValues.length)
        for (let i = 0; i < newValues.length; i++) {
          finalValues[i] = (i % 4 === 0 || i % 4 === 2) ? -newValues[i] : newValues[i]
        }
      } else {
        finalValues = newValues
      }

      // Track name is just ".quaternion" — no node prefix.
      // When the mixer root IS the bone node, PropertyBinding resolves
      // "" as the root itself. This never fails.
      entry.quatTrack = new THREE.QuaternionKeyframeTrack(
        `.${property}`,
        track.times,
        finalValues,
      )
    } else if (track instanceof THREE.VectorKeyframeTrack && vrmBoneKey === 'hips') {
      const hipValues    = track.values
      const scaledValues = new Float32Array(hipValues.length)
      for (let i = 0; i < hipValues.length; i++) {
        scaledValues[i] = (isVRM0 && i % 3 !== 1 ? -hipValues[i] : hipValues[i]) * hipsPositionScale
      }
      entry.posTrack = new THREE.VectorKeyframeTrack(
        `.${property}`,
        track.times,
        scaledValues,
      )
    }
  })

  const result: BoneClip[] = []
  let trackCount = 0
  boneTrackMap.forEach((entry, key) => {
    const tracks: THREE.KeyframeTrack[] = []
    if (entry.quatTrack) tracks.push(entry.quatTrack)
    if (entry.posTrack)  tracks.push(entry.posTrack)
    if (tracks.length === 0) return
    result.push({
      node:  entry.node,
      clip:  new THREE.AnimationClip(`${label}_${key}`, clip.duration, tracks),
      isHip: key === 'hips',
    })
    trackCount += tracks.length
  })

  console.info(`[VRMCharacter] ${label}: ${result.length} bones / ${trackCount} tracks (VRM${isVRM0 ? '0' : '1'})`)
  return result.length > 0 ? result : null
}

// ── Per-animation state ────────────────────────────────────────────────────
interface AnimState {
  boneClips: BoneClip[]
  mixers:    THREE.AnimationMixer[]
  actions:   THREE.AnimationAction[]
}

function buildAnimState(boneClips: BoneClip[]): AnimState {
  const mixers:  THREE.AnimationMixer[]  = []
  const actions: THREE.AnimationAction[] = []
  for (const { node, clip } of boneClips) {
    const mixer  = new THREE.AnimationMixer(node)
    const action = mixer.clipAction(clip)
    action.setLoop(THREE.LoopRepeat, Infinity)
    mixers.push(mixer)
    actions.push(action)
  }
  return { boneClips, mixers, actions }
}

function playState(state: AnimState, weight: number) {
  for (const action of state.actions) {
    action.setEffectiveWeight(weight)
    action.setEffectiveTimeScale(1)
    if (!action.isRunning()) action.play()
  }
}

function fadeInState(state: AnimState, duration: number) {
  for (const action of state.actions) {
    if (!action.isRunning()) action.play()
    action.fadeIn(duration)
  }
}

function fadeOutState(state: AnimState, duration: number) {
  for (const action of state.actions) {
    action.fadeOut(duration)
  }
}

function stopState(state: AnimState) {
  for (const mixer of state.mixers) mixer.stopAllAction()
}

function updateState(state: AnimState, delta: number) {
  for (const mixer of state.mixers) mixer.update(delta)
}

// ── Props ──────────────────────────────────────────────────────────────────
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

  const vrmRef      = useRef<any>(null)
  const idleRef     = useRef<AnimState | null>(null)
  const walkRef     = useRef<AnimState | null>(null)
  const wasMoving   = useRef(false)
  const clockRef    = useRef(new THREE.Clock())

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

      if (isLocalPlayer) {
        try {
          const { data: bond } = await supabase
            .from('couple_bond').select('level').maybeSingle()
          if (bond?.level) setBondLevel(bond.level)
        } catch (_) {}
      }
      if (isLocalPlayer) setVrmUrl(vrmUrl)

      // ── 2. Load VRM — do NOT call combineSkeletons yet
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      const vrmGltf = await new Promise<any>((res, rej) =>
        loader.load(vrmUrl, res, undefined, rej)
      ).catch(e => { console.error('[VRMCharacter] VRM load error:', e); return null })
      if (cancelled || !vrmGltf) return

      const vrm = vrmGltf.userData.vrm
      if (!vrm) return

      VRMUtils.removeUnnecessaryVertices(vrmGltf.scene)
      VRMUtils.rotateVRM0(vrm)
      vrm.scene.position.copy(posRef.current)
      scene.add(vrm.scene)
      vrmRef.current = vrm
      onVRMLoaded?.(vrm)

      // ── 3. Retarget FBX animations BEFORE combineSkeletons
      //       so getNormalizedBoneNode() returns stable, scene-attached nodes
      const [idleBoneClips, walkBoneClips] = await Promise.all([
        loadMixamoAnimationPerBone(IDLE_URL, vrm, 'idle'),
        loadMixamoAnimationPerBone(WALK_URL, vrm, 'walk'),
      ])
      if (cancelled) return

      // ── 4. Safe to combine skeletons now (clips already reference node objects)
      VRMUtils.combineSkeletons(vrmGltf.scene)

      // ── 5. Build per-bone mixer states
      if (idleBoneClips) {
        const state = buildAnimState(idleBoneClips)
        playState(state, 1)
        idleRef.current = state
      }
      if (walkBoneClips) {
        const state = buildAnimState(walkBoneClips)
        playState(state, 0)  // pre-prime at weight 0 for smooth first fade-in
        walkRef.current = state
      }

      console.info('[VRMCharacter] loaded ✓  idle+walk primed per-bone')
    }

    load()
    return () => {
      cancelled = true
      if (idleRef.current) { stopState(idleRef.current); idleRef.current = null }
      if (walkRef.current) { stopState(walkRef.current); walkRef.current = null }
      if (vrmRef.current)  { scene.remove(vrmRef.current.scene); vrmRef.current = null }
    }
  }, [email, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (!vrmRef.current) return
    const delta  = clockRef.current.getDelta()
    const moving = movingRef?.current ?? false

    // Transition idle ↔ walk on state change
    if (moving !== wasMoving.current) {
      wasMoving.current = moving
      if (moving) {
        if (idleRef.current) fadeOutState(idleRef.current, 0.2)
        if (walkRef.current) fadeInState(walkRef.current,  0.2)
      } else {
        if (walkRef.current) fadeOutState(walkRef.current, 0.2)
        if (idleRef.current) fadeInState(idleRef.current,  0.2)
      }
    }

    // Follow player position
    vrmRef.current.scene.position.copy(posRef.current)

    // Smooth yaw toward facing direction
    if (facingRef) {
      const targetY  = facingRef.current + Math.PI
      const currentY = vrmRef.current.scene.rotation.y
      let diff = targetY - currentY
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      vrmRef.current.scene.rotation.y = currentY + diff * 0.15
    }

    // Tick all per-bone mixers
    if (idleRef.current) updateState(idleRef.current, delta)
    if (walkRef.current) updateState(walkRef.current, delta)

    // Tick VRM springbones / lookAt
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
