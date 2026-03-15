/**
 * Atmosphere — Sky: Children of the Light
 *
 * Sky's atmosphere signature:
 *  - Warm gradient sky dome (amber → peach → dusty rose at horizon)
 *  - Fireflies: warm golden, not cold white
 *  - Blossom petals: peach/pink (matching blossom maple trees)
 *  - Light shafts: subtle god-ray cylinder near sun position
 *  - Stars (distant): tiny warm points visible near horizon
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Sky dome — gradient from zenith to horizon via vertex colors
export function Atmosphere() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(580, 32, 20)
    const pos = g.attributes.position as THREE.BufferAttribute
    const count = pos.count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i)
      const t = THREE.MathUtils.clamp((y + 580) / (580 * 1.6), 0, 1)
      // horizon: warm peachy #ffcca0 → zenith: soft periwinkle #8ab4d8
      colors[i * 3]     = 1.0 - t * 0.46
      colors[i * 3 + 1] = 0.80 - t * 0.1
      colors[i * 3 + 2] = 0.63 + t * 0.22
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} />
    </mesh>
  )
}

// Fireflies — warm golden, drift slowly
export function Fireflies() {
  const count = 60
  const { positions, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const offsets   = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 8 + Math.random() * 35
      positions[i * 3]     = Math.cos(a) * r
      positions[i * 3 + 1] = 0.8 + Math.random() * 4.5
      positions[i * 3 + 2] = Math.sin(a) * r + 10
      offsets[i]           = Math.random() * Math.PI * 2
    }
    return { positions, offsets }
  }, [])

  const ref   = useRef<THREE.BufferAttribute>(null!)
  const orig  = useMemo(() => new Float32Array(positions), [positions])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t   = clock.elapsedTime
    const arr = ref.current.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = orig[i * 3]     + Math.sin(t * 0.6 + offsets[i]) * 1.2
      arr[i * 3 + 1] = orig[i * 3 + 1] + Math.sin(t * 0.9 + offsets[i] + 1) * 0.6
      arr[i * 3 + 2] = orig[i * 3 + 2] + Math.cos(t * 0.5 + offsets[i]) * 1.2
    }
    ref.current.needsUpdate = true
  })

  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute ref={ref} attach="attributes-position"
          array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      {/* Warm golden fireflies */}
      <PointMaterial size={0.22} color="#ffcc66" transparent opacity={0.9}
        sizeAttenuation depthWrite={false} />
    </Points>
  )
}

// Blossom petals — peach/pink, drift and spiral
export function BlossomPetals() {
  const count = 40
  const { positions, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const offsets   = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 5 + Math.random() * 30
      positions[i * 3]     = Math.cos(a) * r
      positions[i * 3 + 1] = 1 + Math.random() * 7
      positions[i * 3 + 2] = Math.sin(a) * r + 10
      offsets[i * 2]       = Math.random() * Math.PI * 2
      offsets[i * 2 + 1]   = 0.3 + Math.random() * 0.7
    }
    return { positions, offsets }
  }, [])

  const ref  = useRef<THREE.BufferAttribute>(null!)
  const orig = useMemo(() => new Float32Array(positions), [positions])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t   = clock.elapsedTime
    const arr = ref.current.array as Float32Array
    for (let i = 0; i < count; i++) {
      const speed = offsets[i * 2 + 1]
      arr[i * 3]     = orig[i * 3]     + Math.sin(t * speed * 0.4 + offsets[i * 2]) * 2.5
      arr[i * 3 + 1] = orig[i * 3 + 1] - (t * speed * 0.35) % 8
      arr[i * 3 + 2] = orig[i * 3 + 2] + Math.cos(t * speed * 0.35 + offsets[i * 2]) * 2.5
    }
    ref.current.needsUpdate = true
  })

  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute ref={ref} attach="attributes-position"
          array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      {/* Peach blossom petals */}
      <PointMaterial size={0.18} color="#ffaa88" transparent opacity={0.75}
        sizeAttenuation depthWrite={false} />
    </Points>
  )
}
