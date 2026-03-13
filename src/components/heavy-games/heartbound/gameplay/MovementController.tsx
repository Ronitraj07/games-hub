/**
 * MovementController — Camera-relative WASD
 *
 * Movement is always relative to the CAMERA facing direction, not the character.
 * This means:
 *   W = move away from camera (into screen)
 *   S = move toward camera (toward viewer)
 *   A = strafe left relative to camera
 *   D = strafe right relative to camera
 *
 * The CHARACTER then rotates to face the direction of movement.
 * Pressing S does NOT make the character face the camera — it walks backward
 * OR you can configure it to face movement direction (standard in most games).
 */
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

const MOVE_SPEED  = 0.09
const WORLD_SIZE  = 48
const POND_RADIUS = 3.8

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
  keysRef:    React.MutableRefObject<Set<string>>
  posRef:     React.MutableRefObject<THREE.Vector3>
  movingRef:  React.MutableRefObject<boolean>
  facingRef:  React.MutableRefObject<number>
  onPublish:  (x: number, z: number, moving: boolean) => void
  blockedRef: React.MutableRefObject<boolean>
}

export function MovementController({
  keysRef, posRef, movingRef, facingRef, onPublish, blockedRef,
}: Props) {
  const { camera } = useThree()

  useFrame(() => {
    if (blockedRef.current) { movingRef.current = false; return }
    const k = keysRef.current

    // Raw input: which keys are held
    const fwd  = k.has('ArrowUp')    || k.has('w') || k.has('W')  // into screen
    const back = k.has('ArrowDown')  || k.has('s') || k.has('S')  // toward viewer
    const left = k.has('ArrowLeft')  || k.has('a') || k.has('A')
    const rght = k.has('ArrowRight') || k.has('d') || k.has('D')

    if (!fwd && !back && !left && !rght) {
      movingRef.current = false
      return
    }

    // Get camera's flat (XZ) forward and right vectors
    const camFwd   = new THREE.Vector3()
    const camRight = new THREE.Vector3()
    camera.getWorldDirection(camFwd)
    camFwd.y = 0
    camFwd.normalize()
    camRight.crossVectors(camFwd, new THREE.Vector3(0, 1, 0)).normalize()

    // Build movement vector in camera space
    const move = new THREE.Vector3()
    if (fwd)  move.addScaledVector(camFwd,    1)
    if (back) move.addScaledVector(camFwd,   -1)
    if (left) move.addScaledVector(camRight, -1)
    if (rght) move.addScaledVector(camRight,  1)
    move.normalize().multiplyScalar(MOVE_SPEED)

    movingRef.current = true

    // Character faces movement direction
    facingRef.current = Math.atan2(move.x, move.z)

    // Apply movement
    const np   = posRef.current.clone().add(move)
    const half = WORLD_SIZE / 2 - 2
    np.x = Math.max(-half, Math.min(half, np.x))
    np.z = Math.max(-half, Math.min(half, np.z))
    if (Math.hypot(np.x, np.z) < POND_RADIUS) return // blocked by pond
    np.y = terrainY(np.x, np.z)
    posRef.current.copy(np)
    onPublish(np.x, np.z, true)
  })

  return null
}
