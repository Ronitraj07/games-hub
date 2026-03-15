/**
 * CameraController — Orbital mouse/trackpad camera
 *
 * - Left-drag (or one-finger touch drag): orbit horizontally and vertically
 * - Scroll / pinch: zoom in/out
 * - Camera always looks at player head
 * - Vertical angle clamped: 8° to 72° (can't go underground or directly overhead)
 * - Zoom clamped: 6 to 60 units
 * - Touch: single-finger drag orbits, two-finger pinch zooms
 * - isometric-style default: azimuth 0, polar 40°, distance 28
 */
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const DEF_DISTANCE = 28
const DEF_POLAR    = Math.PI / 4.5   // ~40°
const DEF_AZIMUTH  = 0

const MIN_POLAR    = THREE.MathUtils.degToRad(8)
const MAX_POLAR    = THREE.MathUtils.degToRad(72)
const MIN_DISTANCE = 6
const MAX_DISTANCE = 60

const ORBIT_SPEED  = 0.005
const ZOOM_SPEED   = 0.12
const LERP_FACTOR  = 0.10
const LOOK_Y_OFFSET = 1.8   // look at player's chest/head height

interface Props {
  target: React.MutableRefObject<THREE.Vector3>
  /** Pass the canvas container div so we can attach pointer events to it */
  domRef: React.RefObject<HTMLDivElement>
}

export function CameraController({ target, domRef }: Props) {
  const { camera } = useThree()

  const azimuth  = useRef(DEF_AZIMUTH)
  const polar    = useRef(DEF_POLAR)
  const distance = useRef(DEF_DISTANCE)

  // Desired (smooth) camera position
  const desiredPos = useRef(new THREE.Vector3())

  // Drag state
  const dragging    = useRef(false)
  const lastMouse   = useRef({ x: 0, y: 0 })
  // Touch state
  const lastPinchDist = useRef<number | null>(null)

  useEffect(() => {
    const el = domRef.current
    if (!el) return

    // ── Mouse ────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        dragging.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
        el.style.cursor = 'grabbing'
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      lastMouse.current = { x: e.clientX, y: e.clientY }
      azimuth.current -= dx * ORBIT_SPEED
      polar.current    = THREE.MathUtils.clamp(polar.current + dy * ORBIT_SPEED, MIN_POLAR, MAX_POLAR)
    }
    const onMouseUp = () => { dragging.current = false; el.style.cursor = '' }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      distance.current = THREE.MathUtils.clamp(
        distance.current + e.deltaY * ZOOM_SPEED * 0.1,
        MIN_DISTANCE, MAX_DISTANCE,
      )
    }

    // ── Touch ────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        dragging.current = true
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if (e.touches.length === 2) {
        dragging.current = false
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDist.current = Math.hypot(dx, dy)
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - lastMouse.current.x
        const dy = e.touches[0].clientY - lastMouse.current.y
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        azimuth.current -= dx * ORBIT_SPEED * 1.4
        polar.current    = THREE.MathUtils.clamp(polar.current + dy * ORBIT_SPEED * 1.4, MIN_POLAR, MAX_POLAR)
      } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
        const dx   = e.touches[0].clientX - e.touches[1].clientX
        const dy   = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        const delta = lastPinchDist.current - dist
        distance.current = THREE.MathUtils.clamp(
          distance.current + delta * ZOOM_SPEED * 0.08,
          MIN_DISTANCE, MAX_DISTANCE,
        )
        lastPinchDist.current = dist
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) { dragging.current = false; lastPinchDist.current = null }
      if (e.touches.length === 1) { lastPinchDist.current = null }
    }

    el.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    el.addEventListener('wheel',      onWheel,      { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)
    el.addEventListener('contextmenu', (e) => e.preventDefault())

    return () => {
      el.removeEventListener('mousedown',  onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
      el.removeEventListener('wheel',      onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [domRef])

  useFrame(() => {
    const t   = target.current
    const az  = azimuth.current
    const po  = polar.current
    const d   = distance.current

    // Spherical → Cartesian offset from player
    desiredPos.current.set(
      t.x + d * Math.sin(po) * Math.sin(az),
      t.y + d * Math.cos(po),
      t.z + d * Math.sin(po) * Math.cos(az),
    )

    camera.position.lerp(desiredPos.current, LERP_FACTOR)
    camera.lookAt(t.x, t.y + LOOK_Y_OFFSET, t.z)
  })

  return null
}
