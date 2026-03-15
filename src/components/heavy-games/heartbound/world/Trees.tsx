/**
 * Trees — Phase 1 | 1000×1000 world
 *
 * District-matched species:
 *   Meadow Core    → Oak (warm, familiar)
 *   Market Village → Oak + Willow (shady market trees)
 *   Flower Fields  → Blossom Maple (peach-pink, matches flowers)
 *   Ancient Ruins  → Spirit Pine (dark, ancient feel)
 *   Cliffside      → Spirit Pine (wind-bent, sparse)
 *   Lakeside       → Willow (drooping over water, classic)
 *
 * Count: 320 trees across 1000×1000 (same density as before)
 * Geometry: unchanged — icosahedron blobs + lathe trunks
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const TREE_COUNT = 320
const RNG_SEED   = 42

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

interface TreeInstance {
  x: number; z: number; y: number
  species: number   // 0=Oak 1=Pine 2=Maple 3=Willow
  scale: number
  rotY: number
}

/** Pick species based on district */
function speciesForDistrict(x: number, z: number, rng: () => number): number {
  const dr = Math.sqrt(x * x + z * z)
  if (dr < 130)                        return rng() < 0.7 ? 0 : 3  // meadow: oak + willow
  if (x < -80 && z > 80)              return rng() < 0.6 ? 0 : 3  // market: oak + willow
  if (x > 80  && z > 80)              return 2                     // flowers: blossom maple
  if (x > 80  && z < -80)             return 1                     // ruins: pine
  if (x < -80 && z < -80)             return rng() < 0.8 ? 1 : 0  // cliffside: pine mostly
  if (z < -80 && Math.abs(x) < 220)   return 3                     // lakeside: willow
  return Math.floor(rng() * 4)
}

function generateTrees(): TreeInstance[] {
  const rng   = seededRng(RNG_SEED)
  const trees: TreeInstance[] = []
  let attempts = 0

  while (trees.length < TREE_COUNT && attempts < 12000) {
    attempts++
    // Scatter across full 1000×1000 minus a central 90r meadow clearing
    const angle = rng() * Math.PI * 2
    const r     = 90 + rng() * 400
    const x     = Math.cos(angle) * r
    const z     = Math.sin(angle) * r

    // Stay inside world boundary with margin
    if (Math.abs(x) > 485 || Math.abs(z) > 485) continue

    // Keep paths clear: avoid ponds
    if (Math.hypot(x, z - 10) < 22)    continue  // meadow pond
    if (Math.hypot(x, z + 280) < 42)   continue  // lakeside lake

    const y = terrainHeight(x, z)
    if (y < -0.5) continue  // below water level

    const species = speciesForDistrict(x, z, rng)
    trees.push({
      x, z, y,
      species,
      scale: 0.8 + rng() * 0.75,
      rotY:  rng() * Math.PI * 2,
    })
  }
  return trees
}

// Sky CotL palette — unchanged from previous version
const PALETTE = [
  { canopy: ['#4a7c59', '#5a9068', '#3d6b4a'], trunk: '#7a5535', emissive: '#2a4a30', emissInt: 0.25 },
  { canopy: ['#3a7a6a', '#4a8a7a', '#2d6560'], trunk: '#5a4020', emissive: '#1a5a50', emissInt: 0.3  },
  { canopy: ['#c8856a', '#e0a080', '#b87060'], trunk: '#7a5535', emissive: '#a06040', emissInt: 0.35 },
  { canopy: ['#7aaa70', '#8aba80', '#6a9a60'], trunk: '#6a5530', emissive: '#4a7a40', emissInt: 0.2  },
]

function ToonMat({ color, emissive, emissInt }: { color: string; emissive: string; emissInt: number }) {
  return <meshToonMaterial color={color} emissive={emissive} emissiveIntensity={emissInt} />
}

function Trunk({ h, r, color }: { h: number; r: number; color: string }) {
  const points = useMemo(() => [
    new THREE.Vector2(r * 1.4, 0),
    new THREE.Vector2(r * 1.1, h * 0.2),
    new THREE.Vector2(r * 0.85, h * 0.5),
    new THREE.Vector2(r * 0.65, h * 0.75),
    new THREE.Vector2(r * 0.45, h),
  ], [h, r])
  return (
    <mesh castShadow receiveShadow>
      <latheGeometry args={[points, 8]} />
      <meshToonMaterial color={color} />
    </mesh>
  )
}

function CanopyBlob({
  cx, cy, cz, r, color, emissive, emissInt, offsets,
}: {
  cx: number; cy: number; cz: number; r: number
  color: string; emissive: string; emissInt: number
  offsets: [number, number, number][]
}) {
  return (
    <>
      {offsets.map(([ox, oy, oz], i) => (
        <mesh key={i} position={[cx + ox, cy + oy, cz + oz]} castShadow>
          <icosahedronGeometry args={[r * (0.75 + i * 0.08), 1]} />
          <ToonMat color={color} emissive={emissive} emissInt={emissInt} />
        </mesh>
      ))}
    </>
  )
}

function SingleTree({ t }: { t: TreeInstance }) {
  const sc  = t.scale
  const pal = PALETTE[t.species]
  const isPine   = t.species === 1
  const isWillow = t.species === 3
  const isMaple  = t.species === 2

  const trunkH = (isPine ? 3.2 : isWillow ? 1.4 : 2.0) * sc
  const trunkR = (isPine ? 0.12 : 0.20) * sc
  const canY   = trunkH + (isPine ? 0.6 : 0.4) * sc
  const r0     = (isPine ? 1.1 : isWillow ? 1.4 : 1.3) * sc

  const offsets: [number, number, number][] = isPine ? [
    [0, 0, 0], [0, r0 * 0.8, 0], [0, r0 * 1.55, 0],
    [r0 * 0.25, r0 * 0.35, r0 * 0.1], [-r0 * 0.2, r0 * 1.1, r0 * 0.15],
  ] : isWillow ? [
    [0, 0, 0],
    [r0 * 0.6,  -r0 * 0.35,  r0 * 0.2],
    [-r0 * 0.5, -r0 * 0.3,   r0 * 0.3],
    [r0 * 0.2,  -r0 * 0.55, -r0 * 0.5],
    [-r0 * 0.3, -r0 * 0.45, -r0 * 0.4],
  ] : isMaple ? [
    [0, 0, 0],
    [r0 * 0.55,  r0 * 0.3,   0],
    [-r0 * 0.5,  r0 * 0.25,  r0 * 0.1],
    [r0 * 0.1,   r0 * 0.55,  r0 * 0.2],
    [-r0 * 0.2,  r0 * 0.6,  -r0 * 0.15],
    [r0 * 0.3,  -r0 * 0.2,   r0 * 0.35],
  ] : [
    [0, 0, 0],
    [r0 * 0.5,   r0 * 0.35,  0],
    [-r0 * 0.45, r0 * 0.3,   r0 * 0.15],
    [r0 * 0.15,  r0 * 0.6,  -r0 * 0.1],
    [r0 * 0.3,  -r0 * 0.15,  r0 * 0.4],
  ]

  const secOffsets: [number, number, number][] = [
    [ r0 * 0.4,  -r0 * 0.1,  r0 * 0.3],
    [-r0 * 0.35, -r0 * 0.05, -r0 * 0.3],
  ]

  return (
    <group position={[t.x, t.y, t.z]} rotation={[0, t.rotY, 0]}>
      <Trunk h={trunkH} r={trunkR} color={pal.trunk} />
      <CanopyBlob cx={0} cy={canY} cz={0} r={r0 * 0.72}
        color={pal.canopy[0]} emissive={pal.emissive} emissInt={pal.emissInt}
        offsets={offsets} />
      <CanopyBlob cx={0} cy={canY - r0 * 0.2} cz={0} r={r0 * 0.52}
        color={pal.canopy[2]} emissive={pal.emissive} emissInt={pal.emissInt * 0.6}
        offsets={secOffsets} />
      <mesh position={[0, 0.08 * sc, 0]} receiveShadow>
        <cylinderGeometry args={[trunkR * 2.0, trunkR * 2.6, 0.18 * sc, 8]} />
        <meshToonMaterial color={pal.trunk} />
      </mesh>
    </group>
  )
}

export function Forest() {
  const trees = useMemo(() => generateTrees(), [])
  return <>{trees.map((t, i) => <SingleTree key={i} t={t} />)}</>
}
