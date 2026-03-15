/**
 * MovementController — Camera-relative WASD + Shift to sprint
 *
 * Ghost movement fixes:
 *  - keysRef cleared on window blur + visibilitychange (tab switch / alt-tab)
 *  - Shift stuck key: check both 'Shift', 'ShiftLeft', 'ShiftRight' on keydown
 *    AND clear all three variants on keyup
 *  - Pond block no longer skips onPublish (was leaving movingRef=true)
 */
import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

const MOVE_SPEED_WALK = 0.09
const MOVE_SPEED_RUN  = 0.18
const WORLD_SIZE      = 48
const POND_RADIUS     = 3.8

function terrainY(x: number, z: number): number {
  return (
    Math.sin(x * 0.28) * 1.2 +
    Math.cos(z * 0.22) * 1.0 +
    Math.sin((x + z) * 0.13) * 0.7 +
    Math.sin(x * 0.6 + 1.2) * 0.3 +
    Math.cos(z * 0.5 - 0.8) * 0.25
  )
}

interface Props {
  keysRef:      React.MutableRefObject<Set<string>>
  posRef:       React.MutableRefObject<THREE.Vector3>
  movingRef:    React.MutableRefObject<boolean>
  facingRef:    React.MutableRefObject<number>
  sprintingRef: React.MutableRefObject<boolean>
  onPublish:    (x: number, z: number, moving: boolean, sprinting: boolean) => void
  blockedRef:   React.MutableRefObject<boolean>
}

export function MovementController({
  keysRef, posRef, movingRef, facingRef, sprintingRef, onPublish, blockedRef,
}: Props) {
  const { camera } = useThree()

  // Clear all held keys on any focus loss — prevents ghost movement
  useEffect(() => {
    const clear = () => keysRef.current.clear()
    window.addEventListener('blur',              clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      window.removeEventListener('blur',              clear)
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

    const np   = posRef.current.clone().add(move)
    const half = WORLD_SIZE / 2 - 2
    np.x = Math.max(-half, Math.min(half, np.x))
    np.z = Math.max(-half, Math.min(half, np.z))

    // Pond block — still mark as not moving so animation stops
    if (Math.hypot(np.x, np.z) < POND_RADIUS) {
      movingRef.current    = false
      sprintingRef.current = false
      onPublish(posRef.current.x, posRef.current.z, false, false)
      return
    }

    np.y = terrainY(np.x, np.z)
    posRef.current.copy(np)
    movingRef.current = true
    onPublish(np.x, np.z, true, sprint)
  })

  return null
}
