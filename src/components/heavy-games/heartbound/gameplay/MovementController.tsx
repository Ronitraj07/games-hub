/**
 * MovementController — Camera-relative WASD + Shift to sprint
 *
 * v2 changes:
 *  - terrainY replaced with imported terrainHeight (new noise-driven terrain)
 *  - WORLD_SIZE / pond constants replaced by moveBound + pondRadius props
 *  - moveBound defaults to 190 (matches 400×400 island boundary)
 *  - pondRadius defaults to 14 (matches new Pond component)
 *  - Ghost movement fixes preserved
 */
import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { terrainHeight } from '../world/Terrain'

const MOVE_SPEED_WALK = 0.12
const MOVE_SPEED_RUN  = 0.26

interface Props {
  keysRef:      React.MutableRefObject<Set<string>>
  posRef:       React.MutableRefObject<THREE.Vector3>
  movingRef:    React.MutableRefObject<boolean>
  facingRef:    React.MutableRefObject<number>
  sprintingRef: React.MutableRefObject<boolean>
  onPublish:    (x: number, z: number, moving: boolean, sprinting: boolean) => void
  blockedRef:   React.MutableRefObject<boolean>
  /** Island boundary — player clamped to ±moveBound. Default 190. */
  moveBound?:   number
  /** Pond block radius. Default 14. */
  pondRadius?:  number
}

export function MovementController({
  keysRef, posRef, movingRef, facingRef, sprintingRef,
  onPublish, blockedRef,
  moveBound  = 190,
  pondRadius = 14,
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

    const k = keysRef.current
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
    np.x = Math.max(-moveBound, Math.min(moveBound, np.x))
    np.z = Math.max(-moveBound, Math.min(moveBound, np.z))

    // Pond block — prevent walking into the pond center
    if (Math.hypot(np.x, np.z - 10) < pondRadius * 0.55) {
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
