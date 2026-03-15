/**
 * LakesideRetreat — Phase 2 | N District (z ≈ -280)
 *
 * Features:
 *  - Large glowing lake (r=32), animated teal water, sandy shore
 *  - Fishing dock: plank walkway extending over water, end post
 *  - Fishing bobber: small sphere that bobs in the water
 *  - Picnic blanket + 2 food items (mushroom, cake — emoji billboards)
 *  - Picnic basket (box + lid)
 *  - Reed clusters along shore: thin cylinders with fluffy tops
 *  - Soft teal point light under water surface (glow)
 *  - Dragonfly particles near water
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { terrainHeight } from './Terrain'

const LX = 0
const LZ = -280
const LAKE_R = 32

export function LakesideRetreat() {
  const baseY    = terrainHeight(LX, LZ)
  const waterRef = useRef<THREE.Mesh>(null!)
  const bobberRef= useRef<THREE.Mesh>(null!)
  const dfRef    = useRef<THREE.BufferAttribute>(null!)

  // Dragonfly particles
  const DF_COUNT = 16
  const dfBase   = useMemo(() => {
    const arr = new Float32Array(DF_COUNT * 3)
    for (let i = 0; i < DF_COUNT; i++) {
      const a = (i / DF_COUNT) * Math.PI * 2
      const r = LAKE_R * 0.5 + Math.random() * LAKE_R * 0.6
      arr[i * 3]     = LX + Math.cos(a) * r
      arr[i * 3 + 1] = baseY + 0.6 + Math.random() * 1.2
      arr[i * 3 + 2] = LZ + Math.sin(a) * r
    }
    return arr
  }, [baseY])
  const dfOffsets = useMemo(() =>
    Array.from({ length: DF_COUNT }, () => Math.random() * Math.PI * 2), []
  )
  const dfPositions = useMemo(() => new Float32Array(dfBase), [dfBase])

  // Reed positions around shore
  const reeds = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2 + 0.2
      const r = LAKE_R - 2 + (i % 3) * 1.5
      return {
        x: LX + Math.cos(a) * r,
        z: LZ + Math.sin(a) * r,
        h: 1.2 + (i % 4) * 0.3,
      }
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    // Animated lake water color
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshToonMaterial
      mat.color.setRGB(
        0.04 + 0.02 * Math.sin(t * 0.22),
        0.42 + 0.06 * Math.sin(t * 0.18 + 1.0),
        0.52 + 0.06 * Math.sin(t * 0.24 + 2.0),
      )
      mat.emissiveIntensity = 0.2 + 0.08 * Math.sin(t * 0.5)
    }

    // Fishing bobber bob
    if (bobberRef.current) {
      bobberRef.current.position.y = baseY + 0.12 + 0.06 * Math.sin(t * 1.8)
    }

    // Dragonfly drift
    if (dfRef.current) {
      const arr = dfRef.current.array as Float32Array
      for (let i = 0; i < DF_COUNT; i++) {
        arr[i * 3]     = dfBase[i * 3]     + Math.sin(t * 1.1 + dfOffsets[i]) * 3.5
        arr[i * 3 + 1] = dfBase[i * 3 + 1] + Math.sin(t * 1.6 + dfOffsets[i]) * 0.4
        arr[i * 3 + 2] = dfBase[i * 3 + 2] + Math.cos(t * 0.9 + dfOffsets[i]) * 3.5
      }
      dfRef.current.needsUpdate = true
    }
  })

  return (
    <group>
      {/* ─ Lake bed ─────────────────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LX, baseY - 0.35, LZ]}>
        <circleGeometry args={[LAKE_R + 2, 56]} />
        <meshToonMaterial color="#0a1824" />
      </mesh>

      {/* Sandy shore ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LX, baseY - 0.02, LZ]}>
        <ringGeometry args={[LAKE_R, LAKE_R + 4.5, 56]} />
        <meshToonMaterial color="#d4b880" />
      </mesh>

      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[LX, baseY + 0.08, LZ]}>
        <circleGeometry args={[LAKE_R, 56]} />
        <meshToonMaterial color="#0d6878" emissive="#054858"
          emissiveIntensity={0.2} transparent opacity={0.9} />
      </mesh>

      {/* Underwater glow */}
      <pointLight color="#40c8b8" intensity={5} distance={50} decay={2}
        position={[LX, baseY + 0.5, LZ]} />

      {/* ─ Fishing dock ─────────────────────────────────────── */}
      {/* Dock planks: 6 planks extending east into lake */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i}
          position={[LX + LAKE_R * 0.55 + i * 1.1, baseY + 0.18, LZ]}
          castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.14, 1.4]} />
          <meshToonMaterial color={i % 2 === 0 ? '#8a5530' : '#7a4a28'}
            emissive="#2a1808" emissiveIntensity={0.08} />
        </mesh>
      ))}
      {/* Dock side rails */}
      {[-0.65, 0.65].map((oz, ri) => (
        <mesh key={ri}
          position={[LX + LAKE_R * 0.55 + 2.75, baseY + 0.55, LZ + oz * 1.0]}
          castShadow>
          <boxGeometry args={[6.6, 0.1, 0.08]} />
          <meshToonMaterial color="#6a4020" />
        </mesh>
      ))}
      {/* Dock end post */}
      <mesh position={[LX + LAKE_R * 0.55 + 5.8, baseY + 0.7, LZ]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.0, 6]} />
        <meshToonMaterial color="#5a3018" />
      </mesh>

      {/* Fishing bobber */}
      <mesh ref={bobberRef} position={[LX + LAKE_R * 0.55 + 6.5, baseY + 0.12, LZ + 0.3]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshToonMaterial color="#ff3322" emissive="#cc1100" emissiveIntensity={0.5} />
      </mesh>

      {/* ─ Picnic area ───────────────────────────────────────── */}
      {/* Blanket */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}
        position={[LX - LAKE_R * 0.6, baseY + 0.04, LZ + LAKE_R * 0.55]}>
        <planeGeometry args={[3.0, 2.2]} />
        <meshToonMaterial color="#e8a0b0" />
      </mesh>
      {/* Blanket pattern stripes */}
      {[-0.55, 0, 0.55].map((ox, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
          position={[LX - LAKE_R * 0.6 + ox, baseY + 0.05, LZ + LAKE_R * 0.55]}>
          <planeGeometry args={[0.25, 2.15]} />
          <meshToonMaterial color={i % 2 === 0 ? '#d4607a' : '#f0b8c4'} />
        </mesh>
      ))}

      {/* Picnic basket */}
      <mesh position={[LX - LAKE_R * 0.6 + 1.2, baseY + 0.28, LZ + LAKE_R * 0.55 - 0.5]}
        castShadow>
        <boxGeometry args={[0.6, 0.45, 0.45]} />
        <meshToonMaterial color="#c8902a" emissive="#6a4010" emissiveIntensity={0.1} />
      </mesh>
      {/* Basket lid */}
      <mesh position={[LX - LAKE_R * 0.6 + 1.2, baseY + 0.56, LZ + LAKE_R * 0.55 - 0.5]}
        castShadow>
        <boxGeometry args={[0.64, 0.12, 0.48]} />
        <meshToonMaterial color="#b07820" />
      </mesh>

      {/* Food emoji billboards */}
      <Billboard position={[LX - LAKE_R * 0.6 - 0.5, baseY + 0.6, LZ + LAKE_R * 0.55]}>
        <Text fontSize={0.55} anchorX="center" anchorY="middle">🍰</Text>
      </Billboard>
      <Billboard position={[LX - LAKE_R * 0.6 + 0.3, baseY + 0.55, LZ + LAKE_R * 0.55 + 0.4]}>
        <Text fontSize={0.5} anchorX="center" anchorY="middle">☕</Text>
      </Billboard>

      {/* ─ Reeds ────────────────────────────────────────────── */}
      {reeds.map((r, i) => {
        const ry = terrainHeight(r.x, r.z)
        return (
          <group key={i} position={[r.x, ry, r.z]}>
            <mesh position={[0, r.h * 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, r.h, 5]} />
              <meshToonMaterial color="#5a7830" />
            </mesh>
            {/* Fluffy reed top */}
            <mesh position={[0, r.h + 0.15, 0]}>
              <cylinderGeometry args={[0.12, 0.08, 0.35, 6]} />
              <meshToonMaterial color="#8a6030" emissive="#4a3010" emissiveIntensity={0.15} />
            </mesh>
          </group>
        )
      })}

      {/* ─ Dragonflies ───────────────────────────────────────── */}
      <points>
        <bufferGeometry>
          <bufferAttribute ref={dfRef} attach="attributes-position"
            array={dfPositions} count={DF_COUNT} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.18} color="#44ddcc" transparent opacity={0.8}
          sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}
