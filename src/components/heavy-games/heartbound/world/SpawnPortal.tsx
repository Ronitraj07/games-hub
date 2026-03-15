/**
 * SpawnPortal — glowing ground portal at world spawn
 *
 * Position: (0, y, 40) — directly in front of camera on load,
 * clear of pond (pond center 0,0,10 radius 14 → portal at z=40 is safe).
 *
 * Layers:
 *  1. Dark stone base disc
 *  2. Runic engraved ring
 *  3. Outer gold ring (CW rotation)
 *  4. Inner cyan ring (CCW rotation)
 *  5. Energy swirl disc (pulse color)
 *  6. Outer glow halo (pulse scale)
 *  7. 120 rising purple particles
 *  8. 12 Nordic rune billboards
 *  9. ✦ Spawn label
 * 10. pointLight for local glow
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text, Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

export const SPAWN_POS = new THREE.Vector3(0, 0, 40)

const RUNES = ['᛭','ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ']

export function SpawnPortal({ position = SPAWN_POS }: { position?: THREE.Vector3 }) {
  const groundY = terrainHeight(position.x, position.z)
  const base    = [position.x, groundY, position.z] as [number, number, number]

  const outerRingRef = useRef<THREE.Mesh>(null!)
  const innerRingRef = useRef<THREE.Mesh>(null!)
  const energyRef    = useRef<THREE.Mesh>(null!)
  const haloRef      = useRef<THREE.Mesh>(null!)
  const particlesRef = useRef<THREE.BufferAttribute>(null!)

  const { positions } = useMemo(() => {
    const count     = 120
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r     = Math.random() * 2.8
      positions[i * 3]     = Math.cos(angle) * r
      positions[i * 3 + 1] = Math.random() * 5
      positions[i * 3 + 2] = Math.sin(angle) * r
    }
    return { positions }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (outerRingRef.current) outerRingRef.current.rotation.z =  t * 0.6
    if (innerRingRef.current) innerRingRef.current.rotation.z = -t * 1.0
    if (energyRef.current) {
      const mat   = energyRef.current.material as THREE.MeshBasicMaterial
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2)
      mat.color.setRGB(0.3 + 0.4 * pulse, 0.8 + 0.2 * Math.sin(t * 1.5), 1.0)
      mat.opacity = 0.35 + 0.25 * pulse
    }
    if (haloRef.current) {
      const s = 1.0 + 0.12 * Math.sin(t * 2.8)
      haloRef.current.scale.set(s, s, s)
      ;(haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.12 * Math.sin(t * 2.8)
    }
    if (particlesRef.current) {
      const arr = particlesRef.current.array as Float32Array
      for (let i = 0; i < 120; i++) {
        arr[i * 3 + 1] += 0.025
        if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = 0
      }
      particlesRef.current.needsUpdate = true
    }
  })

  return (
    <group position={base}>
      {/* Stone base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3.8, 48]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.2} />
      </mesh>
      {/* Runic engraving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[2.8, 3.6, 48]} />
        <meshStandardMaterial color="#2a1f4e" roughness={0.8} metalness={0.4}
          emissive="#6c3fc7" emissiveIntensity={0.4} />
      </mesh>
      {/* Outer gold ring (CW) */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[2.9, 3.1, 64]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.85} />
      </mesh>
      {/* Inner cyan ring (CCW) */}
      <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[1.8, 2.0, 48]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.75} />
      </mesh>
      {/* Energy disc */}
      <mesh ref={energyRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <circleGeometry args={[2.6, 48]} />
        <meshBasicMaterial color="#6ee7f7" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow halo */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[5.5, 48]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Rising particles */}
      <Points>
        <bufferGeometry>
          <bufferAttribute ref={particlesRef} attach="attributes-position"
            array={positions} count={120} itemSize={3} />
        </bufferGeometry>
        <PointMaterial size={0.09} color="#a78bfa" transparent opacity={0.85}
          sizeAttenuation depthWrite={false} />
      </Points>
      {/* Rune glyphs */}
      {RUNES.map((r, i) => {
        const angle = (i / RUNES.length) * Math.PI * 2
        return (
          <Billboard key={i} position={[Math.cos(angle) * 3.2, 0.6, Math.sin(angle) * 3.2]}>
            <Text fontSize={0.32} color="#ffd700" anchorX="center" anchorY="middle"
              outlineWidth={0.02} outlineColor="#7c3aed">{r}</Text>
          </Billboard>
        )
      })}
      {/* Label */}
      <Billboard position={[0, 3.2, 0]}>
        <Text fontSize={0.45} color="#e9d5ff" anchorX="center" anchorY="middle"
          outlineWidth={0.04} outlineColor="#6d28d9">✦ Spawn</Text>
      </Billboard>
      {/* Glow light */}
      <pointLight color="#8b5cf6" intensity={6} distance={18} decay={2} position={[0, 1, 0]} />
    </group>
  )
}
