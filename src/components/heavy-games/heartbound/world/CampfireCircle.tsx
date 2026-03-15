/**
 * CampfireCircle — Phase 2 | Meadow Core
 *
 * Placed at (25, 0, 20) — east of Bond Tree, in the meadow clearing.
 *
 * Features:
 *  - Stone fire ring (8 icosahedron stones in a circle)
 *  - 3 log seats around the fire (lathe cylinders, slightly tilted)
 *  - Animated flame: layered cones that scale+shift each frame
 *  - Ember particles: warm orange points drifting upward
 *  - Flickering point light (fire color, fast random flicker)
 *  - Ash bed: flat dark circle beneath the fire
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const CX = 25
const CZ = 20

export function CampfireCircle() {
  const baseY = terrainHeight(CX, CZ)

  const flameRef1 = useRef<THREE.Mesh>(null!)
  const flameRef2 = useRef<THREE.Mesh>(null!)
  const flameRef3 = useRef<THREE.Mesh>(null!)
  const lightRef  = useRef<THREE.PointLight>(null!)
  const emberRef  = useRef<THREE.BufferAttribute>(null!)

  const EMBER_COUNT = 24
  const emberBase = useMemo(() => {
    const arr = new Float32Array(EMBER_COUNT * 3)
    for (let i = 0; i < EMBER_COUNT; i++) {
      arr[i * 3]     = CX + (Math.random() - 0.5) * 0.8
      arr[i * 3 + 1] = baseY + 0.4
      arr[i * 3 + 2] = CZ + (Math.random() - 0.5) * 0.8
    }
    return arr
  }, [baseY])

  const emberOffsets = useMemo(() =>
    Array.from({ length: EMBER_COUNT }, () => Math.random() * Math.PI * 2), []
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Flame layers: scale and sway
    if (flameRef1.current) {
      flameRef1.current.scale.set(
        0.9 + 0.15 * Math.sin(t * 9.0),
        1.0 + 0.2  * Math.sin(t * 7.0 + 0.5),
        0.9 + 0.15 * Math.sin(t * 8.0 + 1.0),
      )
      flameRef1.current.position.x = CX + 0.08 * Math.sin(t * 6.0)
      flameRef1.current.position.z = CZ + 0.08 * Math.cos(t * 5.5)
    }
    if (flameRef2.current) {
      flameRef2.current.scale.set(
        0.85 + 0.18 * Math.sin(t * 11.0 + 1.0),
        1.0  + 0.25 * Math.sin(t * 9.0  + 0.8),
        0.85 + 0.18 * Math.sin(t * 10.0 + 0.3),
      )
      flameRef2.current.position.x = CX + 0.06 * Math.cos(t * 7.0)
      flameRef2.current.position.z = CZ + 0.06 * Math.sin(t * 8.0)
    }
    if (flameRef3.current) {
      flameRef3.current.scale.set(
        0.7 + 0.2 * Math.sin(t * 13.0 + 2.0),
        1.0 + 0.3 * Math.sin(t * 11.0 + 1.5),
        0.7 + 0.2 * Math.sin(t * 12.0 + 0.5),
      )
    }

    // Flickering fire light
    if (lightRef.current) {
      lightRef.current.intensity = 5.0 + 3.0 * Math.abs(Math.sin(t * 8.0 + Math.sin(t * 13.0)))
      lightRef.current.color.setHSL(0.06 + 0.02 * Math.sin(t * 5), 1, 0.55)
    }

    // Ember drift upward and reset
    if (emberRef.current) {
      const arr = emberRef.current.array as Float32Array
      for (let i = 0; i < EMBER_COUNT; i++) {
        const age = ((t * 0.9 + emberOffsets[i]) % 2.5)
        arr[i * 3]     = emberBase[i * 3]     + 0.3 * Math.sin(t * 2.0 + emberOffsets[i])
        arr[i * 3 + 1] = baseY + 0.4 + age * 1.8
        arr[i * 3 + 2] = emberBase[i * 3 + 2] + 0.3 * Math.cos(t * 1.8 + emberOffsets[i])
      }
      emberRef.current.needsUpdate = true
    }
  })

  // Stone ring positions
  const stoneAngles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []
  )

  // Log seat positions (3 seats, 120° apart)
  const logAngles = useMemo(() =>
    [0, 120, 240].map(d => THREE.MathUtils.degToRad(d)), []
  )

  const emberPositions = useMemo(() => new Float32Array(emberBase), [emberBase])

  return (
    <group>
      {/* ─ Ash bed ─────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, baseY + 0.02, CZ]}>
        <circleGeometry args={[1.1, 20]} />
        <meshToonMaterial color="#2a2018" />
      </mesh>

      {/* ─ Stone ring ───────────────────────────────────────── */}
      {stoneAngles.map((a, i) => (
        <mesh
          key={i}
          position={[
            CX + Math.cos(a) * 1.2,
            baseY + 0.18,
            CZ + Math.sin(a) * 1.2,
          ]}
          scale={[0.22 + (i % 3) * 0.05, 0.18 + (i % 2) * 0.06, 0.20 + (i % 3) * 0.04]}
          rotation={[0.2 * (i % 2), a, 0.15 * (i % 3)]}
          castShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshToonMaterial color="#7a7060" emissive="#3a3020" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* ─ Log seats ────────────────────────────────────────── */}
      {logAngles.map((a, i) => (
        <mesh
          key={i}
          position={[
            CX + Math.cos(a) * 2.6,
            baseY + 0.28,
            CZ + Math.sin(a) * 2.6,
          ]}
          rotation={[0, a + Math.PI / 2, Math.PI / 2]}
          castShadow receiveShadow
        >
          <cylinderGeometry args={[0.22, 0.25, 1.4, 8]} />
          <meshToonMaterial color="#6a4020" emissive="#2a1808" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* ─ Flame layer 1 — base orange ────────────────────────── */}
      <mesh ref={flameRef1} position={[CX, baseY + 0.55, CZ]}>
        <coneGeometry args={[0.42, 1.1, 7]} />
        <meshToonMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.2}
          transparent opacity={0.92} />
      </mesh>

      {/* ─ Flame layer 2 — mid yellow-orange ───────────────────── */}
      <mesh ref={flameRef2} position={[CX, baseY + 0.75, CZ]}>
        <coneGeometry args={[0.28, 0.85, 6]} />
        <meshToonMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={1.4}
          transparent opacity={0.88} />
      </mesh>

      {/* ─ Flame layer 3 — tip bright yellow ───────────────────── */}
      <mesh ref={flameRef3} position={[CX, baseY + 1.1, CZ]}>
        <coneGeometry args={[0.16, 0.6, 5]} />
        <meshToonMaterial color="#ffee44" emissive="#ffcc00" emissiveIntensity={1.6}
          transparent opacity={0.82} />
      </mesh>

      {/* ─ Fire light ────────────────────────────────────────── */}
      <pointLight ref={lightRef} color="#ff8833" intensity={6} distance={22}
        decay={2} position={[CX, baseY + 1.2, CZ]} castShadow />

      {/* ─ Embers ───────────────────────────────────────────── */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={emberRef}
            attach="attributes-position"
            array={emberPositions}
            count={EMBER_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.1} color="#ffaa44" transparent opacity={0.85}
          sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}
