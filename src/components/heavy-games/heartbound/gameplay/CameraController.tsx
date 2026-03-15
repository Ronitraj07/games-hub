/**
 * CameraController — Mouse-move driven orbital camera (no click required)
 *
 * Desktop:
 *  - Moving mouse left/right  → rotates camera horizontally (azimuth)
 *  - Moving mouse up/down     → rotates camera vertically (polar angle)
 *  - Scroll wheel             → zoom in/out
 *  - Mouse is confined to the canvas area via pointer lock on click
 *    (or falls back to edge-based tracking if pointer lock is unavailable)
 *
 * Touch:
 *  - Single finger drag       → orbit
 *  - Two-finger pinch         → zoom
 *
 * TPP defaults:
 *  - Distance: 7 units (tight 3rd-person over-shoulder)
 *  - Polar: 18° (almost horizontal, looking slightly down at player)
 *  - Azimuth: 0 (behind player)
 *
 * Bounds:
 *  - Vertical: 4° – 70°
 *  - Zoom: 3 – 55 units
 */
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── TPP defaults ─────────────────────────────────────────────────────────────
const DEF_DISTANCE = 7          // tight TPP
const DEF_POLAR    = THREE.MathUtils.degToRad(18)  // low angle = eye-level
const DEF_AZIMUTH  = Math.PI    // behind player (player faces +Z by default)

const MIN_POLAR    = THREE.MathUtils.degToRad(4)
const MAX_POLAR    = THREE.MathUtils.degToRad(70)
const MIN_DISTANCE = 3
const MAX_DISTANCE = 55

// How fast mouse movement rotates the camera
const MOUSE_SENSITIVITY = 0.0022
const SCROLL_SENSITIVITY = 0.008
const LERP_FACTOR        = 0.12
const LOOK_Y_OFFSET      = 1.6   // look at player chest height

interface Props {
  target: React.MutableRefObject<THREE.Vector3>
  domRef: React.RefObject<HTMLDivElement>
}

export function CameraController({ target, domRef }: Props) {
  const { camera } = useThree()

  const azimuth  = useRef(DEF_AZIMUTH)
  const polar    = useRef(DEF_POLAR)
  const distance = useRef(DEF_DISTANCE)
  const desired  = useRef(new THREE.Vector3())

  // Track if pointer is inside the canvas
  const pointerInside = useRef(false)
  // Pointer lock availability
  const locked = useRef(false)

  useEffect(() => {
    const el = domRef.current
    if (!el) return

    // ── Pointer lock ────────────────────────────────────────────────
    const onLockChange = () => {
      locked.current = document.pointerLockElement === el
    }
    document.addEventListener('pointerlockchange', onLockChange)

    // Click canvas → request pointer lock (hides cursor, gives raw deltas)
    const onClick = () => {
      if (!document.pointerLockElement) {
        el.requestPointerLock?.().catch?.(() => {})
      }
    }
    el.addEventListener('click', onClick)

    // ESC releases pointer lock automatically by browser; we just track state
    // We also release when menu opens (handled externally via blur)

    // ── Mouse move ────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      // Use movementX/Y when pointer is locked (most accurate)
      // Fall back to plain mouse move when pointer is inside canvas (no lock)
      let dx = 0, dy = 0
      if (locked.current) {
        dx = e.movementX
        dy = e.movementY
      } else if (pointerInside.current) {
        dx = e.movementX
        dy = e.movementY
      }
      if (dx === 0 && dy === 0) return
      azimuth.current -= dx * MOUSE_SENSITIVITY
      polar.current    = THREE.MathUtils.clamp(
        polar.current + dy * MOUSE_SENSITIVITY,
        MIN_POLAR, MAX_POLAR,
      )
    }

    const onPointerEnter = () => { pointerInside.current = true }
    const onPointerLeave = () => { pointerInside.current = false }

    // ── Scroll ─────────────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      distance.current = THREE.MathUtils.clamp(
        distance.current + e.deltaY * SCROLL_SENSITIVITY,
        MIN_DISTANCE, MAX_DISTANCE,
      )
    }

    // ── Touch ─────────────────────────────────────────────────────────────
    const lastTouch      = useRef_local({ x: 0, y: 0 })
    const lastPinchDist  = useRef_local<number | null>(null)
    let _lastTouch       = { x: 0, y: 0 }
    let _lastPinchDist: number | null = null
    let _touching        = false

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        _touching = true
        _lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if (e.touches.length === 2) {
        _touching = false
        _lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && _touching) {
        const dx = e.touches[0].clientX - _lastTouch.x
        const dy = e.touches[0].clientY - _lastTouch.y
        _lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        azimuth.current -= dx * MOUSE_SENSITIVITY * 1.5
        polar.current    = THREE.MathUtils.clamp(
          polar.current + dy * MOUSE_SENSITIVITY * 1.5,
          MIN_POLAR, MAX_POLAR,
        )
      } else if (e.touches.length === 2 && _lastPinchDist !== null) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        distance.current = THREE.MathUtils.clamp(
          distance.current + (_lastPinchDist - d) * 0.05,
          MIN_DISTANCE, MAX_DISTANCE,
        )
        _lastPinchDist = d
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) { _touching = false; _lastPinchDist = null }
      if (e.touches.length === 1) { _lastPinchDist = null }
    }

    el.addEventListener('pointerenter', onPointerEnter)
    el.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('mousemove',  onMouseMove)
    el.addEventListener('wheel',         onWheel,      { passive: false })
    el.addEventListener('touchstart',    onTouchStart, { passive: false })
    el.addEventListener('touchmove',     onTouchMove,  { passive: false })
    el.addEventListener('touchend',      onTouchEnd)
    el.addEventListener('contextmenu',   (e) => e.preventDefault())

    return () => {
      document.removeEventListener('pointerlockchange', onLockChange)
      el.removeEventListener('click',        onClick)
      el.removeEventListener('pointerenter', onPointerEnter)
      el.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('mousemove',  onMouseMove)
      el.removeEventListener('wheel',          onWheel)
      el.removeEventListener('touchstart',     onTouchStart)
      el.removeEventListener('touchmove',      onTouchMove)
      el.removeEventListener('touchend',       onTouchEnd)
    }
  }, [domRef])

  useFrame(() => {
    const t  = target.current
    const az = azimuth.current
    const po = polar.current
    const d  = distance.current

    desired.current.set(
      t.x + d * Math.sin(po) * Math.sin(az),
      t.y + d * Math.cos(po),
      t.z + d * Math.sin(po) * Math.cos(az),
    )
    camera.position.lerp(desired.current, LERP_FACTOR)
    camera.lookAt(t.x, t.y + LOOK_Y_OFFSET, t.z)
  })

  return null
}

// tiny inline ref helper to avoid hook-in-callback lint error
function useRef_local<T>(init: T) { return { current: init } }
