/**
 * Pond — Sky: Children of the Light aesthetic
 *
 * - Deep luminous teal water (Sky's iconic glowing water)
 * - meshToonMaterial for cel-shade consistency
 * - Inner light column effect via a tall transparent cylinder
 * - Lily pads: flat rounded, warm olive green
 * - Shore ring: warm sandy toon material
 * - Animated water color: cycles between deep teal and soft blue-green
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

export const POND_CENTER = new THREE.Vector3(0, 0, 10)
export const POND_RADIUS = 14

export function Pond() {
  const waterRef  = useRef<THREE.Mesh>(null!)
  const glowRef   = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshToonMaterial
      mat.color.setRGB(
        0.04 + 0.03 * Math.sin(t * 0.3),
        0.45 + 0.08 * Math.sin(t * 0.22 + 1.0),
        0.55 + 0.07 * Math.sin(t * 0.28 + 2.1),
      )
      mat.emissiveIntensity = 0.25 + 0.1 * Math.sin(t * 0.55)
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.06 + 0.04 * Math.sin(t * 0.7)
    }
  })

  const lilyPads = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2 + i * 0.4,
    r:     5 + (i % 3) * 2.5,
    size:  0.9 + (i % 3) * 0.35,
    hasFl: i % 3 === 0,
  })), [])

  const cx = POND_CENTER.x
  const cz = POND_CENTER.z

  return (
    <group position={[cx, 0.05, cz]}>
      {/* Bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]}>
        <circleGeometry args={[POND_RADIUS + 1.5, 48]} />
        <meshToonMaterial color="#0a1e2e" />
      </mesh>
      {/* Shore — warm sandy */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[POND_RADIUS, POND_RADIUS + 2.8, 48]} />
        <meshToonMaterial color="#c8a870" />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[POND_RADIUS, 48]} />
        <meshToonMaterial
          color="#0d7280"
          emissive="#065060"
          emissiveIntensity={0.25}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Glow column — Sky's glowing water effect */}
      <mesh ref={glowRef} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[POND_RADIUS * 0.6, POND_RADIUS * 0.8, 3.0, 32, 1, true]} />
        <meshBasicMaterial color="#40e0d0" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
      {/* Lily pads */}
      {lilyPads.map((lp, i) => {
        const lx = Math.cos(lp.angle) * lp.r
        const lz = Math.sin(lp.angle) * lp.r
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, lp.angle, 0]} position={[lx, 0.09, lz]}>
              <circleGeometry args={[lp.size, 12]} />
              <meshToonMaterial color={i % 2 === 0 ? '#2d6040' : '#3d7050'} />
            </mesh>
            {lp.hasFl && (
              <Billboard position={[lx, 0.45, lz]}>
                <Text fontSize={0.55} anchorX="center" anchorY="middle">🌸</Text>
              </Billboard>
            )}
          </group>
        )
      })}
      {/* Point light — glowing water source */}
      <pointLight color="#40c0b0" intensity={4} distance={28} decay={2} position={[0, 0.5, 0]} />
    </group>
  )
}
