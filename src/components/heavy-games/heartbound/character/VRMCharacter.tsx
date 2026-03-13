/**
 * VRMCharacter — Mixamo FBX → VRM  (Fix v6)
 *
 * v6 fixes:
 *  1. Hip posTrack suppressed — world position is owned by posRef/MovementController.
 *     Applying the FBX hip position track was offsetting the whole avatar each frame,
 *     causing the classic "sliding on ice" look where feet don't plant.
 *  2. Walk playback rate slowed to 0.75x (was 1.0x — felt rushed).
 *  3. Blend speed increased to 8x/s for snappier idle↔walk transition.
 *  4. Separate idleTime / walkTime clocks so each animation loops independently
 *     and the blend crossfade doesn't cause a time-jump glitch.
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

const BASE_ANIM  = 'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/animations'
const IDLE_URL   = `${BASE_ANIM}/idle.fbx`
const WALK_URL   = `${BASE_ANIM}/walk.fbx`

// Walk playback speed multiplier — lower = slower cycle, less sliding feel
const WALK_RATE  = 0.75
// Blend speed (higher = snappier idle↔walk crossfade)
const BLEND_RATE = 8

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

// ── Sampler types ────────────────────────────────────────────────────────────

interface BoneChannel {
  node:      THREE.Object3D
  quatTrack: THREE.QuaternionKeyframeTrack | null
  // posTrack intentionally omitted — hip world position driven by posRef
}

interface AnimData {
  channels: BoneChannel[]
  duration: number
}

// Scratch objects — allocated once
const _q  = new THREE.Quaternion()
const _qi = new THREE.QuaternionLinearInterpolant(
  new Float32Array(0), new Float32Array(0), 4, new Float32Array(4),
)

function sampleQuat(
  track: THREE.QuaternionKeyframeTrack,
  t: number,
  target: THREE.Quaternion,
) {
  const interp = _qi as any
  interp.parameterPositions = track.times
  interp.sampleValues       = track.values
  interp.resultBuffer       = new Float32Array(4)
  interp.evaluate(t)
  target.fromArray(interp.resultBuffer)
}

function applyAnim(anim: AnimData, t: number, weight: number) {
  if (weight <= 0.001) return
  const time = t % anim.duration
  for (const ch of anim.channels) {
    if (!ch.quatTrack) continue
    sampleQuat(ch.quatTrack, time, _q)
    if (weight >= 0.999) {
      ch.node.quaternion.copy(_q)
    } else {
      ch.node.quaternion.slerp(_q, weight)
    }
  }
}

// ── FBX retargeter ───────────────────────────────────────────────────────────

async function loadMixamoAnim(
  url: string,
  vrm: any,
  label: string,
): Promise<AnimData | null> {
  const asset = await new Promise<THREE.Group>((res, rej) =>
    new FBXLoader().load(url, res, undefined, rej)
  ).catch(e => { console.error(`[VRM] ${label} load err:`, e); return null })
  if (!asset) return null

  const clip = asset.animations?.[0]
  if (!clip) { console.error(`[VRM] ${label}: no animations`); return null }

  const isVRM0 = vrm.meta?.metaVersion === '0'
  const map    = new Map<string, BoneChannel>()

  const rri = new THREE.Quaternion()
  const prw = new THREE.Quaternion()
  const qa  = new THREE.Quaternion()

  clip.tracks.forEach((track: THREE.KeyframeTrack) => {
    // Only process quaternion tracks — skip position/scale entirely
    if (!(track instanceof THREE.QuaternionKeyframeTrack)) return

    const dot      = track.name.lastIndexOf('.')
    if (dot === -1) return
    const boneName = track.name.slice(0, dot)
    const vrmKey   = mixamoVRMRigMap[normaliseMixamoName(boneName)]
    if (!vrmKey) return

    const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmKey) as THREE.Object3D | null
    if (!vrmNode) return

    if (!map.has(vrmKey)) map.set(vrmKey, { node: vrmNode, quatTrack: null })
    const ch = map.get(vrmKey)!

    const fbxNode =
      asset.getObjectByName(boneName) ??
      asset.getObjectByName(normaliseMixamoName(boneName))
    if (!fbxNode) return

    fbxNode.getWorldQuaternion(rri).invert()
    fbxNode.parent
      ? fbxNode.parent.getWorldQuaternion(prw)
      : prw.identity()

    const src = track.values
    const dst = new Float32Array(src.length)
    for (let i = 0; i < src.length; i += 4) {
      qa.fromArray(src, i).premultiply(prw).multiply(rri)
      qa.toArray(dst, i)
    }

    let finalValues = dst
    if (isVRM0) {
      finalValues = new Float32Array(dst.length)
      for (let i = 0; i < dst.length; i++) {
        finalValues[i] = (i % 4 === 0 || i % 4 === 2) ? -dst[i] : dst[i]
      }
    }

    ch.quatTrack = new THREE.QuaternionKeyframeTrack(
      `${vrmKey}.quaternion`, track.times, finalValues,
    )
  })

  const channels = Array.from(map.values()).filter(c => c.quatTrack)
  console.info(`[VRM] ${label}: ${channels.length} bone channels (VRM${isVRM0 ? '0' : '1'})`)
  return channels.length > 0 ? { channels, duration: clip.duration } : null
}

// ── Component ────────────────────────────────────────────────────────────────

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
  const idleRef     = useRef<AnimData | null>(null)
  const walkRef     = useRef<AnimData | null>(null)
  const idleTimeRef = useRef(0)   // idle clock runs continuously
  const walkTimeRef = useRef(0)   // walk clock only advances when blending in
  const blendRef    = useRef(0)   // 0 = full idle, 1 = full walk

  const {
    equippedAccessories, bondLevel,
    setVrmUrl, setEquippedAccessories, setUnlockedAccessories, setBondLevel,
  } = useAvatarStore()

  useEffect(() => {
    let cancelled = false
    const load = async () => {

      // 1. Resolve VRM URL
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

      // 2. Load VRM
      const loader = new GLTFLoader()
      loader.register((parser) => new VRMLoaderPlugin(parser))
      const gltf = await new Promise<any>((res, rej) =>
        loader.load(vrmUrl, res, undefined, rej)
      ).catch(e => { console.error('[VRM] load error:', e); return null })
      if (cancelled || !gltf) return

      const vrm = gltf.userData.vrm
      if (!vrm) return

      VRMUtils.removeUnnecessaryVertices(gltf.scene)
      VRMUtils.rotateVRM0(vrm)
      vrm.scene.position.copy(posRef.current)
      scene.add(vrm.scene)
      vrmRef.current = vrm
      onVRMLoaded?.(vrm)

      // 3. Retarget FBX BEFORE combineSkeletons
      const [idle, walk] = await Promise.all([
        loadMixamoAnim(IDLE_URL, vrm, 'idle'),
        loadMixamoAnim(WALK_URL, vrm, 'walk'),
      ])
      if (cancelled) return

      // 4. Safe to combine now
      VRMUtils.combineSkeletons(gltf.scene)

      idleRef.current   = idle
      walkRef.current   = walk
      blendRef.current  = 0
      idleTimeRef.current = 0
      walkTimeRef.current = 0

      console.info('[VRM] ready ✓')
    }

    load()
    return () => {
      cancelled = true
      idleRef.current = null
      walkRef.current = null
      if (vrmRef.current) { scene.remove(vrmRef.current.scene); vrmRef.current = null }
    }
  }, [email, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_s, delta) => {
    if (!vrmRef.current) return

    const moving = movingRef?.current ?? false

    // Smooth blend
    const target = moving ? 1 : 0
    blendRef.current += (target - blendRef.current) * Math.min(delta * BLEND_RATE, 1)
    const blend = blendRef.current

    // Advance each clock independently at its own rate
    idleTimeRef.current += delta                    // idle always ticks at 1x
    walkTimeRef.current += delta * WALK_RATE        // walk ticks at 0.75x

    // Apply — idle fades out as walk fades in
    if (idleRef.current) applyAnim(idleRef.current, idleTimeRef.current, 1 - blend)
    if (walkRef.current)  applyAnim(walkRef.current,  walkTimeRef.current, blend)

    // World position
    vrmRef.current.scene.position.copy(posRef.current)

    // Smooth yaw
    if (facingRef) {
      const targetY  = facingRef.current + Math.PI
      const currentY = vrmRef.current.scene.rotation.y
      let diff = targetY - currentY
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      vrmRef.current.scene.rotation.y = currentY + diff * 0.15
    }

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
