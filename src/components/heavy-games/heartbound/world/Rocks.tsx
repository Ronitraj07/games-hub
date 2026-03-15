/**
 * Rocks — Phase 1 | 1000×1000 world
 *
 * District-matched color palettes:
 *   Cliffside NW  → dark grey-purple boulders (cliff face)
 *   Ancient Ruins NE → warm ochre/sandstone (crumbling ruins feel)
 *   Flower Fields SE → rare, mossy green (hidden among flowers)
 *   Lakeside N    → smooth wet-grey river stones
 *   Meadow/Market → warm sandy default
 *
 * Count: 160 rocks across 1000×1000
 * Geometry: unchanged — IcosahedronGeometry(1,1) scaled non-uniformly
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const ROCK_COUNT = 160
const RNG_SEED   = 77

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// District-specific palettes: [color, emissive]
const DISTRICT_PALETTES: Record<string, [string, string][]> = {
  cliffside: [
    ['#6a6070', '#3a3040'],
    ['#7a7080', '#40384a'],
    ['#585068', '#2e2838'],
    ['#8a7890', '#4a3858'],
  ],
  ruins: [
    ['#c8a060', '#6a5020'],
    ['#b89050', '#5a4010'],
    ['#d4b478', '#7a6030'],
    ['#a07840', '#503800'],
  ],
  flowers: [
    ['#7a9060', '#3a5020'],
    ['#6a8858', '#304818'],
    ['#8aaa70', '#4a6030'],
  ],
  lakeside: [
    ['#8a9098', '#404850'],
    ['#7a8890', '#383e48'],
    ['#9aa0a8', '#484e58'],
  ],
  default: [
    ['#c8a870', '#6a5030'],
    ['#b89060', '#5a4020'],
    ['#9a9060', '#4a4820'],
    ['#a89870', '#504828'],
  ],
}

function getDistrict(x: number, z: number): string {
  if (x < -80 && z < -80)              return 'cliffside'
  if (x > 80  && z < -80)              return 'ruins'
  if (x > 80  && z > 80)               return 'flowers'
  if (z < -80 && Math.abs(x) < 220)    return 'lakeside'
  return 'default'
}

interface RockInstance {
  x: number; z: number; y: number
  sx: number; sy: number; sz: number
  rotX: number; rotY: number; rotZ: number
  color: string; emissive: string
}

function generateRocks(): RockInstance[] {
  const rng   = seededRng(RNG_SEED)
  const rocks: RockInstance[] = []
  let attempts = 0

  while (rocks.length < ROCK_COUNT && attempts < 8000) {
    attempts++
    const angle = rng() * Math.PI * 2
    const r     = 30 + rng() * 455
    const x     = Math.cos(angle) * r
    const z     = Math.sin(angle) * r

    if (Math.abs(x) > 485 || Math.abs(z) > 485) continue
    if (Math.hypot(x, z - 10)   < 20) continue  // meadow pond
    if (Math.hypot(x, z + 280)  < 40) continue  // lakeside lake
    // Keep flower fields mostly clear (sparse rocks)
    if (x > 80 && z > 80 && rng() > 0.25) continue

    const y = terrainHeight(x, z)
    if (y < -0.3) continue

    const district = getDistrict(x, z)
    const palette  = DISTRICT_PALETTES[district]
    const pick     = palette[Math.floor(rng() * palette.length)]

    // Cliff rocks: taller + more jagged scale
    const isCliff  = district === 'cliffside'
    const isRuins  = district === 'ruins'

    rocks.push({
      x, z, y,
      sx: isCliff ? 0.6 + rng() * 1.8 : 0.4 + rng() * 1.0,
      sy: isCliff ? 0.8 + rng() * 2.2 : isRuins ? 0.5 + rng() * 1.4 : 0.3 + rng() * 0.8,
      sz: isCliff ? 0.5 + rng() * 1.6 : 0.35 + rng() * 0.9,
      rotX: rng() * (isCliff ? 0.3 : 0.6),
      rotY: rng() * Math.PI * 2,
      rotZ: rng() * (isCliff ? 0.2 : 0.5),
      color:   pick[0],
      emissive: pick[1],
    })
  }
  return rocks
}

export function Rocks() {
  const rocks = useMemo(() => generateRocks(), [])
  return (
    <>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.y + r.sy * 0.45, r.z]}
          rotation={[r.rotX, r.rotY, r.rotZ]}
          scale={[r.sx, r.sy, r.sz]}
          castShadow receiveShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshToonMaterial
            color={r.color}
            emissive={r.emissive}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </>
  )
}
