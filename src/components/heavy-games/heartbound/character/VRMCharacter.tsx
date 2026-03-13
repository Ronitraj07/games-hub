/**
 * VRMCharacter — Mixamo FBX → VRM  (Fix v5 — manual sampler, no AnimationMixer)
 *
 * All previous attempts used THREE.AnimationMixer which relies on
 * THREE.PropertyBinding to find bones by name in the scene graph.
 * PropertyBinding ALWAYS fails after VRMUtils.combineSkeletons() because
 * the normalized bone nodes are not named objects inside vrm.scene —
 * they live in a separate humanoid node map and combineSkeletons moves them.
 *
 * Solution: do NOT use AnimationMixer at all.
 * Instead we manually sample each keyframe track every frame using
 * THREE.KeyframeTrack + a simple time pointer, and write the result
 * directly to vrmNode.quaternion / vrmNode.position.
 * No name lookups. No PropertyBinding. Zero chance of silent failure.
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

// ── Manual sampler types ────────────────────────────────────────────────────

interface BoneChannel {
  node:      THREE.Object3D  // direct reference — survives any rename/merge
  quatTrack: THREE.QuaternionKeyframeTrack | null
  posTrack:  THREE.VectorKeyframeTrack    | null
}

interface AnimData {
  channels: BoneChannel[]
  duration: number
}

// Reusable scratch objects — allocated once, reused every frame
const _q  = new THREE.Quaternion()
const _v  = new THREE.Vector3()
const _qi = new THREE.QuaternionLinearInterpolant(new Float32Array(0), new Float32Array(0), 4, new Float32Array(4))
const _vi = new THREE.LinearInterpolant(new Float32Array(0), new Float32Array(0), 3, new Float32Array(3))

/**
 * Sample a QuaternionKeyframeTrack at time t and write into target.
 * Uses THREE's built-in QuaternionLinearInterpolant (slerp).
 */
function sampleQuat(track: THREE.QuaternionKeyframeTrack, t: number, target: THREE.Quaternion) {
  const interp = _qi as any
  interp.parameterPositions = track.times
  interp.sampleValues        = track.values
  interp.resultBuffer        = new Float32Array(4)
  interp.evaluate(t)
  target.fromArray(interp.resultBuffer)
}

/**
 * Sample a VectorKeyframeTrack at time t and write into target.
 */
function sampleVec(track: THREE.VectorKeyframeTrack, t: number, target: THREE.Vector3) {
  const interp = _vi as any
  interp.parameterPositions = track.times
  interp.sampleValues        = track.values
  interp.resultBuffer        = new Float32Array(3)
  interp.evaluate(t)
  target.fromArray(interp.resultBuffer)
}

/**
 * Apply an AnimData at a given playback time to all its bone channels.
 * weight: 0.0 → 1.0  (for fade blending between idle and walk)
 */
function applyAnim(anim: AnimData, t: number, weight: number) {
  if (weight <= 0) return
  const time = t % anim.duration
  for (const ch of anim.channels) {
    if (ch.quatTrack) {
      sampleQuat(ch.quatTrack, time, _q)
      if (weight >= 1) {
        ch.node.quaternion.copy(_q)
      } else {
        ch.node.quaternion.slerp(_q, weight)
      }
    }
    if (ch.posTrack) {
      sampleVec(ch.posTrack, time, _v)
      if (weight >= 1) {
        ch.node.position.copy(_v)
      } else {
        ch.node.position.lerp(_v, weight)
      }
    }
  }
}

// ── FBX retargeter ───────────────────────────────────────────────────────────────
async function loadMixamoAnim(url: string, vrm: any, label: string): Promise<AnimData | null> {
  const asset = await new Promise<THREE.Group>((res, rej) =>
    new FBXLoader().load(url, res, undefined, rej)
  ).catch(e => { console.error(`[VRM] ${label} load err:`, e); return null })
  if (!asset) return null

  const clip = asset.animations?.[0]
  if (!clip) { console.error(`[VRM] ${label}: no animations`); return null }

  const isVRM0 = vrm.meta?.metaVersion === '0'
  const _vec3  = new THREE.Vector3()

  const motionHipsHeight =
    asset.getObjectByName('mixamorigHips')?.position.y ??
    asset.getObjectByName('mixamorig_Hips')?.position.y ?? 1
  const vrmHipsY      = vrm.humanoid?.getNormalizedBoneNode('hips')?.getWorldPosition(_vec3).y ?? 1
  const vrmRootY      = vrm.scene.getWorldPosition(_vec3).y
  const hipsScale     = Math.abs(vrmHipsY - vrmRootY) / motionHipsHeight

  // bone key → { node, quatTrack, posTrack }
  const map = new Map<string, BoneChannel>()

  const rri = new THREE.Quaternion()   // rest rotation inverse
  const prw = new THREE.Quaternion()   // parent rest world rotation
  const qa  = new THREE.Quaternion()

  clip.tracks.forEach((track: THREE.KeyframeTrack) => {
    const dot      = track.name.lastIndexOf('.')
    if (dot === -1) return
    const boneName = track.name.slice(0, dot)
    const prop     = track.name.slice(dot + 1)
    const vrmKey   = mixamoVRMRigMap[normaliseMixamoName(boneName)]
    if (!vrmKey) return

    const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmKey) as THREE.Object3D | null
    if (!vrmNode) return

    if (!map.has(vrmKey)) map.set(vrmKey, { node: vrmNode, quatTrack: null, posTrack: null })
    const ch = map.get(vrmKey)!

    const fbxNode = asset.getObjectByName(boneName) ?? asset.getObjectByName(normaliseMixamoName(boneName))
    if (!fbxNode) return

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      fbxNode.getWorldQuaternion(rri).invert()
      fbxNode.parent ? fbxNode.parent.getWorldQuaternion(prw) : prw.identity()

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
    } else if (prop === 'position' && vrmKey === 'hips') {
      const src = track.values
      const dst = new Float32Array(src.length)
      for (let i = 0; i < src.length; i++) {
        dst[i] = (isVRM0 && i % 3 !== 1 ? -src[i] : src[i]) * hipsScale
      }
      ch.posTrack = new THREE.VectorKeyframeTrack(
        `${vrmKey}.position`, track.times, dst,
      )
    }
  })

  const channels = Array.from(map.values()).filter(c => c.quatTrack || c.posTrack)
  console.info(`[VRM] ${label}: ${channels.length} bone channels (VRM${isVRM0 ? '0' : '1'})`)
  return channels.length > 0 ? { channels, duration: clip.duration } : null
}

// ── Component ─────────────────────────────────────────────────────────────────────

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

  const vrmRef    = useRef<any>(null)
  const idleRef   = useRef<AnimData | null>(null)
  const walkRef   = useRef<AnimData | null>(null)
  const timeRef   = useRef(0)           // shared playback clock
  const blendRef  = useRef(0)           // 0 = full idle, 1 = full walk
  const wasMoving = useRef(false)

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

      // 3. Retarget FBX — BEFORE combineSkeletons so bone nodes are stable
      const [idle, walk] = await Promise.all([
        loadMixamoAnim(IDLE_URL, vrm, 'idle'),
        loadMixamoAnim(WALK_URL, vrm, 'walk'),
      ])
      if (cancelled) return

      // 4. Now safe to combine (AnimData holds direct node refs, not names)
      VRMUtils.combineSkeletons(gltf.scene)

      idleRef.current = idle
      walkRef.current = walk
      blendRef.current = 0   // start in idle
      timeRef.current  = 0

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

    // Advance shared time
    timeRef.current += delta

    const moving = movingRef?.current ?? false

    // Smooth blend: 0 = idle, 1 = walk  (lerp at ~5x/s)
    const targetBlend = moving ? 1 : 0
    blendRef.current += (targetBlend - blendRef.current) * Math.min(delta * 5, 1)
    const blend = blendRef.current

    // Apply animations
    const t = timeRef.current
    if (idleRef.current) applyAnim(idleRef.current, t, 1 - blend)
    if (walkRef.current)  applyAnim(walkRef.current,  t, blend)

    // Position
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

    // VRM springbones / lookAt
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
