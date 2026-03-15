/**
 * Lighting — Sky: Children of the Light
 *
 * Sky's signature look comes almost entirely from its lighting:
 *  - One warm directional sun (golden-orange, low angle)
 *  - Soft cool-blue ambient fill from above (sky dome bounce)
 *  - Subtle pink/peach hemisphere light (horizon glow)
 *  - No harsh shadows — shadowMap soft
 *  - Bloom-like feel via high emissiveIntensity on materials
 */
import * as THREE from 'three'

export function Lighting() {
  return (
    <>
      {/* Sky hemisphere: sky=warm peach, ground=cool sage */}
      <hemisphereLight
        args={['#ffe0b0', '#4a6a40', 1.2]}
      />

      {/* Main sun — warm golden, low angle (Sky's eternal golden hour) */}
      <directionalLight
        position={[80, 110, 60]}
        intensity={2.2}
        color="#ffcc88"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={220}
        shadow-camera-bottom={-220}
        shadow-bias={-0.0003}
        shadow-radius={4}
      />

      {/* Cool fill from opposite side — prevents pitch-black shadows */}
      <directionalLight
        position={[-60, 50, -80]}
        intensity={0.55}
        color="#aaccff"
      />

      {/* Horizon rim — warm pink glow on the edges (Sky's signature) */}
      <pointLight
        position={[0, -8, 0]}
        intensity={1.8}
        distance={320}
        decay={1.2}
        color="#ffaa66"
      />
    </>
  )
}
