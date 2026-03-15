/**
 * Rocks — Sky: Children of the Light aesthetic
 *
 * Replaced BoxGeometry with IcosahedronGeometry (detail=1) for each rock.
 * Icosahedra look like natural angular boulders when slightly scaled
 * non-uniformly. Color palette matches Sky's warm sandy stone.
 * meshToonMaterial for cel-shade consistency.
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const ROCK_COUNT = 80
const RNG_SEED   = 77

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

interface RockInstance {
  x: number; z: number; y: number
  sx: number; sy: number; sz: number
  rotX: number; rotY: number; rotZ: number
  colorIdx: number
}

function generateRocks(): RockInstance[] {
  const rng   = seededRng(RNG_SEED)
  const rocks: RockInstance[] = []
  let attempts = 0
  while (rocks.length < ROCK_COUNT && attempts < 3000) {
    attempts++
    const angle = rng() * Math.PI * 2
    const r     = 20 + rng() * 165
    const x     = Math.cos(angle) * r
    const z     = Math.sin(angle) * r
    if (Math.sqrt(x * x + z * z) > 190) continue
    if (Math.sqrt(x * x + (z - 10) * (z - 10)) < 18) continue
    const y = terrainHeight(x, z)
    if (y < -0.2) continue
    rocks.push({
      x, z, y,
      sx: 0.4 + rng() * 1.0,
      sy: 0.3 + rng() * 0.8,
      sz: 0.35 + rng() * 0.9,
      rotX: rng() * 0.6,
      rotY: rng() * Math.PI * 2,
      rotZ: rng() * 0.5,
      colorIdx: Math.floor(rng() * 4),
    })
  }
  return rocks
}

// Sky palette rocks: warm sandstone, dusty rose, cool slate, mossy
const ROCK_COLORS = ['#c8a870', '#b89060', '#9090a0', '#7a9070']
const ROCK_EMISS  = ['#6a5030', '#5a4020', '#404060', '#3a5030']

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
            color={ROCK_COLORS[r.colorIdx]}
            emissive={ROCK_EMISS[r.colorIdx]}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </>
  )
}
