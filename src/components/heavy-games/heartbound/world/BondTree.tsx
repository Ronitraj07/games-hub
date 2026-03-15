/**
 * BondTree — Phase 2 | Meadow Core landmark
 *
 * The emotional anchor of the world. A massive ancient tree at (0,0)
 * with Sky:CotL signature features:
 *  - Enormous lathe trunk with root flanges
 *  - 3 tiers of glowing icosahedron canopy clusters
 *  - Warm golden emissive inner glow (brighter than regular trees)
 *  - Hanging light strands: small glowing point orbs drifting down
 *  - Pulsing point light at base (heartbeat rhythm)
 *  - Floating light motes circling the canopy (spirit energy)
 *  - Name plate: "The Bond Tree" in Sky-style warm text
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const POS_X = 0
const POS_Z = -30   // slightly north of absolute center, away from pond

export function BondTree() {
  const baseY     = terrainHeight(POS_X, POS_Z)
  const lightRef  = useRef<THREE.PointLight>(null!)
  const motesRef  = useRef<THREE.BufferAttribute>(null!)
  const glowRef   = useRef<THREE.Mesh>(null!)

  // 12 floating motes circling the canopy
  const moteData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle:  (i / 12) * Math.PI * 2,
      radius: 3.5 + (i % 3) * 0.8,
      height: 14 + (i % 4) * 1.5,
      speed:  0.25 + (i % 3) * 0.08,
    }))
  }, [])

  const motePositions = useMemo(() => new Float32Array(moteData.length * 3), [moteData])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Heartbeat pulse on base light
    if (lightRef.current) {
      const beat = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.1))
      lightRef.current.intensity = 3.5 + beat * 2.5
    }

    // Glow sphere breathe
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.07 + 0.04 * Math.sin(t * 0.8)
    }

    // Orbit motes
    if (motesRef.current) {
      const arr = motesRef.current.array as Float32Array
      moteData.forEach((m, i) => {
        const a = m.angle + t * m.speed
        arr[i * 3]     = POS_X + Math.cos(a) * m.radius
        arr[i * 3 + 1] = baseY  + m.height + Math.sin(t * 0.6 + i) * 0.5
        arr[i * 3 + 2] = POS_Z  + Math.sin(a) * m.radius
      })
      motesRef.current.needsUpdate = true
    }
  })

  // Trunk lathe points — large, ancient, flared base
  const trunkPoints = useMemo(() => [
    new THREE.Vector2(2.2, 0),
    new THREE.Vector2(1.7, 1.5),
    new THREE.Vector2(1.2, 4.0),
    new THREE.Vector2(0.85, 7.0),
    new THREE.Vector2(0.65, 10.0),
    new THREE.Vector2(0.50, 13.0),
    new THREE.Vector2(0.38, 16.0),
  ], [])

  // Root flanges: 5 flat fins radiating outward
  const rootAngles = useMemo(() => [0, 72, 144, 216, 288].map(d => THREE.MathUtils.degToRad(d)), [])

  return (
    <group position={[POS_X, baseY, POS_Z]}>

      {/* ─ Trunk ─────────────────────────────────────────────── */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[trunkPoints, 12]} />
        <meshToonMaterial color="#5a3a18" emissive="#2a1808" emissiveIntensity={0.15} />
      </mesh>

      {/* Root flanges */}
      {rootAngles.map((angle, i) => (
        <mesh key={i} rotation={[0, angle, 0]} position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.35, 1.2, 3.2]} />
          <meshToonMaterial color="#4a2e10" emissive="#1e1008" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* ─ Canopy tier 1 — low, wide, darkest ───────────────────── */}
      {[
        [0, 0, 0], [2.8, 0.5, 0], [-2.5, 0.3, 1.5],
        [1.0, 0.8, 2.8], [-1.5, 0.6, -2.5], [2.2, -0.3, -2.0],
      ].map(([ox, oy, oz], i) => (
        <mesh key={i} position={[ox, 11 + oy, oz]} castShadow>
          <icosahedronGeometry args={[2.8 - i * 0.15, 1]} />
          <meshToonMaterial color="#2d5e3a" emissive="#1a3a20" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* ─ Canopy tier 2 — mid, glowing warm green ──────────────── */}
      {[
        [0, 0, 0], [2.2, 0.8, 0.5], [-2.0, 0.6, 1.2],
        [0.8, 1.0, -2.2], [-1.2, 0.4, -1.8],
      ].map(([ox, oy, oz], i) => (
        <mesh key={i} position={[ox, 15.5 + oy, oz]} castShadow>
          <icosahedronGeometry args={[2.2 - i * 0.12, 1]} />
          <meshToonMaterial color="#3a7a50" emissive="#206040" emissiveIntensity={0.55} />
        </mesh>
      ))}

      {/* ─ Canopy tier 3 — top, brightest golden-green glow ───────── */}
      {[
        [0, 0, 0], [1.5, 0.8, 0], [-1.2, 0.5, 1.0], [0.5, 1.2, -1.2],
      ].map(([ox, oy, oz], i) => (
        <mesh key={i} position={[ox, 19.5 + oy, oz]} castShadow>
          <icosahedronGeometry args={[1.6 - i * 0.1, 1]} />
          <meshToonMaterial color="#5aaa60" emissive="#38884a" emissiveIntensity={0.75} />
        </mesh>
      ))}

      {/* ─ Glow sphere — large soft aura around canopy ───────────── */}
      <mesh ref={glowRef} position={[0, 16, 0]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#80ff90" transparent opacity={0.07}
          side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* ─ Base heartbeat light ───────────────────────────────── */}
      <pointLight ref={lightRef} color="#88ffaa" intensity={4} distance={55} decay={1.8}
        position={[0, 2, 0]} />
      {/* Canopy top light */}
      <pointLight color="#aaffbb" intensity={2.5} distance={40} decay={2}
        position={[0, 20, 0]} />

      {/* ─ Floating motes ───────────────────────────────────── */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            ref={motesRef}
            attach="attributes-position"
            array={motePositions}
            count={moteData.length}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.28} color="#ccffcc" transparent opacity={0.9}
          sizeAttenuation depthWrite={false} />
      </points>

      {/* ─ Name plate ──────────────────────────────────────── */}
      <Billboard position={[0, 23.5, 0]}>
        <Text
          fontSize={1.1}
          color="#d4ffcc"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.06}
          outlineColor="#1a3a20"
        >
          The Bond Tree
        </Text>
      </Billboard>

    </group>
  )
}
