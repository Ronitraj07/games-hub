/**
 * Trees — Sky: Children of the Light aesthetic
 *
 * Visual language:
 *  - Rounded canopies using IcosahedronGeometry (subdivided sphere clusters)
 *    instead of sharp cones → soft, bubbly cloud-like foliage
 *  - Toon/cel material: flat color + emissive glow + no metalness
 *  - Warm inner glow: every canopy has a subtle emissive so trees look
 *    like they hold light inside them (signature Sky CotL look)
 *  - Trunks use LatheGeometry for organic curved silhouette
 *  - Willow: drooping sphere clusters offset downward
 *  - Color palette: warm ambers, soft greens, mint, peach — Sky's palette
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const TREE_COUNT = 200
const RNG_SEED   = 42

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

interface TreeInstance {
  x: number; z: number; y: number
  species: number
  scale: number
  rotY: number
}

function generateTrees(): TreeInstance[] {
  const rng   = seededRng(RNG_SEED)
  const trees: TreeInstance[] = []
  let attempts = 0
  while (trees.length < TREE_COUNT && attempts < 6000) {
    attempts++
    const angle = rng() * Math.PI * 2
    const r     = 45 + rng() * 148
    const x     = Math.cos(angle) * r
    const z     = Math.sin(angle) * r
    if (Math.sqrt(x * x + z * z) > 192) continue
    if (Math.sqrt(x * x + (z - 10) * (z - 10)) < 20) continue  // avoid pond
    const y = terrainHeight(x, z)
    if (y < -0.3) continue
    trees.push({ x, z, y, species: Math.floor(rng() * 4), scale: 0.8 + rng() * 0.7, rotY: rng() * Math.PI * 2 })
  }
  return trees
}

// Sky CotL palette — warm glowing naturals
const PALETTE = [
  // 0 Sunlit Oak: warm amber-greens
  { canopy: ['#4a7c59', '#5a9068', '#3d6b4a'], trunk: '#7a5535', emissive: '#2a4a30', emissInt: 0.25 },
  // 1 Spirit Pine: cool mint with inner glow
  { canopy: ['#3a7a6a', '#4a8a7a', '#2d6560'], trunk: '#5a4020', emissive: '#1a5a50', emissInt: 0.3 },
  // 2 Blossom Maple: peach-pink (like Sky's star trees)
  { canopy: ['#c8856a', '#e0a080', '#b87060'], trunk: '#7a5535', emissive: '#a06040', emissInt: 0.35 },
  // 3 Willow: pale sage with soft yellow glow
  { canopy: ['#7aaa70', '#8aba80', '#6a9a60'], trunk: '#6a5530', emissive: '#4a7a40', emissInt: 0.2 },
]

function ToonMat({ color, emissive, emissInt }: { color: string; emissive: string; emissInt: number }) {
  return (
    <meshToonMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissInt}
    />
  )
}

// Lathe trunk: organic curved silhouette
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

// Rounded canopy blob: cluster of icosahedra → bubbly Sky look
function CanopyBlob({
  cx, cy, cz, r, color, emissive, emissInt,
  offsets,
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
  const isWillow = t.species === 3
  const isPine   = t.species === 1
  const isMaple  = t.species === 2

  const trunkH = (isPine ? 3.2 : isWillow ? 1.4 : 2.0) * sc
  const trunkR = (isPine ? 0.12 : 0.20) * sc

  // Main canopy center
  const canY = trunkH + (isPine ? 0.6 : 0.4) * sc
  const r0   = (isPine ? 1.1 : isWillow ? 1.4 : 1.3) * sc

  // Cluster offsets — gives organic bubbly shape instead of a single ball
  const offsets: [number, number, number][] = isPine ? [
    [0, 0, 0], [0, r0 * 0.8, 0], [0, r0 * 1.55, 0],
    [r0 * 0.25, r0 * 0.35, r0 * 0.1], [-r0 * 0.2, r0 * 1.1, r0 * 0.15],
  ] : isWillow ? [
    [0, 0, 0],
    [r0 * 0.6,  -r0 * 0.35, r0 * 0.2],
    [-r0 * 0.5, -r0 * 0.3,  r0 * 0.3],
    [r0 * 0.2,  -r0 * 0.55, -r0 * 0.5],
    [-r0 * 0.3, -r0 * 0.45, -r0 * 0.4],
  ] : isMaple ? [
    [0, 0, 0],
    [r0 * 0.55, r0 * 0.3, 0],
    [-r0 * 0.5, r0 * 0.25, r0 * 0.1],
    [r0 * 0.1,  r0 * 0.55, r0 * 0.2],
    [-r0 * 0.2, r0 * 0.6, -r0 * 0.15],
    [r0 * 0.3,  -r0 * 0.2, r0 * 0.35],
  ] : [
    [0, 0, 0],
    [r0 * 0.5, r0 * 0.35, 0],
    [-r0 * 0.45, r0 * 0.3, r0 * 0.15],
    [r0 * 0.15,  r0 * 0.6, -r0 * 0.1],
    [r0 * 0.3,  -r0 * 0.15, r0 * 0.4],
  ]

  // Secondary lower color blob for depth
  const secOffsets: [number, number, number][] = [
    [r0 * 0.4, -r0 * 0.1, r0 * 0.3],
    [-r0 * 0.35, -r0 * 0.05, -r0 * 0.3],
  ]

  return (
    <group position={[t.x, t.y, t.z]} rotation={[0, t.rotY, 0]}>
      <Trunk h={trunkH} r={trunkR} color={pal.trunk} />
      {/* Main canopy blobs */}
      <CanopyBlob
        cx={0} cy={canY} cz={0}
        r={r0 * 0.72}
        color={pal.canopy[0]}
        emissive={pal.emissive} emissInt={pal.emissInt}
        offsets={offsets}
      />
      {/* Secondary darker depth blobs */}
      <CanopyBlob
        cx={0} cy={canY - r0 * 0.2} cz={0}
        r={r0 * 0.52}
        color={pal.canopy[2]}
        emissive={pal.emissive} emissInt={pal.emissInt * 0.6}
        offsets={secOffsets}
      />
      {/* Root flare — lathe-like widening */}
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
