/**
 * VRMCharacter — Mixamo GLB → VRM animation retargeting
 *
 * Verified pattern from gabber.dev + pixiv/three-vrm examples:
 * - MIXAMO_VRM_MAP values are lowercase strings (e.g. 'hips', 'spine')
 *   matching the keys accepted by vrm.humanoid.getNormalizedBoneNode()
 * - Track name = vrmNode.name + '.' + property (e.g. 'J_Bip_C_Hips.quaternion')
 * - AnimationMixer targets vrm.scene
 * - mixer.update() then vrm.update() every frame
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
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

// ─── Mixamo core bone name → VRM humanoid bone key (lowercase strings) ───────────
// Values MUST be lowercase strings exactly as accepted by getNormalizedBoneNode().
// Ref: https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm-core/src/humanoid/VRMHumanBoneName.ts
const MIXAMO_VRM_MAP: Record<string, string> = {
  Hips:           'hips',
  Spine:          'spine',
  Spine1:         'chest',
  Spine2:         'upperChest',
  Neck:           'neck',
  Head:           'head',
  LeftShoulder:   'leftShoulder',
  LeftArm:        'leftUpperArm',
  LeftForeArm:    'leftLowerArm',
  LeftHand:       'leftHand',
  RightShoulder:  'rightShoulder',
  RightArm:       'rightUpperArm',
  RightForeArm:   'rightLowerArm',
  RightHand:      'rightHand',
  LeftUpLeg:      'leftUpperLeg',
  LeftLeg:        'leftLowerLeg',
  LeftFoot:       'leftFoot',
  LeftToeBase:    'leftToes',
  RightUpLeg:     'rightUpperLeg',
  RightLeg:       'rightLowerLeg',
  RightFoot:      'rightFoot',
  RightToeBase:   'rightToes',
}

/** Strip any Mixamo prefix to get bare bone name: "mixamorig_Hips" → "Hips" */
function coreBoneName(raw: string): string {
  const pipeIdx = raw.lastIndexOf('|')
  let name = pipeIdx !== -1 ? raw.slice(pipeIdx + 1) : raw
  if      (name.startsWith('mixamorig_'))  name = name.slice('mixamorig_'.length)
  else if (name.startsWith('mixamorig:'))  name = name.slice('mixamorig:'.length)
  else if (name.startsWith('mixamorig'))   name = name.slice('mixamorig'.length)
  return name
}

async function loadMixamoAnimation(
  url: string,
  vrm: any,
  label: string
): Promise<THREE.AnimationClip | null> {
  const gltf = await new Promise<any>((res, rej) =>
    new GLTFLoader().load(url, res, undefined, rej)
  ).catch(e => { console.error(`[VRMCharacter] ${label} load error:`, e); return null })

  if (!gltf?.animations?.length) {
    console.error(`[VRMCharacter] ${label}: no animation clips in file`)
    return null
  }

  const clip   = gltf.animations[0]
  const tracks: THREE.KeyframeTrack[] = []

  clip.tracks.forEach((track: THREE.KeyframeTrack) => {
    const [mixamoBoneName, property] = track.name.split('.')
    const core       = coreBoneName(mixamoBoneName)
    const vrmBoneKey = MIXAMO_VRM_MAP[core]
    if (!vrmBoneKey) return

    const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneKey)?.name
    if (!vrmNodeName) return

    // Rebuild track with VRM node name, keep original property (quaternion/position/scale)
    if (property === 'quaternion') {
      tracks.push(new THREE.QuaternionKeyframeTrack(
        `${vrmNodeName}.quaternion`,
        track.times,
        track.values,
      ))
    }
    // Skip position/scale — Mixamo bakes root motion which breaks VRM position
  })

  console.info(`[VRMCharacter] ${label}: ${tracks.length} tracks retargeted from ${clip.tracks.length} source tracks`)
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

      // ── 3. Load + retarget animations
      const [idleClip, walkClip] = await Promise.all([
        loadMixamoAnimation(IDLE_URL, vrm, 'idle'),
        loadMixamoAnimation(WALK_URL, vrm, 'walk'),
      ])
      if (cancelled) return

      // ── 4. Set up mixer on vrm.scene
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
