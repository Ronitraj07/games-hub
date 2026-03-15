/**
 * Lighting — upgraded for larger world
 * - Main sun: higher position, wider shadow camera to cover 400u world
 * - Fill light: softer blue from opposite side
 * - Hemisphere: warm sky / cool ground
 * - Point lights: campfire, pond glow
 */
import { useRef } from 'react'
import * as THREE from 'three'

export function Lighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null!)

  return (
    <>
      <ambientLight intensity={0.50} color="#ffe8cc" />

      {/* Main sun */}
      <directionalLight
        ref={sunRef}
        position={[80, 120, 40]}
        intensity={2.5}
        color="#ffe890"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={600}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />

      {/* Fill — cool blue opposite sun */}
      <directionalLight position={[-60, 30, -60]} intensity={0.35} color="#a0c0f0" />

      {/* Back rim — subtle warm */}
      <directionalLight position={[0, 20, 80]} intensity={0.20} color="#ffcc88" />

      {/* Hemisphere — sky vs ground */}
      <hemisphereLight args={['#b0e8d0', '#2a4a20', 0.45]} />

      {/* Pond glow */}
      <pointLight position={[0, 3, 10]} intensity={1.2} color="#60d0f0" distance={30} decay={2} />

      {/* Campfire glow — near spawn */}
      <pointLight position={[20, 2, 20]} intensity={1.8} color="#ff8833" distance={18} decay={2} />
    </>
  )
}
