/**
 * FlowerFields — Phase 2 | SE District (x > 80, z > 80)
 *
 * Features:
 *  - 40 collectible flowers: stem + petals (icosahedron blob), warm Sky palette
 *    Each has a subtle upward bob animation and soft emissive glow
 *  - Tall grass maze: instanced blade clusters forming winding paths
 *    Blades are thin scaled boxes, wind-swayed each frame
 *  - 3 beehives: rounded dome + entry hole, placed near flower clusters
 *  - Butterfly particles: small warm-yellow points drifting near flowers
 */
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

// ── Seeded RNG ───────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// ── Flower palette ──────────────────────────────────────────────
const FLOWER_COLORS = [
  { petal: '#ff9fb0', emiss: '#cc5566', stem: '#4a8840' }, // pink
  { petal: '#ffe066', emiss: '#cc9900', stem: '#5a8840' }, // yellow
  { petal: '#cc88ff', emiss: '#884acc', stem: '#4a7a38' }, // purple
  { petal: '#ff8844', emiss: '#cc4400', stem: '#4a8840' }, // orange
  { petal: '#88ddff', emiss: '#3388cc', stem: '#5a9048' }, // sky-blue
  { petal: '#ffffff', emiss: '#aaaacc', stem: '#4a8840' }, // white
]

interface FlowerData {
  x: number; z: number; y: number
  colorIdx: number; scale: number
  phase: number  // animation phase offset
}

function generateFlowers(count: number): FlowerData[] {
  const rng    = seededRng(99)
  const result: FlowerData[] = []
  let attempts = 0
  while (result.length < count && attempts < 3000) {
    attempts++
    // SE district: x 90–440, z 90–440
    const x = 90 + rng() * 350
    const z = 90 + rng() * 350
    if (Math.abs(x) > 480 || Math.abs(z) > 480) continue
    const y = terrainHeight(x, z)
    result.push({
      x, z, y,
      colorIdx: Math.floor(rng() * FLOWER_COLORS.length),
      scale:    0.6 + rng() * 0.6,
      phase:    rng() * Math.PI * 2,
    })
  }
  return result
}

// ── Tall grass ────────────────────────────────────────────────
interface GrassCluster { x: number; z: number; y: number; rotY: number }

function generateGrassMaze(): GrassCluster[] {
  const rng     = seededRng(55)
  const clusters: GrassCluster[] = []
  let attempts = 0
  // 200 grass clusters forming rough maze walls in SE district
  while (clusters.length < 200 && attempts < 4000) {
    attempts++
    const x = 100 + rng() * 330
    const z = 100 + rng() * 330
    if (Math.abs(x) > 478 || Math.abs(z) > 478) continue
    const y = terrainHeight(x, z)
    clusters.push({ x, z, y, rotY: rng() * Math.PI * 2 })
  }
  return clusters
}

// Single animated flower
function Flower({ f, t }: { f: FlowerData; t: number }) {
  const col = FLOWER_COLORS[f.colorIdx]
  const sc  = f.scale
  const bob = Math.sin(t * 1.2 + f.phase) * 0.08
  return (
    <group position={[f.x, f.y + bob, f.z]}>
      {/* Stem */}
      <mesh position={[0, 0.35 * sc, 0]}>
        <cylinderGeometry args={[0.04 * sc, 0.06 * sc, 0.7 * sc, 5]} />
        <meshToonMaterial color={col.stem} />
      </mesh>
      {/* Petal blob */}
      <mesh position={[0, 0.75 * sc, 0]} castShadow>
        <icosahedronGeometry args={[0.28 * sc, 1]} />
        <meshToonMaterial color={col.petal} emissive={col.emiss}
          emissiveIntensity={0.45} />
      </mesh>
      {/* Centre dot */}
      <mesh position={[0, 0.78 * sc, 0]}>
        <sphereGeometry args={[0.1 * sc, 6, 6]} />
        <meshToonMaterial color="#ffee88" emissive="#ffcc00" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

// Animated grass cluster: 5 blades per cluster
function GrassClusterMesh({ g, t }: { g: GrassCluster; t: number }) {
  const blades = useMemo(() => [
    { ox: 0,    oz: 0,    h: 1.1, rot: 0.1  },
    { ox: 0.2,  oz: 0.1,  h: 0.9, rot: -0.15 },
    { ox: -0.2, oz: 0.15, h: 1.0, rot: 0.2  },
    { ox: 0.1,  oz: -0.2, h: 1.2, rot: -0.1 },
    { ox: -0.1, oz: -0.1, h: 0.8, rot: 0.05 },
  ], [])

  const wind = Math.sin(t * 1.8 + g.x * 0.05 + g.z * 0.04) * 0.12

  return (
    <group position={[g.x, g.y, g.z]} rotation={[0, g.rotY, 0]}>
      {blades.map((b, i) => (
        <mesh
          key={i}
          position={[b.ox, b.h * 0.5, b.oz]}
          rotation={[b.rot + wind, 0, b.rot * 0.5 + wind * 0.5]}
        >
          <boxGeometry args={[0.06, b.h, 0.04]} />
          <meshToonMaterial color={i % 2 === 0 ? '#4a8a38' : '#5a9a44'}
            emissive="#2a5020" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  )
}

// Beehive
function Beehive({ x, z }: { x: number; z: number }) {
  const y = terrainHeight(x, z)
  return (
    <group position={[x, y + 0.5, z]}>
      {/* Hive dome */}
      <mesh castShadow>
        <sphereGeometry args={[0.55, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <meshToonMaterial color="#d4a030" emissive="#8a5010" emissiveIntensity={0.2} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.58, 10]} />
        <meshToonMaterial color="#b88020" />
      </mesh>
      {/* Entry hole */}
      <mesh position={[0, -0.1, 0.5]}>
        <circleGeometry args={[0.1, 8]} />
        <meshToonMaterial color="#1a0800" />
      </mesh>
    </group>
  )
}

// ── Main export ────────────────────────────────────────────────
export function FlowerFields() {
  const flowers  = useMemo(() => generateFlowers(40), [])
  const maze     = useMemo(() => generateGrassMaze(), [])
  const timeRef  = useRef(0)
  const flowerGroupRef = useRef<THREE.Group>(null!)
  const grassGroupRef  = useRef<THREE.Group>(null!)

  // Butterfly particles
  const BUTTERFLY_COUNT = 20
  const bfRef    = useRef<THREE.BufferAttribute>(null!)
  const bfBase   = useMemo(() => {
    const arr = new Float32Array(BUTTERFLY_COUNT * 3)
    for (let i = 0; i < BUTTERFLY_COUNT; i++) {
      arr[i * 3]     = 100 + Math.random() * 300
      arr[i * 3 + 1] = terrainHeight(arr[i * 3], arr[i * 3 + 2]) + 0.5 + Math.random() * 1.5
      arr[i * 3 + 2] = 100 + Math.random() * 300
    }
    return arr
  }, [])
  const bfOffsets = useMemo(() =>
    Array.from({ length: BUTTERFLY_COUNT }, () => Math.random() * Math.PI * 2), []
  )
  const bfPositions = useMemo(() => new Float32Array(bfBase), [bfBase])

  useFrame(({ clock }) => {
    timeRef.current = clock.elapsedTime
    if (bfRef.current) {
      const t   = clock.elapsedTime
      const arr = bfRef.current.array as Float32Array
      for (let i = 0; i < BUTTERFLY_COUNT; i++) {
        arr[i * 3]     = bfBase[i * 3]     + Math.sin(t * 0.7 + bfOffsets[i]) * 4
        arr[i * 3 + 1] = bfBase[i * 3 + 1] + Math.sin(t * 1.1 + bfOffsets[i]) * 0.5
        arr[i * 3 + 2] = bfBase[i * 3 + 2] + Math.cos(t * 0.6 + bfOffsets[i]) * 4
      }
      bfRef.current.needsUpdate = true
    }
  })

  const t = timeRef.current

  return (
    <>
      {/* Flowers */}
      <group ref={flowerGroupRef}>
        {flowers.map((f, i) => <Flower key={i} f={f} t={t} />)}
      </group>

      {/* Tall grass maze */}
      <group ref={grassGroupRef}>
        {maze.map((g, i) => <GrassClusterMesh key={i} g={g} t={t} />)}
      </group>

      {/* Beehives */}
      <Beehive x={180} z={160} />
      <Beehive x={280} z={220} />
      <Beehive x={150} z={310} />

      {/* Butterflies */}
      <points>
        <bufferGeometry>
          <bufferAttribute ref={bfRef} attach="attributes-position"
            array={bfPositions} count={BUTTERFLY_COUNT} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.16} color="#ffdd88" transparent opacity={0.85}
          sizeAttenuation depthWrite={false} />
      </points>
    </>
  )
}
