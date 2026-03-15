/**
 * Terrain — Sky: Children of the Light aesthetic
 *
 * Key visual changes:
 *  - meshToonMaterial on all ground surfaces → flat cel-shaded look
 *  - Warm peachy-tan ground base (Sky's iconic sand/earth tones)
 *  - Soft green top layer where terrain is higher
 *  - Ocean: deep teal-indigo with animated gentle shimmer
 *  - Distant mountains: layered silhouettes in desaturated warm purples
 *  - Fog: warm haze, not grey — matches Sky's golden-hour atmosphere
 *  - Kept: noise terrain function (terrainHeight / WORLD_HALF exports unchanged)
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Fog } from '@react-three/drei'
import * as THREE from 'three'

export const WORLD_HALF = 200

const FREQ1 = 0.018, AMP1 = 5.5
const FREQ2 = 0.042, AMP2 = 2.2
const FREQ3 = 0.095, AMP3 = 0.8

export function terrainHeight(x: number, z: number): number {
  const h = Math.sin(x * FREQ1) * Math.cos(z * FREQ1) * AMP1
          + Math.sin(x * FREQ2 + 1.3) * Math.sin(z * FREQ2 + 0.7) * AMP2
          + Math.sin(x * FREQ3 + 2.1) * Math.cos(z * FREQ3 + 1.9) * AMP3
  // flatten center (meadow)
  const dr = Math.sqrt(x * x + z * z)
  const flat = Math.max(0, 1 - dr / 55)
  return h * (1 - flat * 0.85)
}

// Build terrain mesh with vertex colors: low = sandy, high = green
function buildTerrainGeometry(segs: number): THREE.BufferGeometry {
  const size = WORLD_HALF * 2
  const geo  = new THREE.PlaneGeometry(size, size, segs, segs)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const count = pos.count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i), z = pos.getZ(i)
    const h = terrainHeight(x, z)
    pos.setY(i, h)
    // Vertex color: sandy low → grassy green high
    const t = THREE.MathUtils.clamp((h + 1) / 6, 0, 1)
    // low: warm sand #d4a96a → high: soft sage #5a8a60
    const r = 0.83 - t * 0.48
    const g = 0.66 + t * 0.21
    const b = 0.42 - t * 0.17
    colors[i * 3]     = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

export function Terrain() {
  const geoHigh = useMemo(() => buildTerrainGeometry(160), [])
  const geoLow  = useMemo(() => buildTerrainGeometry(48),  [])
  return (
    <>
      {/* High-res core (within ~90u) — toon cel material */}
      <mesh geometry={geoHigh} receiveShadow>
        <meshToonMaterial vertexColors side={THREE.FrontSide} />
      </mesh>
      {/* Fog — warm golden haze */}
      <Fog attach="fog" color="#f5deb3" near={140} far={380} />
    </>
  )
}

export function OceanPlane() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshToonMaterial
    const t   = clock.elapsedTime
    // Animate between deep teal and indigo — Sky's ocean palette
    mat.color.setRGB(
      0.05 + 0.04 * Math.sin(t * 0.25),
      0.28 + 0.07 * Math.sin(t * 0.18 + 1.2),
      0.45 + 0.08 * Math.sin(t * 0.22 + 2.4),
    )
    mat.emissiveIntensity = 0.08 + 0.05 * Math.sin(t * 0.4)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
      <planeGeometry args={[WORLD_HALF * 2 + 80, WORLD_HALF * 2 + 80, 1, 1]} />
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
    { r: 230, h: 38, col: '#b8a0d0', emiss: '#8060a0', segs: 14, y: -4   },
    { r: 260, h: 55, col: '#c8b0d8', emiss: '#9070b0', segs: 12, y: -10  },
    { r: 290, h: 72, col: '#d8c0e0', emiss: '#a080c0', segs: 10, y: -18  },
  ], [])

  return (
    <>
      {layers.map((l, i) => {
        const pts = useMemo(() => {
          const out: THREE.Vector2[] = []
          const N = l.segs
          for (let j = 0; j <= N; j++) {
            const a = (j / N) * Math.PI * 2
            const noise = 0.85 + 0.3 * Math.sin(a * 3.7 + i) + 0.15 * Math.sin(a * 7.1 + i * 2)
            out.push(new THREE.Vector2(Math.cos(a) * l.r * noise, Math.sin(a) * l.r * noise))
          }
          return out
        }, [])  // eslint-disable-line react-hooks/exhaustive-deps

        // Build as a flat extruded ring silhouette
        const geo = useMemo(() => {
          const shape = new THREE.Shape()
          pts.forEach((p, j) => j === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y))
          shape.closePath()
          return new THREE.ExtrudeGeometry(shape, { depth: l.h, bevelEnabled: false })
        }, [pts, l.h])  // eslint-disable-line react-hooks/exhaustive-deps

        return (
          <mesh key={i} geometry={geo}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, l.y, 0]}>
            <meshToonMaterial
              color={l.col}
              emissive={l.emiss}
              emissiveIntensity={0.15 + i * 0.05}
              side={THREE.BackSide}
            />
          </mesh>
        )
      })}
    </>
  )
}
