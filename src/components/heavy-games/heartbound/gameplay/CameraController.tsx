/**
 * CameraController — Clean rewrite
 *
 * Behaviour:
 *  - RIGHT-click drag (or middle-click drag) → orbit camera
 *    This is the standard in every 3D game/editor (Blender, Unity, Genshin)
 *    It avoids the "mouse moves freely but also controls camera" confusion
 *    that made the previous version feel glitchy.
 *  - Scroll wheel → zoom
 *  - Touch single-finger drag → orbit
 *  - Touch two-finger pinch → zoom
 *
 * Why right-click instead of free mouse-move:
 *  Free mouse-move requires pointer lock which has browser quirks:
 *  it only activates after a user gesture, ESC releases it, and the
 *  sudden cursor disappearance feels jarring. Right-drag is framerate-
 *  independent, works on all devices, and feels natural.
 *
 * TPP defaults:
 *  distance = 8u, polar = 25° (slight downward look), azimuth = π (behind)
 */
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const DEF_DISTANCE = 8
const DEF_POLAR    = THREE.MathUtils.degToRad(25)
const DEF_AZIMUTH  = Math.PI

const MIN_POLAR    = THREE.MathUtils.degToRad(5)
const MAX_POLAR    = THREE.MathUtils.degToRad(75)
const MIN_DIST     = 3
const MAX_DIST     = 60

const DRAG_SENSITIVITY   = 0.006
const TOUCH_SENSITIVITY  = 0.007
const SCROLL_SENSITIVITY = 0.006
const CAMERA_LERP        = 0.14
const LOOK_Y_OFFSET      = 1.6

interface Props {
  target: React.MutableRefObject<THREE.Vector3>
  domRef: React.RefObject<HTMLDivElement>
}

export function CameraController({ target, domRef }: Props) {
  const { camera } = useThree()

  // These are plain refs — mutated in event handlers, read in useFrame
  const azimuth  = useRef(DEF_AZIMUTH)
  const polar    = useRef(DEF_POLAR)
  const distance = useRef(DEF_DISTANCE)
  const desired  = useRef(new THREE.Vector3())

  // Drag state — lives entirely outside React state to avoid re-renders
  const dragging   = useRef(false)
  const lastX      = useRef(0)
  const lastY      = useRef(0)

  // Touch state
  const t1         = useRef({ x: 0, y: 0 })
  const t2         = useRef({ x: 0, y: 0 })
  const pinchDist  = useRef(0)
  const touching   = useRef(false)
  const pinching   = useRef(false)

  useEffect(() => {
    const el = domRef.current
    if (!el) return

    // ── Mouse ───────────────────────────────────────────────────
    // Right-click (button 2) or middle-click (button 1) starts drag
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        e.preventDefault()
        dragging.current = true
        lastX.current    = e.clientX
        lastY.current    = e.clientY
        el.style.cursor  = 'grabbing'
      }
    }

    // Listen on window so drag works even if mouse leaves canvas
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      const dy = e.clientY - lastY.current
      lastX.current = e.clientX
      lastY.current = e.clientY
      azimuth.current -= dx * DRAG_SENSITIVITY
      polar.current = THREE.MathUtils.clamp(
        polar.current + dy * DRAG_SENSITIVITY,
        MIN_POLAR, MAX_POLAR,
      )
    }

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) {
        dragging.current = false
        el.style.cursor  = ''
      }
    }

    // ── Scroll ───────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Normalise delta: trackpads give small values, wheels give ~100
      const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 60)
      distance.current = THREE.MathUtils.clamp(
        distance.current + delta * SCROLL_SENSITIVITY,
        MIN_DIST, MAX_DIST,
      )
    }

    // ── Touch ───────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touching.current = true
        pinching.current = false
        t1.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      } else if (e.touches.length === 2) {
        touching.current = false
        pinching.current = true
        t1.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        t2.current = { x: e.touches[1].clientX, y: e.touches[1].clientY }
        pinchDist.current = Math.hypot(
          t1.current.x - t2.current.x,
          t1.current.y - t2.current.y,
        )
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1 && touching.current) {
        const nx = e.touches[0].clientX
        const ny = e.touches[0].clientY
        const dx = nx - t1.current.x
        const dy = ny - t1.current.y
        t1.current = { x: nx, y: ny }
        azimuth.current -= dx * TOUCH_SENSITIVITY
        polar.current = THREE.MathUtils.clamp(
          polar.current + dy * TOUCH_SENSITIVITY,
          MIN_POLAR, MAX_POLAR,
        )
      } else if (e.touches.length === 2 && pinching.current) {
        const nx1 = e.touches[0].clientX, ny1 = e.touches[0].clientY
        const nx2 = e.touches[1].clientX, ny2 = e.touches[1].clientY
        const newDist = Math.hypot(nx1 - nx2, ny1 - ny2)
        const delta   = pinchDist.current - newDist
        pinchDist.current = newDist
        t1.current = { x: nx1, y: ny1 }
        t2.current = { x: nx2, y: ny2 }
        distance.current = THREE.MathUtils.clamp(
          distance.current + delta * 0.04,
          MIN_DIST, MAX_DIST,
        )
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touching.current = false
        pinching.current = false
      } else if (e.touches.length === 1) {
        pinching.current = false
        touching.current = true
        t1.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    // Suppress context menu on right-click inside canvas
    const onContextMenu = (e: Event) => e.preventDefault()

    el.addEventListener('mousedown',   onMouseDown)
    el.addEventListener('wheel',       onWheel,      { passive: false })
    el.addEventListener('touchstart',  onTouchStart, { passive: false })
    el.addEventListener('touchmove',   onTouchMove,  { passive: false })
    el.addEventListener('touchend',    onTouchEnd)
    el.addEventListener('contextmenu', onContextMenu)
    // mousemove + mouseup on window so drag continues outside canvas
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)

    return () => {
      el.removeEventListener('mousedown',   onMouseDown)
      el.removeEventListener('wheel',       onWheel)
      el.removeEventListener('touchstart',  onTouchStart)
      el.removeEventListener('touchmove',   onTouchMove)
      el.removeEventListener('touchend',    onTouchEnd)
      el.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [domRef])

  useFrame(() => {
    const t  = target.current
    const az = azimuth.current
    const po = polar.current
    const d  = distance.current

    // Spherical coordinates → world offset from player
    desired.current.set(
      t.x + d * Math.sin(po) * Math.sin(az),
      t.y + d * Math.cos(po) + 0.5,
      t.z + d * Math.sin(po) * Math.cos(az),
    )

    camera.position.lerp(desired.current, CAMERA_LERP)
    camera.lookAt(t.x, t.y + LOOK_Y_OFFSET, t.z)
  })

  return null
}
