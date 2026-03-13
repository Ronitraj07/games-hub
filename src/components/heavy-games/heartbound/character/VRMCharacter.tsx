/**
 * VRMCharacter — Mixamo FBX → VRM animation
 *
 * Fix Summary:
 *  1. Use getNormalizedBoneNode() instead of getRawBoneNode() — normalized
 *     nodes are always accessible after VRMUtils operations and their
 *     quaternions are what the mixer should drive.
 *  2. Temporarily rename each bone to a unique tag before building the clip
 *     so PropertyBinding can find it by name from vrm.scene, then restore
 *     the original name. This is simpler and more reliable than dot-paths
 *     or UUID prefixes across Three.js versions.
 *  3. combineSkeletons() is called AFTER animations are loaded — bone nodes
 *     are stable during retargeting, preventing UUID/name drift.
 *  4. walkClip action is also .play()-ed at weight 0 so it is primed in the
 *     mixer and fade-in is instant and glitch-free.
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

// Mixamo bone name → VRM humanoid bone key
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
 * Retargets a Mixamo FBX animation clip to a VRM skeleton.
 *
 * Strategy:
 *  - Use vrm.humanoid.getNormalizedBoneNode(key) — these nodes are the actual
 *    scene-graph objects the mixer drives for VRM1, and they remain valid
 *    after combineSkeletons().
 *  - Temporarily assign a unique sentinel name to each target bone so
 *    THREE.PropertyBinding can resolve it via simple name lookup from
 *    vrm.scene. Restore the original name after building the clip.
 *  - Quaternion rest-pose correction is applied per Mixamo retargeting spec.
 *  - Hip position track is scaled from cm → m.
 */
async function loadMixamoAnimation(
  url: string,
  vrm: any,
  label: string,
): Promise<THREE.AnimationClip | null> {
  const asset = await new Promise<THREE.Group>((res, rej) =>
    new FBXLoader().load(url, res, undefined, rej)
  ).catch(e => { console.error(`[VRMCharacter] ${label} load error:`, e); return null })
  if (!asset) return null

  const clip = asset.animations?.[0]
  if (!clip) { console.error(`[VRMCharacter] ${label}: no clip`); return null }

  const isVRM0 = vrm.meta?.metaVersion === '0'
  const tracks: THREE.KeyframeTrack[] = []

  const restRotationInverse     = new THREE.Quaternion()
  const parentRestWorldRotation = new THREE.Quaternion()
  const _quatA = new THREE.Quaternion()
  const _vec3  = new THREE.Vector3()

  // Scale factor: Mixamo FBX uses centimetres, VRM uses metres
  const motionHipsHeight =
    asset.getObjectByName('mixamorigHips')?.position.y ??
    asset.getObjectByName('mixamorig_Hips')?.position.y ?? 1
  const vrmHipsY      = vrm.humanoid?.getNormalizedBoneNode('hips')?.getWorldPosition(_vec3).y ?? 1
  const vrmRootY      = vrm.scene.getWorldPosition(_vec3).y
  const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY)
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight

  // We'll temporarily rename bones during track construction
  const nameRestoreMap = new Map<THREE.Object3D, string>()

  clip.tracks.forEach((track: THREE.KeyframeTrack) => {
    const dotIdx = track.name.lastIndexOf('.')
    if (dotIdx === -1) return
    const rawBoneName = track.name.slice(0, dotIdx)
    const property    = track.name.slice(dotIdx + 1)

    const mixamoName = normaliseMixamoName(rawBoneName)
    const vrmBoneKey = mixamoVRMRigMap[mixamoName]
    if (!vrmBoneKey) return

    // Use getNormalizedBoneNode — works for both VRM0 and VRM1 post-combineSkeletons
    const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneKey) as THREE.Object3D | null
    if (!vrmNode) return

    // Give this node a unique sentinel name so PropertyBinding can find it
    if (!nameRestoreMap.has(vrmNode)) {
      nameRestoreMap.set(vrmNode, vrmNode.name)
      vrmNode.name = `__vrm_${vrmBoneKey}_${vrmNode.uuid.slice(0, 8)}`
    }
    const trackNodeName = vrmNode.name

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

      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${trackNodeName}.${property}`,
        track.times,
        finalValues,
      ))

    } else if (track instanceof THREE.VectorKeyframeTrack && vrmBoneKey === 'hips') {
      const hipValues    = track.values
      const scaledValues = new Float32Array(hipValues.length)
      for (let i = 0; i < hipValues.length; i++) {
        scaledValues[i] = (isVRM0 && i % 3 !== 1 ? -hipValues[i] : hipValues[i]) * hipsPositionScale
      }
      tracks.push(new THREE.VectorKeyframeTrack(
        `${trackNodeName}.${property}`,
        track.times,
        scaledValues,
      ))
    }
  })

  // Restore all bone names after clip is built
  nameRestoreMap.forEach((originalName, node) => {
    node.name = originalName
  })

  console.info(`[VRMCharacter] ${label}: ${tracks.length} tracks retargeted (VRM${isVRM0 ? '0' : '1'})`)
  return new THREE.AnimationClip(label, clip.duration, tracks)
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
      // ── 1. Resolve VRM URL from Supabase profile
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

      // ── 2. Load VRM (do NOT call combineSkeletons yet)
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      const vrmGltf = await new Promise<any>((res, rej) =>
        loader.load(vrmUrl, res, undefined, rej)
      ).catch(e => { console.error('[VRMCharacter] VRM load error:', e); return null })
      if (cancelled || !vrmGltf) return

      const vrm = vrmGltf.userData.vrm
      if (!vrm) return

      VRMUtils.removeUnnecessaryVertices(vrmGltf.scene)
      // NOTE: rotateVRM0 before adding to scene so world transforms are correct
      VRMUtils.rotateVRM0(vrm)
      vrm.scene.position.copy(posRef.current)
      scene.add(vrm.scene)
      vrmRef.current = vrm
      onVRMLoaded?.(vrm)

      // ── 3. Load + retarget FBX animations BEFORE combineSkeletons
      //       so bone nodes/names are stable during retargeting
      const [idleClip, walkClip] = await Promise.all([
        loadMixamoAnimation(IDLE_URL, vrm, 'idle'),
        loadMixamoAnimation(WALK_URL, vrm, 'walk'),
      ])
      if (cancelled) return

      // ── 4. NOW it is safe to combine skeletons (clips already built)
      VRMUtils.combineSkeletons(vrmGltf.scene)

      // ── 5. Mixer bound to vrm.scene
      const mixer = new THREE.AnimationMixer(vrm.scene)
      mixerRef.current = mixer

      if (idleClip) {
        const action = mixer.clipAction(idleClip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.setEffectiveWeight(1)
        action.setEffectiveTimeScale(1)
        action.play()
        idleActRef.current = action
      }

      if (walkClip) {
        const action = mixer.clipAction(walkClip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.setEffectiveWeight(0)
        action.setEffectiveTimeScale(1)
        // Pre-prime the walk action at weight 0 so first fade-in is instant
        action.play()
        walkActRef.current = action
      }

      console.info('[VRMCharacter] loaded & animations primed ✓')
    }

    load()
    return () => {
      cancelled = true
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      idleActRef.current = null
      walkActRef.current = null
      if (vrmRef.current) { scene.remove(vrmRef.current.scene); vrmRef.current = null }
    }
  }, [email, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (!vrmRef.current || !mixerRef.current) return
    const delta  = clockRef.current.getDelta()
    const moving = movingRef?.current ?? false

    // Transition between idle ↔ walk only on state change
    if (moving !== wasMoving.current) {
      wasMoving.current = moving
      if (moving) {
        idleActRef.current?.fadeOut(0.2)
        if (walkActRef.current) {
          walkActRef.current.setEffectiveWeight(1)
          walkActRef.current.fadeIn(0.2)
        }
      } else {
        walkActRef.current?.fadeOut(0.2)
        if (idleActRef.current) {
          idleActRef.current.setEffectiveWeight(1)
          idleActRef.current.fadeIn(0.2)
        }
      }
    }

    // Follow posRef
    vrmRef.current.scene.position.copy(posRef.current)

    // Smooth rotation toward facing direction
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
