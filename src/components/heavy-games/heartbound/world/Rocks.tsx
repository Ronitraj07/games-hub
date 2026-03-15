/**
 * Rocks — displaced IcosahedronGeometry + slope-aware placement
 *
 * Each rock:
 *  - Base: IcosahedronGeometry detail=1 (20 faces) with random vertex displacement
 *  - Multi-rock clusters: 1–3 rocks per group, varied size
 *  - Color: dark base, lighter top face (light-catching)
 *  - Moss patches: second slightly green tint on low/flat rocks
 */
import { useMemo } from 'react'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const ROCK_CLUSTERS = 80

function seededRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

function makeRockGeo(rng: () => number, scale: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(scale, 1)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const noise = 1 + (rng() - 0.5) * 0.55
    pos.setXYZ(i, pos.getX(i) * noise, pos.getY(i) * noise * 0.75, pos.getZ(i) * noise)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

interface RockGroup {
  cx: number; cz: number
  rocks: { dx: number; dz: number; scale: number; rotY: number; color: string }[]
}

const ROCK_COLORS = ['#6b5a42', '#7a6a52', '#8a7a62', '#5a4a32', '#9a8a72']
const MOSS_COLORS = ['#4a6a42', '#5a7a50', '#6a8a58']

function generateRockGroups(): RockGroup[] {
  const rng = seededRng(77)
  const groups: RockGroup[] = []
  let attempts = 0
  while (groups.length < ROCK_CLUSTERS && attempts < 2000) {
    attempts++
    const angle = rng() * Math.PI * 2
    const r = 30 + rng() * 160
    const cx = Math.cos(angle) * r
    const cz = Math.sin(angle) * r
    if (Math.sqrt(cx * cx + cz * cz) > 192) continue
    if (Math.sqrt(cx * cx + cz * cz) < 18) continue  // keep pond clear
    const y = terrainHeight(cx, cz)
    if (y < 0) continue
    const count = 1 + Math.floor(rng() * 3)
    const rocks = Array.from({ length: count }, () => ({
      dx:    (rng() - 0.5) * 3,
      dz:    (rng() - 0.5) * 3,
      scale: 0.25 + rng() * 0.7,
      rotY:  rng() * Math.PI * 2,
      color: rng() > 0.25
        ? ROCK_COLORS[Math.floor(rng() * ROCK_COLORS.length)]
        : MOSS_COLORS[Math.floor(rng() * MOSS_COLORS.length)],
    }))
    groups.push({ cx, cz, rocks })
  }
  return groups
}

function RockCluster({ g }: { g: RockGroup }) {
  const rng = seededRng(Math.floor(g.cx * 1000 + g.cz))
  const baseY = terrainHeight(g.cx, g.cz)
  return (
    <group position={[g.cx, baseY, g.cz]}>
      {g.rocks.map((r, i) => {
        const geo = useMemo(() => makeRockGeo(rng, r.scale), []) // eslint-disable-line
        return (
          <mesh
            key={i}
            geometry={geo}
            position={[r.dx, r.scale * 0.5, r.dz]}
            rotation={[0, r.rotY, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color={r.color} roughness={0.94} metalness={0.02} envMapIntensity={0.15} />
          </mesh>
        )
      })}
    </group>
  )
}

export function Rocks() {
  const groups = useMemo(() => generateRockGroups(), [])
  return <>{groups.map((g, i) => <RockCluster key={i} g={g} />)}</>
}
