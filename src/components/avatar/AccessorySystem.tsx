import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AccessoryId } from '../../types/accessories'

interface Props {
  equipped: AccessoryId[]
  position: THREE.Vector3
  bondLevel: number
}

// ── Sakura Petals ────────────────────────────────────────────────────────────
const SakuraPetals = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Points>(null)
  const count = 20
  const positions = useRef(new Float32Array(count * 3))
  const angles = useRef(new Float32Array(count))
  const speeds = useRef(new Float32Array(count))

  // Init random positions around character
  if (angles.current[0] === 0) {
    for (let i = 0; i < count; i++) {
      angles.current[i] = Math.random() * Math.PI * 2
      speeds.current[i] = 0.3 + Math.random() * 0.5
      positions.current[i * 3 + 1] = Math.random() * 2 // height
    }
  }

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    for (let i = 0; i < count; i++) {
      const angle = angles.current[i] + t * speeds.current[i] * 0.3
      const radius = 0.6 + Math.sin(t * speeds.current[i] + i) * 0.2
      positions.current[i * 3]     = position.x + Math.cos(angle) * radius
      positions.current[i * 3 + 1] = position.y + 0.5 + ((positions.current[i * 3 + 1] - position.y + 0.02) % 2)
      positions.current[i * 3 + 2] = position.z + Math.sin(angle) * radius
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffb7c5" size={0.04} transparent opacity={0.85} depthWrite={false} />
    </points>
  )
}

// ── Sparkle Aura ─────────────────────────────────────────────────────────────
const SparkleAura = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Points>(null)
  const count = 30
  const positions = useRef(new Float32Array(count * 3))
  const offsets = useRef(new Float32Array(count))

  if (offsets.current[0] === 0) {
    for (let i = 0; i < count; i++) {
      offsets.current[i] = Math.random() * Math.PI * 2
    }
  }

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    for (let i = 0; i < count; i++) {
      const angle = offsets.current[i] + t * 0.4
      const radius = 0.5 + Math.sin(t * 1.2 + i) * 0.3
      const height = Math.sin(t * 0.8 + offsets.current[i]) * 1.0
      positions.current[i * 3]     = position.x + Math.cos(angle) * radius
      positions.current[i * 3 + 1] = position.y + 1.0 + height
      positions.current[i * 3 + 2] = position.z + Math.sin(angle) * radius
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffe066" size={0.05} transparent opacity={0.9} depthWrite={false} />
    </points>
  )
}

// ── Butterfly Companions ──────────────────────────────────────────────────────
const ButterflyCompanions = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Points>(null)
  const count = 2
  const positions = useRef(new Float32Array(count * 3))

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    // Butterfly 1
    positions.current[0] = position.x + Math.cos(t * 0.8) * 0.9
    positions.current[1] = position.y + 1.2 + Math.sin(t * 2) * 0.15
    positions.current[2] = position.z + Math.sin(t * 0.8) * 0.9
    // Butterfly 2
    positions.current[3] = position.x + Math.cos(t * 0.8 + Math.PI) * 0.9
    positions.current[4] = position.y + 1.4 + Math.sin(t * 2 + 1) * 0.15
    positions.current[5] = position.z + Math.sin(t * 0.8 + Math.PI) * 0.9
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#a78bfa" size={0.12} transparent opacity={1} depthWrite={false} />
    </points>
  )
}

// ── Heart Trail ───────────────────────────────────────────────────────────────
const HeartTrail = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.Points>(null)
  const count = 8
  const positions = useRef(new Float32Array(count * 3))
  const offsets = useRef(Array.from({ length: count }, (_, i) => i * (1 / count)))

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    for (let i = 0; i < count; i++) {
      const phase = (offsets.current[i] + t * 0.3) % 1
      positions.current[i * 3]     = position.x + (Math.random() - 0.5) * 0.3
      positions.current[i * 3 + 1] = position.y + phase * 2
      positions.current[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.3
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#f472b6" size={0.07} transparent opacity={0.8} depthWrite={false} />
    </points>
  )
}

// ── Golden Glow ───────────────────────────────────────────────────────────────
const GoldenGlow = ({ position }: { position: THREE.Vector3 }) => {
  const ref = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.set(position.x, position.y + 1, position.z)
    ref.current.intensity = 1.5 + Math.sin(t * 2) * 0.5
  })

  return <pointLight ref={ref} color="#ffd700" intensity={1.5} distance={3} />
}

// ── Main AccessorySystem ──────────────────────────────────────────────────────
export const AccessorySystem = ({ equipped, position, bondLevel }: Props) => {
  if (!equipped.length) return null

  return (
    <>
      {equipped.includes('sakura_petals') && bondLevel >= 1 && (
        <SakuraPetals position={position} />
      )}
      {equipped.includes('sparkle_aura') && bondLevel >= 5 && (
        <SparkleAura position={position} />
      )}
      {equipped.includes('butterfly_companions') && bondLevel >= 10 && (
        <ButterflyCompanions position={position} />
      )}
      {equipped.includes('heart_trail') && bondLevel >= 20 && (
        <HeartTrail position={position} />
      )}
      {equipped.includes('golden_glow') && bondLevel >= 30 && (
        <GoldenGlow position={position} />
      )}
    </>
  )
}
