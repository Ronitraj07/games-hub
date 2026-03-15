/**
 * Pond — scaled up to match new 400×400 world
 * Radius: 14 units (was 4 — proportional to world)
 * Animated water color + ripple ring
 * Lily pads + floating flowers
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

export const POND_CENTER = new THREE.Vector3(0, 0, 10)
export const POND_RADIUS = 14

export function Pond() {
  const waterRef  = useRef<THREE.Mesh>(null!)
  const rippleRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (!waterRef.current) return
    const t   = clock.elapsedTime
    const mat = waterRef.current.material as THREE.MeshStandardMaterial
    mat.color.setRGB(
      0.22 + 0.04 * Math.sin(t * 0.35),
      0.52 + 0.07 * Math.sin(t * 0.28 + 1.1),
      0.82 + 0.05 * Math.sin(t * 0.45 + 2.3),
    )
    mat.opacity = 0.80 + 0.06 * Math.sin(t * 0.55)
    mat.envMapIntensity = 2.5 + 0.5 * Math.sin(t * 0.4)
    if (rippleRef.current) {
      const p = 1.0 + 0.025 * Math.sin(t * 1.1)
      rippleRef.current.scale.set(p, p, p)
    }
  })

  const lilyPads = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    angle: (i / 10) * Math.PI * 2 + i * 0.4,
    r:     4 + (i % 3) * 2.5,
    size:  0.8 + (i % 3) * 0.3,
    hasFl: i % 3 === 0,
  })), [])

  const cx = POND_CENTER.x
  const cz = POND_CENTER.z

  return (
    <group position={[cx, 0.05, cz]}>
      {/* Bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <circleGeometry args={[POND_RADIUS + 1.5, 56]} />
        <meshStandardMaterial color="#0a1e2e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Shore ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[POND_RADIUS, POND_RADIUS + 2.5, 56]} />
        <meshStandardMaterial color="#5a8870" roughness={0.95} metalness={0} transparent opacity={0.6} />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[POND_RADIUS, 56]} />
        <meshStandardMaterial color="#4ab8e8" roughness={0.04} metalness={0.2} transparent opacity={0.85} envMapIntensity={2.5} />
      </mesh>
      {/* Ripple */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <ringGeometry args={[POND_RADIUS * 0.4, POND_RADIUS * 0.5, 36]} />
        <meshBasicMaterial color="#a0d8f0" transparent opacity={0.15} />
      </mesh>
      {/* Lily pads */}
      {lilyPads.map((lp, i) => {
        const lx = Math.cos(lp.angle) * lp.r
        const lz = Math.sin(lp.angle) * lp.r
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, lp.angle, 0]} position={[lx, 0.09, lz]}>
              <circleGeometry args={[lp.size, 14]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#1a5c38' : '#2d6a4f'} roughness={0.75} metalness={0} />
            </mesh>
            {lp.hasFl && (
              <Billboard position={[lx, 0.35, lz]}>
                <Text fontSize={0.5} anchorX="center" anchorY="middle">🌸</Text>
              </Billboard>
            )}
          </group>
        )
      })}
    </group>
  )
}
