/**
 * VRMCharacter — Mixamo FBX → VRM animation
 *
 * Uses the exact pattern from the official pixiv/three-vrm humanoidAnimation example:
 * https://pixiv.github.io/three-vrm/packages/three-vrm/examples/humanoidAnimation/
 *
 * Key operations per quaternion track:
 * 1. restRotationInverse  = inverse of mixamo bone's world rotation at rest
 * 2. parentRestWorldRot   = parent bone's world rotation at rest
 * 3. corrected = parentRestWorldRot * trackQuat * restRotationInverse
 * 4. VRM0 axis flip: negate x,z components (every even index in xyzw array)
 * 5. Target track name = vrmRawBoneNode.name (NOT normalized)
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

// Mixamo bone name (prefixed) → VRM humanoid bone key (lowercase)
// Source: https://pixiv.github.io/three-vrm/packages/three-vrm/examples/humanoidAnimation/mixamoVRMRigMap.js
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

/**
 * Normalise a raw FBX bone name to the "mixamorigXxx" format.
 * Handles: mixamorig_Hips → mixamorigHips, mixamorig:Hips → mixamorigHips
 */
function normaliseMixamoName(raw: string): string {
  if (raw.startsWith('mixamorig_'))  return 'mixamorig' + raw.slice('mixamorig_'.length)
  if (raw.startsWith('mixamorig:'))  return 'mixamorig' + raw.slice('mixamorig:'.length)
  return raw
}

/**
 * Load a Mixamo FBX file and convert its animation to drive a VRM model.
 * Implements the rest-pose correction from the official pixiv example.
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

  const isVRM0   = vrm.meta?.metaVersion === '0'
  const tracks: THREE.KeyframeTrack[] = []

  const restRotationInverse     = new THREE.Quaternion()
  const parentRestWorldRotation = new THREE.Quaternion()
  const _quatA = new THREE.Quaternion()

  // Scale factor: Mixamo FBX is in centimetres, VRM is in metres
  const motionHipsHeight = asset.getObjectByName('mixamorigHips')?.position.y
    ?? asset.getObjectByName('mixamorig_Hips')?.position.y
    ?? 1
  const _vec3 = new THREE.Vector3()
  const vrmHipsY      = vrm.humanoid?.getNormalizedBoneNode('hips')?.getWorldPosition(_vec3).y ?? 1
  const vrmRootY      = vrm.scene.getWorldPosition(_vec3).y
  const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY)
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight

  clip.tracks.forEach((track: THREE.KeyframeTrack) => {
    const [rawBoneName, property] = track.name.split('.')
    const mixamoName = normaliseMixamoName(rawBoneName)
    const vrmBoneKey = mixamoVRMRigMap[mixamoName]
    if (!vrmBoneKey) return

    // Use RAW bone node name as track target (not normalized)
    const vrmRawNode = vrm.humanoid?.getRawBoneNode(vrmBoneKey)
    if (!vrmRawNode) return

    // Mixamo source bone (for rest-pose correction)
    const mixamoNode = asset.getObjectByName(rawBoneName)
      ?? asset.getObjectByName(mixamoName)
    if (!mixamoNode) return

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      // Compute rest-pose correction quaternions
      mixamoNode.getWorldQuaternion(restRotationInverse).invert()
      mixamoNode.parent?.getWorldQuaternion(parentRestWorldRotation)
        ?? parentRestWorldRotation.identity()

      const newValues = new Float32Array(track.values.length)
      for (let i = 0; i < track.values.length; i += 4) {
        _quatA.fromArray(track.values, i)
          .premultiply(parentRestWorldRotation)
          .multiply(restRotationInverse)
        _quatA.toArray(newValues, i)
      }

      // FIX #1: VRM0 axis correction — negate x and z per quaternion (indices % 4 === 0 and % 4 === 2).
      // Must produce a Float32Array — Array.prototype.map() returns a plain Array which
      // causes silent NaN / identity quaternions inside Three.js QuaternionKeyframeTrack.
      let finalValues: Float32Array
      if (isVRM0) {
        finalValues = new Float32Array(newValues.length)
        for (let i = 0; i < newValues.length; i++) {
          // xyzw layout: x=i%4===0, y=i%4===1, z=i%4===2, w=i%4===3
          finalValues[i] = (i % 4 === 0 || i % 4 === 2) ? -newValues[i] : newValues[i]
        }
      } else {
        finalValues = newValues
      }

      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${vrmRawNode.name}.${property}`,
        track.times,
        finalValues,
      ))

    } else if (track instanceof THREE.VectorKeyframeTrack && vrmBoneKey === 'hips') {
      // Only keep hips position, scaled to VRM units, with VRM0 axis flip
      // FIX #1 (same): produce Float32Array instead of plain Array from .map()
      const hipValues = track.values
      const scaledValues = new Float32Array(hipValues.length)
      for (let i = 0; i < hipValues.length; i++) {
        scaledValues[i] = (isVRM0 && i % 3 !== 1 ? -hipValues[i] : hipValues[i]) * hipsPositionScale
      }
      tracks.push(new THREE.VectorKeyframeTrack(
        `${vrmRawNode.name}.${property}`,
        track.times,
        scaledValues,
      ))
    }
  })

  console.info(`[VRMCharacter] ${label}: ${tracks.length} tracks (VRM${isVRM0 ? '0' : '1'})`)
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

      // ── 2. Load VRM
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

      // ── 3. Load + convert FBX animations
      const [idleClip, walkClip] = await Promise.all([
        loadMixamoAnimation(IDLE_URL, vrm, 'idle'),
        loadMixamoAnimation(WALK_URL, vrm, 'walk'),
      ])
      if (cancelled) return

      // ── 4. AnimationMixer on vrm.scene
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
