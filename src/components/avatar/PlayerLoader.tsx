import { useEffect, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'
import { supabase } from '../../lib/supabase'

// Hardcoded fallback URLs (from Supabase Storage)
const VRM_URLS: Record<string, string> = {
  'sinharonitraj@gmail.com':
    'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/characters/sparkles.vrm',
  'radhikadidwania567@gmail.com':
    'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/characters/shizzy.vrm',
  'shizzandsparkles@gmail.com':
    'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models/characters/sparkles.vrm',
}

interface Props {
  email: string
  uid: string
  position?: [number, number, number]
  onLoaded?: () => void
}

export const PlayerLoader = ({ email, uid, position = [0, 0, 0], onLoaded }: Props) => {
  const { scene } = useThree()
  const vrmRef = useRef<any>(null)
  const clockRef = useRef(new THREE.Clock())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadVRM = async () => {
      try {
        // 1. Try to get VRM URL from Supabase profiles first
        let vrmUrl = VRM_URLS[email] // fallback
        const { data } = await supabase
          .from('profiles')
          .select('vrm_url')
          .eq('email', email)
          .single()
        if (data?.vrm_url) vrmUrl = data.vrm_url

        if (!vrmUrl) {
          setError('No VRM found for this player')
          return
        }

        // 2. Load the VRM
        const loader = new GLTFLoader()
        loader.register((parser) => new VRMLoaderPlugin(parser))

        loader.load(
          vrmUrl,
          (gltf) => {
            if (cancelled) return
            const vrm = gltf.userData.vrm
            if (!vrm) {
              setError('Invalid VRM file')
              return
            }

            // Optimise
            VRMUtils.removeUnnecessaryVertices(gltf.scene)
            VRMUtils.combineSkeletons(gltf.scene)

            // Rotate to face forward (VRM default faces away from camera)
            VRMUtils.rotateVRM0(vrm)

            // Set position
            vrm.scene.position.set(...position)

            scene.add(vrm.scene)
            vrmRef.current = vrm
            onLoaded?.()
          },
          undefined,
          (err: unknown) => {
            if (!cancelled) {
              const msg = err instanceof Error ? err.message
                : (err as { message?: string })?.message ?? String(err)
              setError(`Failed to load VRM: ${msg}`)
            }
          }
        )
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err)
          setError(msg)
        }
      }
    }

    loadVRM()
    return () => {
      cancelled = true
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene)
        vrmRef.current = null
      }
    }
  }, [email, uid])

  // VRM update loop — spring bones + look at
  useFrame(() => {
    if (vrmRef.current) {
      const delta = clockRef.current.getDelta()
      vrmRef.current.update(delta)
    }
  })

  if (error) {
    console.error('[PlayerLoader]', error)
  }

  return null // renders directly into Three.js scene
}
