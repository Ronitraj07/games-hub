/**
 * Terrain — Step 1+2 of world rebuild
 *
 * - 400×400 unit world (was 48×48) — 8× area increase
 * - 200×200 segment PlaneGeometry driven by multi-octave noise
 * - 2-layer vertex color blend: grass (flat) ↔ rock/dirt (steep slopes)
 * - Correct normals recomputed after displacement
 * - Cliffs around island edge drop into ocean
 * - Distant mountain ridge on horizon (north edge) as scale anchor
 */
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

// ─── Noise (inline, no npm package needed) ────────────────────
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(a: number, b: number, t: number) { return a + t * (b - a) }
function grad(hash: number, x: number, y: number) {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
}
const P: number[] = []
for (let i = 0; i < 256; i++) P[i] = i
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));[P[i], P[j]] = [P[j], P[i]]
}
const PERM = [...P, ...P]
function perlin2(x: number, y: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255
  const xf = x - Math.floor(x), yf = y - Math.floor(y)
  const u = fade(xf), v = fade(yf)
  const a = PERM[X] + Y, b = PERM[X + 1] + Y
  return lerp(
    lerp(grad(PERM[a], xf, yf), grad(PERM[b], xf - 1, yf), u),
    lerp(grad(PERM[a + 1], xf, yf - 1), grad(PERM[b + 1], xf - 1, yf - 1), u),
    v,
  )
}
function fbm(x: number, y: number, octaves = 5): number {
  let v = 0, amp = 0.5, freq = 1, max = 0
  for (let i = 0; i < octaves; i++) {
    v += perlin2(x * freq, y * freq) * amp
    max += amp; amp *= 0.5; freq *= 2.1
  }
  return v / max
}
// ──────────────────────────────────────────────────────────────

export const WORLD_SIZE = 400
export const WORLD_HALF = WORLD_SIZE / 2
const SEGS = 200         // 200×200 segments — enough detail, still fast
const MAX_HEIGHT = 18    // max terrain elevation
const ISLAND_FALLOFF = 0.72  // edge dropoff sharpness

// Colours
const C_DEEP_GRASS  = new THREE.Color('#1a5c35')
const C_MID_GRASS   = new THREE.Color('#2d7a50')
const C_HIGH_GRASS  = new THREE.Color('#5aad78')
const C_ROCK        = new THREE.Color('#7a6a52')
const C_DIRT        = new THREE.Color('#9c7a4a')
const C_SAND        = new THREE.Color('#c8b87a')
const C_SNOW        = new THREE.Color('#e8f0f0')
const C_WATER_EDGE  = new THREE.Color('#3a6a50')

export function terrainHeight(x: number, z: number): number {
  const nx = x / WORLD_SIZE
  const nz = z / WORLD_SIZE
  // Island falloff — circular mask so edges drop to sea
  const d = Math.sqrt(nx * nx + nz * nz) * 2.0
  const falloff = Math.max(0, 1 - Math.pow(d, ISLAND_FALLOFF * 2.5))
  // Multi-octave terrain
  const base  = fbm(nx * 3.5 + 10, nz * 3.5 + 10, 5) * MAX_HEIGHT
  const detail = fbm(nx * 8 + 5, nz * 8 + 5, 3) * 2.5
  // Meadow core (near 0,0) kept flatter
  const meadowFlat = Math.max(0, 1 - (Math.sqrt(x * x + z * z) / 80)) * 6
  return (base + detail - meadowFlat) * falloff - 0.5
}

function slopeAt(x: number, z: number): number {
  const eps = 1.0
  const dy_dx = terrainHeight(x + eps, z) - terrainHeight(x - eps, z)
  const dy_dz = terrainHeight(x, z + eps) - terrainHeight(x, z - eps)
  return Math.sqrt(dy_dx * dy_dx + dy_dz * dy_dz) / (2 * eps)
}

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null!)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, SEGS, SEGS)
    geo.rotateX(-Math.PI / 2)
    const pos    = geo.attributes.position as THREE.BufferAttribute
    const colors: number[] = []
    const tmp    = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const y = terrainHeight(x, z)
      pos.setY(i, y)

      const slope = slopeAt(x, z)
      const t     = THREE.MathUtils.clamp((y + 2) / (MAX_HEIGHT + 2), 0, 1)

      let c: THREE.Color
      if (y < -0.8) {
        // underwater edge — dark greenish sand
        c = C_WATER_EDGE.clone().lerp(C_SAND, Math.min(1, (-y - 0.8) / 1.5))
      } else if (slope > 0.55) {
        // steep slope — rock / dirt
        c = C_ROCK.clone().lerp(C_DIRT, THREE.MathUtils.clamp((slope - 0.55) / 0.4, 0, 1))
      } else if (t > 0.78) {
        // very high — approaching snow cap
        c = C_HIGH_GRASS.clone().lerp(C_SNOW, THREE.MathUtils.clamp((t - 0.78) / 0.22, 0, 1))
      } else if (t > 0.45) {
        c = C_MID_GRASS.clone().lerp(C_HIGH_GRASS, (t - 0.45) / 0.33)
      } else {
        c = C_DEEP_GRASS.clone().lerp(C_MID_GRASS, t / 0.45)
      }

      // Subtle slope darkening
      tmp.copy(c).multiplyScalar(1 - slope * 0.35)
      colors.push(tmp.r, tmp.g, tmp.b)
    }

    pos.needsUpdate = true
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0.0}
        envMapIntensity={0.25}
      />
    </mesh>
  )
}

// ─── Distant mountain range — scale anchor ──────────────────
export function DistantMountains() {
  const peaks: { x: number; z: number; h: number; r: number }[] = [
    { x: -60,  z: -210, h: 55, r: 40 },
    { x:  20,  z: -230, h: 72, r: 50 },
    { x: 110,  z: -220, h: 48, r: 35 },
    { x: -140, z: -195, h: 38, r: 28 },
    { x:  170, z: -200, h: 42, r: 32 },
    { x: -200, z:  160, h: 32, r: 25 },
    { x:  200, z:  150, h: 28, r: 22 },
  ]
  return (
    <>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.h / 2 - 8, p.z]} castShadow>
          <coneGeometry args={[p.r, p.h, 7]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#3a5a40' : i % 3 === 1 ? '#4a6650' : '#5a7060'}
            roughness={0.95}
            metalness={0}
            envMapIntensity={0.1}
          />
        </mesh>
      ))}
    </>
  )
}

// ─── Ocean plane ─────────────────────────────────────────────
export function OceanPlane() {
  const meshRef = useRef<THREE.Mesh>(null!)
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
      <planeGeometry args={[WORLD_SIZE * 4, WORLD_SIZE * 4, 1, 1]} />
      <meshStandardMaterial
        color="#1a4a6e"
        roughness={0.08}
        metalness={0.3}
        transparent
        opacity={0.88}
        envMapIntensity={1.8}
      />
    </mesh>
  )
}
