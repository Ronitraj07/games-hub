/**
 * Atmosphere — sky, fog, fireflies, particles
 *
 * Key changes from old MeadowHaven3D:
 *  - fogExp2 instead of linear fog → gradual atmospheric haze
 *    (things 150u away are nearly invisible → world feels vast)
 *  - Firefly count up to 80 (was 32), spread over larger area
 *  - Cherry blossom petals (pink Points, slow drift)
 *  - Cloud billboards (3 layers of clouds at different heights)
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Stars, Cloud, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

export function Atmosphere() {
  return (
    <>
      {/* Exponential fog — the single biggest scale improvement */}
      <fogExp2 attach="fog" args={['#a8d4b8', 0.006]} />

      <Sky
        sunPosition={[80, 25, -60]}
        turbidity={3.5}
        rayleigh={1.2}
        mieCoefficient={0.005}
        mieDirectionalG={0.88}
        inclination={0.50}
        azimuth={0.20}
      />

      <Stars radius={200} depth={60} count={2000} factor={4} fade speed={0.25} />

      {/* Clouds at different heights and distances */}
      <Cloud position={[-80, 55, -100]}  speed={0.12} opacity={0.55} />
      <Cloud position={[120, 62, -140]}  speed={0.09} opacity={0.45} />
      <Cloud position={[30,  70, -180]}  speed={0.11} opacity={0.50} />
      <Cloud position={[-150, 58, 80]}   speed={0.08} opacity={0.40} />
      <Cloud position={[160,  65, 60]}   speed={0.10} opacity={0.48} />
    </>
  )
}

export function Fireflies() {
  const COUNT = 80
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 8 + Math.random() * 40
      arr[i * 3]     = Math.cos(a) * r
      arr[i * 3 + 1] = 0.5 + Math.random() * 4
      arr[i * 3 + 2] = Math.sin(a) * r + 10
    }
    return arr
  }, [])
  const orig    = useMemo(() => Float32Array.from(positions), [positions])
  const attrRef = useRef<THREE.BufferAttribute>(null!)

  useFrame(({ clock }) => {
    if (!attrRef.current) return
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      attrRef.current.setXYZ(i,
        orig[i * 3]     + Math.sin(t * 0.5 + i * 1.3) * 0.8,
        orig[i * 3 + 1] + Math.sin(t * 0.8 + i * 0.7) * 0.5,
        orig[i * 3 + 2] + Math.cos(t * 0.45 + i * 1.1) * 0.8,
      )
    }
    attrRef.current.needsUpdate = true
  })

  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute ref={attrRef} attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <PointMaterial size={0.18} color="#fff59d" transparent opacity={0.95} sizeAttenuation depthWrite={false} />
    </Points>
  )
}

export function BlossomPetals() {
  const COUNT = 300
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 160
      arr[i * 3 + 1] = Math.random() * 18 + 1
      arr[i * 3 + 2] = (Math.random() - 0.5) * 160
    }
    return arr
  }, [])
  const attrRef = useRef<THREE.BufferAttribute>(null!)

  useFrame(({ clock }) => {
    if (!attrRef.current) return
    const t = clock.elapsedTime * 0.18
    for (let i = 0; i < COUNT; i++) {
      let y = positions[i * 3 + 1] - 0.012
      if (y < 0) y = 16 + Math.random() * 4
      attrRef.current.setXYZ(i,
        positions[i * 3]     + Math.sin(t + i * 0.8) * 0.04,
        y,
        positions[i * 3 + 2] + Math.cos(t + i * 0.6) * 0.04,
      )
      positions[i * 3 + 1] = y
    }
    attrRef.current.needsUpdate = true
  })

  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute ref={attrRef} attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <PointMaterial size={0.22} color="#ffb3c6" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </Points>
  )
}
