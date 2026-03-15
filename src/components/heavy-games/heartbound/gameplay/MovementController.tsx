/**
 * MovementController — Phase 1
 *
 * Changes from v2:
 *  - moveBound default: 190 →  490 (matches 1000×1000 world)
 *  - Pond block updated: meadow pond stays at (0,10), lakeside lake at (0,-280)
 *  - Sprint speed bumped slightly (world is bigger, walking felt slow)
 *  - getDistrict() exported — used by NPC placement, activity system, minimap
 */
import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { terrainHeight } from '../world/Terrain'

const MOVE_SPEED_WALK = 0.14   // slightly faster — world is 6× bigger
const MOVE_SPEED_RUN  = 0.32

/**
 * District enum — used by activity system, minimap, NPC placement
 */
export type District =
  | 'meadow'
  | 'market'
  | 'flowers'
  | 'ruins'
  | 'cliffside'
  | 'lakeside'
  | 'unknown'

/**
 * getDistrict(x, z) — returns which district a world position is in.
 * Matches the layout defined in Terrain.tsx comments.
 */
export function getDistrict(x: number, z: number): District {
  // Meadow Core — center circle r < 130
  if (Math.sqrt(x * x + z * z) < 130) return 'meadow'
  // Cliffside NW
  if (x < -80 && z < -80)  return 'cliffside'
  // Ancient Ruins NE
  if (x > 80  && z < -80)  return 'ruins'
  // Flower Fields SE
  if (x > 80  && z > 80)   return 'flowers'
  // Market Village SW
  if (x < -80 && z > 80)   return 'market'
  // Lakeside Retreat N (z < -80, |x| < 220)
  if (z < -80 && Math.abs(x) < 220) return 'lakeside'
  return 'unknown'
}

interface Props {
  keysRef:      React.MutableRefObject<Set<string>>
  posRef:       React.MutableRefObject<THREE.Vector3>
  movingRef:    React.MutableRefObject<boolean>
  facingRef:    React.MutableRefObject<number>
  sprintingRef: React.MutableRefObject<boolean>
  onPublish:    (x: number, z: number, moving: boolean, sprinting: boolean) => void
  blockedRef:   React.MutableRefObject<boolean>
  /** Island boundary — player clamped to ±moveBound. Default 490. */
  moveBound?:   number
  /** Meadow pond block radius. Default 14. */
  pondRadius?:  number
  /** Lakeside lake block radius. Default 32. */
  lakeRadius?:  number
}

export function MovementController({
  keysRef, posRef, movingRef, facingRef, sprintingRef,
  onPublish, blockedRef,
  moveBound  = 490,
  pondRadius = 14,
  lakeRadius = 32,
}: Props) {
  const { camera } = useThree()

  useEffect(() => {
    const clear = () => keysRef.current.clear()
    window.addEventListener('blur',               clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      window.removeEventListener('blur',               clear)
      document.removeEventListener('visibilitychange', clear)
    }
  }, [keysRef])

  useFrame(() => {
    if (blockedRef.current) {
      movingRef.current    = false
      sprintingRef.current = false
      return
    }

    const k      = keysRef.current
    const fwd    = k.has('ArrowUp')    || k.has('w') || k.has('W')
    const back   = k.has('ArrowDown')  || k.has('s') || k.has('S')
    const left   = k.has('ArrowLeft')  || k.has('a') || k.has('A')
    const rght   = k.has('ArrowRight') || k.has('d') || k.has('D')
    const sprint = k.has('Shift') || k.has('ShiftLeft') || k.has('ShiftRight')

    if (!fwd && !back && !left && !rght) {
      movingRef.current    = false
      sprintingRef.current = false
      onPublish(posRef.current.x, posRef.current.z, false, false)
      return
    }

    const speed = sprint ? MOVE_SPEED_RUN : MOVE_SPEED_WALK
    sprintingRef.current = sprint

    const camFwd   = new THREE.Vector3()
    const camRight = new THREE.Vector3()
    camera.getWorldDirection(camFwd)
    camFwd.y = 0
    camFwd.normalize()
    camRight.crossVectors(camFwd, new THREE.Vector3(0, 1, 0)).normalize()

    const move = new THREE.Vector3()
    if (fwd)  move.addScaledVector(camFwd,    1)
    if (back) move.addScaledVector(camFwd,   -1)
    if (left) move.addScaledVector(camRight, -1)
    if (rght) move.addScaledVector(camRight,  1)
    move.normalize().multiplyScalar(speed)

    facingRef.current = Math.atan2(move.x, move.z)

    const np = posRef.current.clone().add(move)

    // ─ World boundary ───────────────────────────────────────────────
    np.x = Math.max(-moveBound, Math.min(moveBound, np.x))
    np.z = Math.max(-moveBound, Math.min(moveBound, np.z))

    // ─ Meadow pond block (center 0, 10) ─────────────────────────────
    if (Math.hypot(np.x, np.z - 10) < pondRadius * 0.55) {
      movingRef.current    = false
      sprintingRef.current = false
      onPublish(posRef.current.x, posRef.current.z, false, false)
      return
    }

    // ─ Lakeside lake block (center 0, -280) ─────────────────────────
    if (Math.hypot(np.x, np.z + 280) < lakeRadius * 0.6) {
      movingRef.current    = false
      sprintingRef.current = false
      onPublish(posRef.current.x, posRef.current.z, false, false)
      return
    }

    np.y = terrainHeight(np.x, np.z)
    posRef.current.copy(np)
    movingRef.current = true
    onPublish(np.x, np.z, true, sprint)
  })

  return null
}
