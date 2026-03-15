/**
 * Trees — 4 species, 3 LOD levels, 240 instances
 *
 * Species:
 *   0 — Oak:     wide canopy, dark green
 *   1 — Pine:    tall narrow, blue-green
 *   2 — Maple:   medium, warm green
 *   3 — Willow:  drooping, pale green
 *
 * LOD:
 *   < 60u  : full (trunk + 3 canopy layers)
 *   60–120u: simplified (trunk + 1 merged canopy)
 *   > 120u : billboard (single plane facing camera) — TODO Phase 7G
 *             for now: simplified mesh used at all distances
 *
 * Placement: scattered outside meadow core (r > 45u from origin)
 *            and inside island boundary (r < 190u)
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const TREE_COUNT = 240
const RNG_SEED   = 42

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

interface TreeInstance {
  x: number; z: number; y: number
  species: number  // 0–3
  scale: number
  rotY: number
}

function generateTrees(): TreeInstance[] {
  const rng = seededRng(RNG_SEED)
  const trees: TreeInstance[] = []
  let attempts = 0
  while (trees.length < TREE_COUNT && attempts < 5000) {
    attempts++
    const angle = rng() * Math.PI * 2
    const r = 50 + rng() * 145   // 50–195 from center
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    const dr = Math.sqrt(x * x + z * z)
    if (dr > 192) continue  // outside island
    // Avoid pond area
    if (dr < 22 && Math.abs(z) < 15) continue
    const y = terrainHeight(x, z)
    if (y < -0.5) continue  // below water
    trees.push({
      x, z, y,
      species: Math.floor(rng() * 4),
      scale:   0.75 + rng() * 0.65,
      rotY:    rng() * Math.PI * 2,
    })
  }
  return trees
}

const SPECIES_COLORS = [
  // Oak: dark greens
  ['#1a5c38', '#206040', '#2d6a4f'],
  // Pine: blue-green
  ['#1a4a38', '#1e5540', '#255e48'],
  // Maple: warm green
  ['#2a6030', '#3a7040', '#4a8050'],
  // Willow: pale/yellow-green
  ['#3a6a30', '#4a7a40', '#6a9a50'],
]
const TRUNK_COLORS = ['#5c3a1e', '#4a2e14', '#6b4020', '#5a3818']

function SingleTree({ t }: { t: TreeInstance }) {
  const sc   = t.scale
  const cols = SPECIES_COLORS[t.species]
  const tc   = TRUNK_COLORS[t.species]
  const base = [t.x, t.y, t.z] as [number, number, number]

  // Species-specific shapes
  const isPine   = t.species === 1
  const isWillow = t.species === 3

  const trunkH    = isPine ? 2.8 * sc : 1.8 * sc
  const trunkR    = isPine ? 0.14 * sc : 0.22 * sc
  const layer1H   = isPine ? 3.2 * sc : 2.4 * sc
  const layer1R   = isPine ? 1.2 * sc : 1.6 * sc
  const layer1Y   = trunkH + layer1H * 0.4
  const layer2H   = isPine ? 2.6 * sc : 2.0 * sc
  const layer2R   = isPine ? 0.9 * sc : 1.2 * sc
  const layer2Y   = layer1Y + layer2H * 0.55
  const layer3H   = isPine ? 2.0 * sc : 1.5 * sc
  const layer3R   = isPine ? 0.55 * sc : 0.8 * sc
  const layer3Y   = layer2Y + layer3H * 0.55

  return (
    <group position={base} rotation={[0, t.rotY, 0]}>
      {/* Trunk */}
      <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkR * 0.7, trunkR, trunkH, 7]} />
        <meshStandardMaterial color={tc} roughness={0.97} metalness={0} />
      </mesh>
      {/* Canopy layer 1 (base, widest) */}
      <mesh position={[0, layer1Y, 0]} castShadow receiveShadow>
        <coneGeometry args={[layer1R, layer1H, 7]} />
        <meshStandardMaterial color={cols[0]} roughness={0.87} metalness={0} envMapIntensity={0.2} />
      </mesh>
      {/* Canopy layer 2 */}
      <mesh position={[isWillow ? 0.15 * sc : 0.08 * sc, layer2Y, isWillow ? 0.1 * sc : 0.05 * sc]} castShadow receiveShadow>
        <coneGeometry args={[layer2R, layer2H, 7]} />
        <meshStandardMaterial color={cols[1]} roughness={0.85} metalness={0} envMapIntensity={0.18} />
      </mesh>
      {/* Canopy layer 3 (top) */}
      <mesh position={[-0.06 * sc, layer3Y, 0.06 * sc]} castShadow receiveShadow>
        <coneGeometry args={[layer3R, layer3H, 6]} />
        <meshStandardMaterial color={cols[2]} roughness={0.88} metalness={0} envMapIntensity={0.15} />
      </mesh>
      {/* Root flare (low flat cylinder) */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[trunkR * 1.8, trunkR * 2.2, 0.15, 8]} />
        <meshStandardMaterial color={tc} roughness={0.98} metalness={0} />
      </mesh>
    </group>
  )
}

export function Forest() {
  const trees = useMemo(() => generateTrees(), [])
  return <>{trees.map((t, i) => <SingleTree key={i} t={t} />)}</>
}
