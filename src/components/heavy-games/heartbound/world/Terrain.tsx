/**
 * Terrain — Phase 1 | 1000×1000 world
 *
 * District layout (all coords are world-space X,Z):
 *   Meadow Core     center       flat, gentle rolls
 *   Market Village  SW (-300,+200 to -100,+400)   gently sloped
 *   Flower Fields   SE (+100,+100 to +400,+400)   very flat
 *   Ancient Ruins   NE (+150,-400 to +450,-100)   hilly, jagged
 *   Cliffside Path  NW (-450,-400 to -100,-100)   HIGH cliff (+20 to +45)
 *   Lakeside Retreat N  (-200,-450 to +200,-150)  flat basin
 *
 * terrainHeight() is the single source of truth used by:
 *   - terrain mesh vertex displacement
 *   - MovementController (player Y)
 *   - NPC placement
 *   - SpawnPortal
 *   - Trees / Rocks placement
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const WORLD_HALF = 500   // 1000×1000 world

// Base noise frequencies & amplitudes
const FREQ1 = 0.009, AMP1 = 6.0
const FREQ2 = 0.022, AMP2 = 2.8
const FREQ3 = 0.055, AMP3 = 1.0

/** Smooth step — used for district blending */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * terrainHeight(x, z) — exported, pure function
 * Returns world-Y for any (x,z) coordinate.
 */
export function terrainHeight(x: number, z: number): number {
  // ─ Base noise ───────────────────────────────────────────────────
  const base = Math.sin(x * FREQ1) * Math.cos(z * FREQ1) * AMP1
             + Math.sin(x * FREQ2 + 1.3) * Math.sin(z * FREQ2 + 0.7) * AMP2
             + Math.sin(x * FREQ3 + 2.1) * Math.cos(z * FREQ3 + 1.9) * AMP3

  // ─ Meadow Core flatten (center ~120r) ─────────────────────────────
  const dr   = Math.sqrt(x * x + z * z)
  const flat = smoothstep(140, 60, dr)   // 1 at center, 0 beyond 140
  let h = base * (1 - flat * 0.88)

  // ─ Cliffside Path NW: x < -80, z < -80 ──────────────────────────
  if (x < -80 && z < -80) {
    // How deep into the NW district
    const nwStrength = smoothstep(-80, -220, x) * smoothstep(-80, -220, z)
    // Cliff ramp: rises steeply toward (-350,-350)
    const cliffRamp = 18 + 28 * smoothstep(-80, -380, x) * smoothstep(-80, -380, z)
    h += cliffRamp * nwStrength
  }

  // ─ Ancient Ruins NE: x > 80, z < -80 ──────────────────────────
  if (x > 80 && z < -80) {
    const neStrength = smoothstep(80, 200, x) * smoothstep(-80, -200, z)
    // Gentle hills with jagged micro-noise for ruined feel
    const ruins = 8 * neStrength + Math.sin(x * 0.18) * Math.cos(z * 0.15) * 4 * neStrength
    h += ruins
  }

  // ─ Flower Fields SE: x > 80, z > 80 ───────────────────────────
  if (x > 80 && z > 80) {
    const seStrength = smoothstep(80, 200, x) * smoothstep(80, 200, z)
    // Flatten flower fields so the maze of grass is easy to navigate
    h -= h * seStrength * 0.75
  }

  // ─ Lakeside Retreat N: z < -80, |x| < 200 ──────────────────────
  if (z < -80 && Math.abs(x) < 220) {
    const nStrength = smoothstep(-80, -200, z) * smoothstep(220, 100, Math.abs(x))
    // Basin: push terrain down slightly for the lake
    h -= 3.5 * nStrength
  }

  return h
}

/** Vertex color given height — Sky CotL warm palette */
function heightToColor(h: number, x: number, z: number): [number, number, number] {
  // Cliffside NW: rocky grey-purple
  if (x < -80 && z < -80 && h > 12) {
    const t = THREE.MathUtils.clamp((h - 12) / 30, 0, 1)
    return [0.52 + t * 0.08, 0.48 + t * 0.04, 0.55 + t * 0.05]
  }
  // Ancient Ruins NE: warm dusty ochre
  if (x > 80 && z < -80) {
    return [0.72, 0.60, 0.42]
  }
  // Flower Fields SE: bright soft green
  if (x > 80 && z > 80) {
    return [0.42, 0.72, 0.38]
  }
  // Lakeside N basin: slightly darker green
  if (z < -80 && Math.abs(x) < 220) {
    return [0.38, 0.62, 0.42]
  }
  // Default: sand low → sage high
  const t = THREE.MathUtils.clamp((h + 1) / 7, 0, 1)
  return [0.83 - t * 0.48, 0.66 + t * 0.21, 0.42 - t * 0.17]
}

function buildTerrainGeometry(segs: number): THREE.BufferGeometry {
  const size = WORLD_HALF * 2
  const geo  = new THREE.PlaneGeometry(size, size, segs, segs)
  geo.rotateX(-Math.PI / 2)
  const pos    = geo.attributes.position as THREE.BufferAttribute
  const count  = pos.count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = terrainHeight(x, z)
    pos.setY(i, h)
    const [r, g, b] = heightToColor(h, x, z)
    colors[i * 3]     = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

export function Terrain() {
  // 220 segs across 1000 units → ~4.5u per quad — good terrain detail
  const geo = useMemo(() => buildTerrainGeometry(220), [])
  return (
    <>
      {/* Warm golden haze fog — far plane matches world scale */}
      <fog attach="fog" args={['#f5deb3', 280, 800]} />
      <mesh geometry={geo} receiveShadow>
        <meshToonMaterial vertexColors side={THREE.FrontSide} />
      </mesh>
    </>
  )
}

export function OceanPlane() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshToonMaterial
    const t   = clock.elapsedTime
    mat.color.setRGB(
      0.05 + 0.04 * Math.sin(t * 0.25),
      0.28 + 0.07 * Math.sin(t * 0.18 + 1.2),
      0.45 + 0.08 * Math.sin(t * 0.22 + 2.4),
    )
    mat.emissiveIntensity = 0.08 + 0.05 * Math.sin(t * 0.4)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
      <planeGeometry args={[WORLD_HALF * 2 + 200, WORLD_HALF * 2 + 200, 1, 1]} />
      <meshToonMaterial
        color="#0d4872"
        emissive="#0a3050"
        emissiveIntensity={0.08}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

export function DistantMountains() {
  const layers = useMemo(() => [
    { r: 580, h: 55, col: '#b8a0d0', emiss: '#8060a0', segs: 16, y: -8  },
    { r: 650, h: 80, col: '#c8b0d8', emiss: '#9070b0', segs: 14, y: -18 },
    { r: 720, h: 110,col: '#d8c0e0', emiss: '#a080c0', segs: 12, y: -32 },
  ], [])

  return (
    <>
      {layers.map((l, i) => {
        const pts: THREE.Vector2[] = []
        for (let j = 0; j <= l.segs; j++) {
          const a = (j / l.segs) * Math.PI * 2
          const noise = 0.85 + 0.3 * Math.sin(a * 3.7 + i) + 0.15 * Math.sin(a * 7.1 + i * 2)
          pts.push(new THREE.Vector2(Math.cos(a) * l.r * noise, Math.sin(a) * l.r * noise))
        }
        const shape = new THREE.Shape()
        pts.forEach((p, j) => j === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y))
        shape.closePath()
        const geo = new THREE.ExtrudeGeometry(shape, { depth: l.h, bevelEnabled: false })
        return (
          <mesh key={i} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, l.y, 0]}>
            <meshToonMaterial color={l.col} emissive={l.emiss}
              emissiveIntensity={0.15 + i * 0.05} side={THREE.BackSide} />
          </mesh>
        )
      })}
    </>
  )
}
