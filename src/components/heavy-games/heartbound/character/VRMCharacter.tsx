/**
 * VRMCharacter — Mixamo FBX → VRM animation via SkeletonUtils.retargetClip
 *
 * Why FBX instead of GLB:
 *   - GLB converters (Aspose etc) mangle bone names and drop animation data
 *   - FBXLoader preserves Mixamo's original bone hierarchy exactly
 *   - SkeletonUtils.retargetClip properly maps between two different skeletons
 *     using bone name matching, handling T-pose offset differences correctly
 *
 * Pipeline:
 *   1. Load VRM → extract its skeleton as the TARGET
 *   2. Load idle.fbx + walk.fbx → extract skeleton as SOURCE + animation clips
 *   3. SkeletonUtils.retargetClip(targetSkeleton, sourceSkeleton, clip, options)
 *   4. AnimationMixer on vrm.scene plays retargeted clips
 */
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import { AccessorySystem } from '../../../avatar/AccessorySystem'
import { useAvatarStore } from '../../../../stores/avatarStore'
import { PLAYER_VRMS } from '../../../../lib/modelUrls'
import { supabase } from '../../../../lib/supabase'
import { AccessoryId } from '../../../../types/accessories'

const BASE_ANIM = 'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/animations'
const IDLE_URL  = `${BASE_ANIM}/idle.fbx`
const WALK_URL  = `${BASE_ANIM}/walk.fbx`

/**
 * Extract the first SkinnedMesh skeleton from a loaded FBX/GLTF scene.
 */
function extractSkeleton(obj: THREE.Object3D): THREE.Skeleton | null {
  let skeleton: THREE.Skeleton | null = null
  obj.traverse((child) => {
    if (!skeleton && (child as THREE.SkinnedMesh).isSkinnedMesh) {
      skeleton = (child as THREE.SkinnedMesh).skeleton
    }
  })
  return skeleton
}

/**
 * Load a Mixamo FBX animation file and retarget its clip onto the VRM skeleton.
 * Uses SkeletonUtils.retargetClip which handles bone-name matching + T-pose offsets.
 */
async function loadFBXAnimation(
  url: string,
  vrmSkeleton: THREE.Skeleton,
  label: string,
): Promise<THREE.AnimationClip | null> {
  const fbx = await new Promise<THREE.Group>((res, rej) =>
    new FBXLoader().load(url, res, undefined, rej)
  ).catch(e => { console.error(`[VRMCharacter] ${label} FBX load error:`, e); return null })

  if (!fbx) return null

  // FBX is huge (centimeters) — scale down so skeleton proportions match VRM (meters)
  fbx.scale.setScalar(0.01)
  fbx.updateMatrixWorld(true)

  const clip = fbx.animations?.[0]
  if (!clip) {
    console.error(`[VRMCharacter] ${label}: no animation clip in FBX`)
    return null
  }

  const srcSkeleton = extractSkeleton(fbx)
  if (!srcSkeleton) {
    console.error(`[VRMCharacter] ${label}: no skeleton found in FBX`)
    return null
  }

  console.info(`[VRMCharacter] ${label}: FBX bones:`, srcSkeleton.bones.map(b => b.name))
  console.info(`[VRMCharacter] ${label}: VRM bones:`, vrmSkeleton.bones.map(b => b.name))

  // retargetClip maps source → target by bone name
  // hipPosition = false: don't copy root translation (avoids sliding)
  const retargeted = SkeletonUtils.retargetClip(
    vrmSkeleton,
    srcSkeleton,
    clip,
    { hipPosition: false }
  ) as THREE.AnimationClip

  console.info(`[VRMCharacter] ${label}: retargeted ${retargeted.tracks.length} tracks`)
  return retargeted
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

      // ── 3. Extract VRM skeleton (target for retargeting)
      const vrmSkeleton = extractSkeleton(vrm.scene)
      if (!vrmSkeleton) {
        console.error('[VRMCharacter] could not find skeleton in VRM scene')
        return
      }

      // ── 4. Load FBX animations + retarget
      const [idleClip, walkClip] = await Promise.all([
        loadFBXAnimation(IDLE_URL, vrmSkeleton, 'idle'),
        loadFBXAnimation(WALK_URL, vrmSkeleton, 'walk'),
      ])
      if (cancelled) return

      // ── 5. AnimationMixer
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
