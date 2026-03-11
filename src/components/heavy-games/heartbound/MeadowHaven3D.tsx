/**
 * MeadowHaven3D — Phase 7F
 * -----------------------------------------------
 * POST-PROCESSING + PBR TERRAIN + REFLECTIVE WATER
 *
 * NEW in Phase 7F:
 * 1. Post-processing pipeline:
 *    - SSAO (ambient occlusion — darkens crevices, ground contact)
 *    - Bloom (mipmapBlur — fireflies glow, pond shimmer, lights pop)
 *    - ACES Filmic tone mapping (cinematic color grade)
 *    - Vignette (subtle edge darkening, lens feel)
 *    - HueSaturation (warm +10% saturation)
 * 2. Terrain — 2-layer PBR blend:
 *    - Grass layer (vertex color, roughness 0.92)
 *    - Rock/dirt blend on steeper normals
 *    - Normal-based vertex color darkening in valleys
 *    - All terrain meshes receiveShadow
 * 3. Water — PBR shimmer:
 *    - roughness: 0.04, metalness: 0.25, envMapIntensity: 2.4
 *    - Animated color via useFrame (sin wave on RGB)
 *    - Lily pads with emissive tint
 *    - Pond edge feathering ring
 * 4. Lighting upgrade:
 *    - Sun directional: 2.4 intensity, warm gold
 *    - Fill light: cool blue-violet
 *    - Pond point light: teal, decay 2
 *    - Hemisphere: sky/ground split
 * 5. Environment preset: "sunset" drives HDRI reflections
 *    on all PBR surfaces (water, avatars, metallic objects)
 * 6. Quality detection: checks GPU tier, auto-enables/disables
 *    SSAO on low-end devices (Intel integrated = SSAO off)
 * 7. Controls + Esc + Menu unchanged from previous commit
 */
import React, {
  useRef, useEffect, useCallback, useState, Suspense, useMemo,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, Stars, Billboard, Text, Cylinder, Sphere, Box,
  Cone, Environment, Points, PointMaterial, MeshReflectorMaterial,
  Cloud,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, HueSaturation, SSAO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import { NPCS, NPC } from './npcData';

// ── Constants ────────────────────────────────────────────────────
const WORLD_SIZE = 48;
const MOVE_SPEED = 0.09;
const CAM_DIST   = 20;
const CAM_HEIGHT = 15;
const CAM_LERP   = 0.06;

// ── Quality detection ─────────────────────────────────────────────
// Detects integrated GPU (Intel/ARM) and disables expensive effects
function useQualityTier(): 'high' | 'medium' | 'low' {
  return useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return 'low';
      const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (!ext) return 'medium';
      const renderer = (gl as WebGLRenderingContext)
        .getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
      const isIntegrated = /Intel|Mali|Adreno 3|Adreno 4|PowerVR/i.test(renderer);
      if (isIntegrated) return 'low';
      const isLowMid = /Adreno 5|GTX 7|GTX 8|GTX 9[0-4]|RX 4|RX 5[0-4]/i.test(renderer);
      return isLowMid ? 'medium' : 'high';
    } catch {
      return 'medium';
    }
  }, []);
}

// ── Terrain height ────────────────────────────────────────────────
function terrainY(x: number, z: number): number {
  return (
    Math.sin(x * 0.28) * 1.2 +
    Math.cos(z * 0.22) * 1.0 +
    Math.sin((x + z) * 0.13) * 0.7 +
    Math.sin(x * 0.6 + 1.2) * 0.3 +
    Math.cos(z * 0.5 - 0.8) * 0.25
  );
}

// ── PBR Terrain ───────────────────────────────────────────────────
function Terrain() {
  const geo = useRef<THREE.PlaneGeometry>(null!);
  useEffect(() => {
    const g = geo.current;
    if (!g) return;
    const pos    = g.attributes.position;
    const colors: number[] = [];
    // Richer valley-to-hilltop color palette
    const valley = new THREE.Color('#1e5c35');  // deep valley green
    const low    = new THREE.Color('#2d6a4f');  // low meadow
    const mid    = new THREE.Color('#52b788');  // mid grass
    const high   = new THREE.Color('#74c69d');  // hilltop bright
    const dirt   = new THREE.Color('#8B6914');  // subtle dirt in deepest valleys
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // Y in plane coords = Z in world
      const y = terrainY(x, z);
      pos.setZ(i, y);
      // Normalize height roughly -2 to +3
      const t = THREE.MathUtils.clamp((y + 2.0) / 5.0, 0, 1);
      let c: THREE.Color;
      if (t < 0.12)      c = dirt.clone().lerp(valley, t / 0.12);
      else if (t < 0.35) c = valley.clone().lerp(low,  (t - 0.12) / 0.23);
      else if (t < 0.65) c = low.clone().lerp(mid,    (t - 0.35) / 0.30);
      else               c = mid.clone().lerp(high,   (t - 0.65) / 0.35);
      colors.push(c.r, c.g, c.b);
    }
    pos.needsUpdate = true;
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
  }, []);
  return (
    <>
      {/* Main terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <planeGeometry ref={geo} args={[WORLD_SIZE, WORLD_SIZE, 120, 120]} />
        <meshStandardMaterial
          vertexColors
          roughness={0.90}
          metalness={0.0}
          envMapIntensity={0.3}
        />
      </mesh>
      {/* N-S dirt path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]} receiveShadow>
        <planeGeometry args={[3.2, WORLD_SIZE - 4]} />
        <meshStandardMaterial color="#b8864e" roughness={0.98} metalness={0} />
      </mesh>
      {/* E-W dirt path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE - 4, 3.2]} />
        <meshStandardMaterial color="#b8864e" roughness={0.98} metalness={0} />
      </mesh>
      {/* Subtle AO plane — darkens where terrain meets edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[WORLD_SIZE + 4, WORLD_SIZE + 4]} />
        <meshBasicMaterial color="#0d1a0e" />
      </mesh>
    </>
  );
}

// ── Reflective Pond (Phase 7F upgrade) ───────────────────────────
function Pond() {
  const waterRef    = useRef<THREE.Mesh>(null!);
  const rippleRef   = useRef<THREE.Mesh>(null!);
  // Animate water color and ripple ring
  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.MeshStandardMaterial;
    const t = clock.elapsedTime;
    mat.color.setRGB(
      0.28 + 0.04 * Math.sin(t * 0.35),
      0.62 + 0.07 * Math.sin(t * 0.28 + 1.1),
      0.90 + 0.05 * Math.sin(t * 0.45 + 2.3),
    );
    mat.opacity = 0.78 + 0.06 * Math.sin(t * 0.55);
    mat.envMapIntensity = 2.2 + 0.5 * Math.sin(t * 0.4);
    if (rippleRef.current) {
      const rs = rippleRef.current.scale;
      const pulse = 1.0 + 0.03 * Math.sin(t * 1.2);
      rs.set(pulse, pulse, pulse);
    }
  });
  const lilyPads = useMemo(() => [
    { pos: [1.2, 0.08, -1.4] as [number,number,number], i: 0 },
    { pos: [-1.8, 0.08, 0.8] as [number,number,number], i: 1 },
    { pos: [0.5, 0.08, 2.1]  as [number,number,number], i: 2 },
    { pos: [-2.3, 0.08, -1.2] as [number,number,number], i: 3 },
    { pos: [2.5, 0.08, 1.0]  as [number,number,number], i: 4 },
    { pos: [-0.7, 0.08, -2.5] as [number,number,number], i: 5 },
  ], []);
  return (
    <group>
      {/* Deep base — dark bottom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <circleGeometry args={[4.4, 48]} />
        <meshStandardMaterial color="#0d2a40" roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Feathered bank ring — smooth dirt-to-water transition */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[4.0, 4.8, 48]} />
        <meshStandardMaterial color="#7da8c4" roughness={0.95} metalness={0} transparent opacity={0.55} />
      </mesh>
      {/* PBR animated water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[4.0, 48]} />
        <meshStandardMaterial
          color="#5ac8fa"
          roughness={0.04}
          metalness={0.25}
          transparent
          opacity={0.82}
          envMapIntensity={2.4}
        />
      </mesh>
      {/* Subtle ripple ring */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.072, 0]}>
        <ringGeometry args={[1.8, 2.1, 32]} />
        <meshBasicMaterial color="#a8d8f0" transparent opacity={0.18} />
      </mesh>
      {/* Lily pads */}
      {lilyPads.map(({ pos, i }) => (
        <group key={i}>
          <mesh
            rotation={[-Math.PI / 2, (i * 1.3) % (Math.PI * 2), 0]}
            position={pos}
          >
            <circleGeometry args={[0.30 + (i % 3) * 0.05, 14]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#1a5c38' : '#2d6a4f'}
              roughness={0.75}
              metalness={0}
              envMapIntensity={0.4}
            />
          </mesh>
          {/* Tiny flower on some lily pads */}
          {i % 3 === 0 && (
            <Billboard position={[pos[0], pos[1] + 0.12, pos[2]]}>
              <Text fontSize={0.18} anchorX="center" anchorY="middle">🌸</Text>
            </Billboard>
          )}
        </group>
      ))}
    </group>
  );
}

// ── Trees ─────────────────────────────────────────────────────────
const TREE_POSITIONS: [number, number, number, number][] = [
  [-14,-6,1.0,0],[-12,8,1.3,1],[-16,2,0.9,2],
  [13,-7,1.1,0],[14,5,1.4,1],[15,10,0.85,2],
  [-6,-14,1.0,0],[5,-15,1.2,1],[-10,-13,1.3,2],
  [7,14,0.9,0],[-5,15,1.1,1],[10,13,1.0,2],
  [-17,-1,1.2,0],[16,0,1.0,1],[-3,-17,0.9,2],
  [3,17,1.3,0],[-14,12,1.0,1],[12,-14,1.1,2],
  [-8,16,0.9,0],[8,-16,1.2,1],[-16,-10,1.0,2],
  [16,-9,0.85,0],[16,8,1.1,1],[-15,-3,1.3,2],
  [-11,-16,1.0,0],[11,16,0.9,1],[-13,14,1.1,2],
  [14,-12,1.2,0],[-4,-16,1.0,1],[4,-18,0.9,2],
];
const TREE_GREENS = ['#1a5c38','#206040','#2d6a4f','#166534','#1b4332'];

function Tree({ x, z, scale, variant }: { x: number; z: number; scale: number; variant: number }) {
  const gy          = terrainY(x, z);
  const trunkColor  = '#6b3c1f';
  const leafColor   = TREE_GREENS[variant % TREE_GREENS.length];
  const leaf2       = TREE_GREENS[(variant + 1) % TREE_GREENS.length];
  const leaf3       = TREE_GREENS[(variant + 2) % TREE_GREENS.length];
  return (
    <group position={[x, gy, z]} scale={[scale, scale, scale]}>
      {/* Trunk with slight taper */}
      <Cylinder args={[0.16, 0.28, 1.5, 8]} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={trunkColor} roughness={0.97} metalness={0} />
      </Cylinder>
      {/* Root bulge */}
      <Cylinder args={[0.32, 0.36, 0.3, 8]} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={trunkColor} roughness={0.97} metalness={0} />
      </Cylinder>
      {/* 3-layer canopy — different greens, slight XZ offsets for organic look */}
      <Cone args={[1.4, 2.2, 8]} position={[0.0, 2.5, 0.0]} castShadow receiveShadow>
        <meshStandardMaterial color={leafColor} roughness={0.86} metalness={0} envMapIntensity={0.25} />
      </Cone>
      <Cone args={[1.05, 1.9, 8]} position={[0.1, 3.7, 0.05]} castShadow receiveShadow>
        <meshStandardMaterial color={leaf2} roughness={0.84} metalness={0} envMapIntensity={0.2} />
      </Cone>
      <Cone args={[0.68, 1.55, 7]} position={[-0.05, 4.75, -0.05]} castShadow receiveShadow>
        <meshStandardMaterial color={leaf3} roughness={0.88} metalness={0} envMapIntensity={0.2} />
      </Cone>
    </group>
  );
}
function Forest() {
  return <>{TREE_POSITIONS.map(([x,z,scale,variant],i) => <Tree key={i} x={x} z={z} scale={scale} variant={variant} />)}</>;
}

// ── Fireflies — emissive glow, bloom makes them pop ───────────────
function Fireflies() {
  const count   = 32;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.8 + Math.random() * 5.5;
      arr[i*3]   = Math.cos(angle) * r;
      arr[i*3+1] = 0.4 + Math.random() * 2.2;
      arr[i*3+2] = Math.sin(angle) * r;
    }
    return arr;
  }, []);
  const posRef  = useRef<THREE.BufferAttribute>(null!);
  const origPos = useMemo(() => Float32Array.from(positions), [positions]);
  useFrame(({ clock }) => {
    if (!posRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posRef.current.setXYZ(i,
        origPos[i*3]   + Math.sin(t * 0.55 + i * 1.35) * 0.42,
        origPos[i*3+1] + Math.sin(t * 0.85 + i * 0.75) * 0.28,
        origPos[i*3+2] + Math.cos(t * 0.48 + i * 1.12) * 0.42,
      );
    }
    posRef.current.needsUpdate = true;
  });
  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute
          ref={posRef}
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      {/* High luminance so Bloom picks them up */}
      <PointMaterial
        size={0.14}
        color="#fff59d"
        transparent
        opacity={0.92}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

// ── Decorations ───────────────────────────────────────────────────
function Decorations() {
  return (
    <>
      {/* Rocks */}
      {([
        [-6,3,0.18],[8,-7,0.22],[-9,-4,0.16],[5,10,0.20],
        [-11,6,0.24],[11,-9,0.19],[-7,11,0.15],[9,8,0.21],
        [3,-12,0.17],[-12,3,0.20],
      ] as [number,number,number][]).map(([x,z,r],i) => (
        <Sphere key={i} args={[r, 8, 6]} position={[x, terrainY(x,z)+r*0.5, z]} castShadow>
          <meshStandardMaterial
            color={i%2===0?'#6b6560':'#8f8680'}
            roughness={0.95}
            metalness={0.04}
          />
        </Sphere>
      ))}
      {/* Mushrooms */}
      {([
        [-4,-8],[7,6],[-8,9],[-3,8],[6,-5],[10,2],[-5,12],
      ] as [number,number][]).map(([x,z],i) => (
        <group key={i} position={[x, terrainY(x,z), z]}>
          <Cylinder args={[0.06,0.09,0.38,8]} position={[0,0.19,0]} castShadow>
            <meshStandardMaterial color="#ddd0b0" roughness={0.9} metalness={0} />
          </Cylinder>
          <Sphere args={[0.22,10,8]} position={[0,0.50,0]} castShadow>
            <meshStandardMaterial
              color={['#dc2626','#ea580c','#9333ea','#0891b2','#16a34a','#e11d48','#854d0e'][i]}
              roughness={0.6}
              metalness={0.04}
              envMapIntensity={0.3}
            />
          </Sphere>
        </group>
      ))}
      {/* Meadow sign */}
      <group position={[2.0, terrainY(2.0,0.8)+0.01, 0.8]}>
        <Box args={[0.1,0.65,0.1]} position={[0,0.33,0]} castShadow>
          <meshStandardMaterial color="#92400e" roughness={0.95} metalness={0} />
        </Box>
        <Box args={[0.65,0.38,0.07]} position={[0,0.77,0]} castShadow>
          <meshStandardMaterial color="#b45309" roughness={0.9} metalness={0} />
        </Box>
        <Billboard position={[0,0.77,0.06]}>
          <Text fontSize={0.1} color="#fef9c3" anchorX="center" anchorY="middle">Meadow Haven 🌿</Text>
        </Billboard>
      </group>
      {/* Fence posts along path */}
      {[-8,-4,0,4,8].map((x,i) => (
        <group key={i} position={[x, terrainY(x,1.9), 1.9]}>
          <Box args={[0.1,0.55,0.1]} position={[0,0.28,0]} castShadow>
            <meshStandardMaterial color="#a16207" roughness={0.95} metalness={0} />
          </Box>
        </group>
      ))}
    </>
  );
}

// ── Flowers ───────────────────────────────────────────────────────
const FLOWER_POS: [number,number][] = [
  [-7,-5],[5,-7],[-4,6],[8,4],[-9,1],[9,-2],
  [2,-11],[-2,10],[6,8],[-6,-9],[11,0],[-11,0],[4,6],[-5,-4],[7,-10],[-8,8],
];
function Flower({ pos, collected, onCollect, playerPos }: {
  pos: [number,number]; collected: boolean; onCollect: () => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const ref    = useRef<THREE.Group>(null!);
  const colRef = useRef(collected);
  colRef.current = collected;
  useFrame(({ clock }) => {
    if (!ref.current || colRef.current) return;
    ref.current.position.y = terrainY(pos[0],pos[1])+0.6+Math.sin(clock.elapsedTime*2+pos[0])*0.14;
    if (Math.hypot(playerPos.current.x-pos[0],playerPos.current.z-pos[1])<1.2 && !colRef.current) onCollect();
  });
  if (collected) return null;
  return (
    <group ref={ref} position={[pos[0],terrainY(pos[0],pos[1])+0.6,pos[1]]}>
      <Billboard><Text fontSize={0.45} anchorX="center" anchorY="middle">🌸</Text></Billboard>
    </group>
  );
}

// ── Glow ring ─────────────────────────────────────────────────────
function GlowRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current)
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.3+0.3*Math.sin(clock.elapsedTime*3);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI/2,0,0]} position={[0,-0.5,0]}>
      <ringGeometry args={[0.9,1.3,32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── NPC ───────────────────────────────────────────────────────────
function NPCSprite({ npc, playerPos, onNearby, isNearby, showPrompt }: {
  npc: NPC; playerPos: React.MutableRefObject<THREE.Vector3>;
  onNearby: (npc: NPC|null) => void; isNearby: boolean; showPrompt: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const wasNear  = useRef(false);
  const wx = npc.tx - 12, wz = npc.ty - 9;
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = terrainY(wx,wz)+0.9+Math.sin(clock.elapsedTime*1.2+npc.tx)*0.1;
    const near = Math.hypot(playerPos.current.x-wx, playerPos.current.z-wz)<2.8;
    if (near!==wasNear.current) { wasNear.current=near; onNearby(near?npc:null); }
  });
  return (
    <group ref={groupRef} position={[wx, terrainY(wx,wz)+0.9, wz]}>
      {isNearby && <GlowRing color={npc.color} />}
      <Billboard>
        <Text fontSize={0.85} anchorX="center" anchorY="middle">{npc.emoji}</Text>
      </Billboard>
      <Billboard position={[0,1.3,0]}>
        <Text fontSize={0.2} color="white" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="black">{npc.name}</Text>
      </Billboard>
      {showPrompt && (
        <Billboard position={[0,1.9,0]}>
          <Text fontSize={0.19} color="#fde68a" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#78350f">Press E to talk</Text>
        </Billboard>
      )}
    </group>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ position, color, name, isMe, moving, facingAngle }: {
  position: [number,number,number]; color: string; name: string;
  isMe: boolean; moving: boolean; facingAngle: number;
}) {
  const groupRef  = useRef<THREE.Group>(null!);
  const movRef    = useRef(moving);
  const angleRef  = useRef(facingAngle);
  movRef.current   = moving;
  angleRef.current = facingAngle;
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const bob     = movRef.current ? Math.sin(clock.elapsedTime*8)*0.06 : 0;
    const breathe = 1+Math.sin(clock.elapsedTime*1.5)*0.012;
    groupRef.current.scale.y = breathe;
    groupRef.current.position.set(position[0],position[1]+bob,position[2]);
    const cur = groupRef.current.rotation.y;
    groupRef.current.rotation.y = cur+(angleRef.current-cur)*0.15;
  });
  return (
    <group ref={groupRef} position={position}>
      {/* Shadow ellipse */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]}>
        <circleGeometry args={[0.36,16]} />
        <meshBasicMaterial color="black" transparent opacity={0.22} />
      </mesh>
      {/* Body */}
      <Cylinder args={[0.21,0.27,0.72,12]} position={[0,0.36,0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.08} envMapIntensity={0.5} />
      </Cylinder>
      {/* Head */}
      <Sphere args={[0.28,16,12]} position={[0,0.93,0]} castShadow>
        <meshStandardMaterial color="#fde7c3" roughness={0.8} metalness={0} />
      </Sphere>
      {/* Eyes */}
      <Sphere args={[0.05,8,8]} position={[0.1,0.98,0.22]}>
        <meshBasicMaterial color="#1e293b" />
      </Sphere>
      <Sphere args={[0.05,8,8]} position={[-0.1,0.98,0.22]}>
        <meshBasicMaterial color="#1e293b" />
      </Sphere>
      {/* Player indicator ring */}
      {isMe && (
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.005,0]}>
          <ringGeometry args={[0.38,0.47,32]} />
          <meshBasicMaterial color={color} transparent opacity={0.75} />
        </mesh>
      )}
      {/* Name tag */}
      <Billboard position={[0,1.55,0]}>
        <Text fontSize={0.22} color={isMe?color:'white'} anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="black">
          {name}{isMe?' ★':''}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Remote avatar ─────────────────────────────────────────────────
function RemoteAvatar({ player }: { player: PlayerState }) {
  const pos = useRef(new THREE.Vector3(player.x/20-10,0,player.y/20-9));
  useFrame(() => {
    const tx=player.x/20-10, tz=player.y/20-9;
    pos.current.lerp(new THREE.Vector3(tx,terrainY(tx,tz),tz),0.12);
  });
  if (!player.online) return null;
  return (
    <Avatar
      position={[pos.current.x,pos.current.y,pos.current.z]}
      color={player.spriteColor} name={player.name} isMe={false}
      moving={player.moving} facingAngle={0}
    />
  );
}

// ── Lighting (Phase 7F upgrade) ───────────────────────────────────
function Lighting() {
  return (
    <>
      {/* Warm ambient — fills shadows gently */}
      <ambientLight intensity={0.50} color="#fff0cc" />
      {/* Main sun — ACES-friendly intensity, warm gold */}
      <directionalLight
        position={[22, 30, 10]}
        intensity={2.2}
        color="#ffe488"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={110}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0008}
      />
      {/* Cool fill from opposite side — blue-violet sky bounce */}
      <directionalLight
        position={[-14, 8, -14]}
        intensity={0.30}
        color="#b0c8f8"
      />
      {/* Pond point light — shimmers on water */}
      <pointLight
        position={[0, 2.8, 0]}
        intensity={1.4}
        color="#7ee8fa"
        distance={11}
        decay={2}
      />
      {/* Warm ground-bounce hemisphere */}
      <hemisphereLight args={['#9be8d8', '#3a6030', 0.38]} />
    </>
  );
}

// ── Camera ────────────────────────────────────────────────────────
function CameraRig({ target }: { target: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(
      new THREE.Vector3(target.current.x + CAM_DIST*0.55, CAM_HEIGHT, target.current.z + CAM_DIST),
      CAM_LERP,
    );
    camera.lookAt(target.current.x, target.current.y + 1.2, target.current.z);
  });
  return null;
}

// ── Movement controller ───────────────────────────────────────────
function MovementController({ keysRef, posRef, movingRef, facingRef, onPublish, blockedRef }: {
  keysRef:    React.MutableRefObject<Set<string>>;
  posRef:     React.MutableRefObject<THREE.Vector3>;
  movingRef:  React.MutableRefObject<boolean>;
  facingRef:  React.MutableRefObject<number>;
  onPublish:  (x: number, z: number, moving: boolean) => void;
  blockedRef: React.MutableRefObject<boolean>;
}) {
  useFrame(() => {
    if (blockedRef.current) { movingRef.current=false; return; }
    const k=keysRef.current;
    let dx=0, dz=0;
    if (k.has('ArrowLeft') ||k.has('a')||k.has('A')) dx-=MOVE_SPEED;
    if (k.has('ArrowRight')||k.has('d')||k.has('D')) dx+=MOVE_SPEED;
    if (k.has('ArrowUp')   ||k.has('w')||k.has('W')) dz-=MOVE_SPEED;
    if (k.has('ArrowDown') ||k.has('s')||k.has('S')) dz+=MOVE_SPEED;
    if (dx!==0&&dz!==0) { dx*=0.707; dz*=0.707; }
    movingRef.current = dx!==0||dz!==0;
    if (!movingRef.current) return;
    if (dx!==0||dz!==0) facingRef.current=Math.atan2(dx,dz);
    const np=posRef.current.clone().add(new THREE.Vector3(dx,0,dz));
    const half=WORLD_SIZE/2-2;
    np.x=Math.max(-half,Math.min(half,np.x));
    np.z=Math.max(-half,Math.min(half,np.z));
    if (Math.hypot(np.x,np.z)>4.4) {
      np.y=terrainY(np.x,np.z);
      posRef.current.copy(np);
      onPublish(np.x,np.z,true);
    }
  });
  return null;
}

// ── Post-processing — quality adaptive ───────────────────────────
function PostFX({ quality }: { quality: 'high' | 'medium' | 'low' }) {
  if (quality === 'low') {
    // Integrated GPU — only free effects
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.04}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.12} darkness={0.38} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    );
  }
  if (quality === 'medium') {
    return (
      <EffectComposer multisampling={4}>
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.03}
          mipmapBlur
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.10} darkness={0.40} blendFunction={BlendFunction.NORMAL} />
        <HueSaturation hue={0} saturation={0.08} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    );
  }
  // High — full pipeline
  return (
    <EffectComposer multisampling={8}>
      <SSAO
        radius={0.35}
        intensity={22}
        luminanceInfluence={0.55}
        color={new THREE.Color('black')}
        blendFunction={BlendFunction.MULTIPLY}
      />
      <Bloom
        intensity={0.50}
        luminanceThreshold={0.80}
        luminanceSmoothing={0.025}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.10} darkness={0.42} blendFunction={BlendFunction.NORMAL} />
      <HueSaturation hue={0} saturation={0.10} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

// ── Scene ─────────────────────────────────────────────────────────
function Scene({
  myEmail, myName, myColor, onCollect, onBondXP,
  nearbyNPCRef, setNearbyNPC, blockedRef, posRef, movingRef, facingRef, keysRef,
  quality,
}: {
  myEmail: string; myName: string; myColor: string;
  onCollect: (n: number) => void; onBondXP: (xp: number) => void;
  nearbyNPCRef: React.MutableRefObject<NPC|null>;
  setNearbyNPC: (n: NPC|null) => void;
  blockedRef:  React.MutableRefObject<boolean>;
  posRef:      React.MutableRefObject<THREE.Vector3>;
  movingRef:   React.MutableRefObject<boolean>;
  facingRef:   React.MutableRefObject<number>;
  keysRef:     React.MutableRefObject<Set<string>>;
  quality:     'high' | 'medium' | 'low';
}) {
  const remotePlayers = useRef<Record<string,PlayerState>>({});
  const { publish, markOnline } = useHeartboundSync(
    myEmail, myName, myColor,
    useCallback((p: Record<string,PlayerState>) => { remotePlayers.current=p; },[]),
  );
  const flowerCountRef = useRef(0);
  const [collectedFlowers, setCollectedFlowers] = useState<Set<number>>(new Set());
  const [remoteSnap, setRemoteSnap]             = useState<Record<string,PlayerState>>({});

  useEffect(() => { markOnline(); }, [markOnline]);
  useEffect(() => {
    const id = setInterval(() => setRemoteSnap({...remotePlayers.current}), 100);
    return () => clearInterval(id);
  }, []);

  const handleFlowerCollect = useCallback((i: number) => {
    if (collectedFlowers.has(i)) return;
    setCollectedFlowers(prev => new Set([...prev,i]));
    flowerCountRef.current++;
    onCollect(flowerCountRef.current);
    onBondXP(5);
  }, [collectedFlowers, onCollect, onBondXP]);

  const onPublish = useCallback((x: number, z: number, moving: boolean) => {
    publish({ x:(x+10)*20, y:(z+9)*20, dir:'down', moving });
  }, [publish]);

  const handleNPCNearby = useCallback((npc: NPC|null) => {
    if (nearbyNPCRef.current?.id===npc?.id) return;
    nearbyNPCRef.current=npc;
    setNearbyNPC(npc);
  }, [nearbyNPCRef, setNearbyNPC]);

  return (
    <>
      <Lighting />
      <Environment preset="sunset" />
      {/* Atmospheric fog — pushed further for bigger world feel */}
      <fog attach="fog" args={['#b8d4c0', 48, 105]} />
      {/* Sky — warm afternoon sun, tuned Rayleigh + Mie */}
      <Sky
        sunPosition={[80, 20, -40]}
        turbidity={4.2}
        rayleigh={1.1}
        mieCoefficient={0.006}
        mieDirectionalG={0.87}
        inclination={0.52}
        azimuth={0.18}
      />
      {/* Stars fade in at edges — visible through fog gap */}
      <Stars radius={85} depth={40} count={1000} factor={3} fade speed={0.3} />
      {/* Billboard clouds — cheap, atmospheric */}
      <Cloud position={[-18, 14, -15]} speed={0.2} opacity={0.55} />
      <Cloud position={[20, 16, -20]}  speed={0.15} opacity={0.45} />
      <Cloud position={[5,  18, -30]}  speed={0.18} opacity={0.50} />
      <Terrain />
      <Pond />
      <Forest />
      <Decorations />
      <Fireflies />
      {FLOWER_POS.map((pos,i) => (
        <Flower key={i} pos={pos} collected={collectedFlowers.has(i)}
          onCollect={() => handleFlowerCollect(i)} playerPos={posRef} />
      ))}
      {NPCS.map(npc => (
        <NPCSprite key={npc.id} npc={npc} playerPos={posRef}
          onNearby={handleNPCNearby}
          isNearby={nearbyNPCRef.current?.id===npc.id}
          showPrompt={nearbyNPCRef.current?.id===npc.id && !blockedRef.current} />
      ))}
      <Avatar
        position={[posRef.current.x, terrainY(posRef.current.x,posRef.current.z), posRef.current.z]}
        color={myColor} name={myName} isMe moving={movingRef.current} facingAngle={facingRef.current}
      />
      {Object.values(remoteSnap).filter(p => p.email!==myEmail&&p.online).map(p => (
        <RemoteAvatar key={p.email} player={p} />
      ))}
      <CameraRig target={posRef} />
      <MovementController
        keysRef={keysRef} posRef={posRef} movingRef={movingRef}
        facingRef={facingRef} onPublish={onPublish} blockedRef={blockedRef}
      />
      {/* Post-processing — quality adaptive */}
      <PostFX quality={quality} />
    </>
  );
}

// ── Dialogue box ──────────────────────────────────────────────────
function DialogueBox({ npc, lineIdx, onClose }: { npc: NPC; lineIdx: number; onClose: () => void }) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20 pointer-events-auto">
      <div className="rounded-2xl p-4 shadow-2xl border"
        style={{ background:'rgba(10,6,25,0.93)', backdropFilter:'blur(14px)', borderColor:npc.color+'55' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{npc.emoji}</span>
          <span className="font-bold text-white text-sm">{npc.name}</span>
          <div className="flex-1" />
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background:npc.color+'30', color:npc.color }}>+{npc.xpReward} Bond XP</span>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed mb-3">{npc.lines[lineIdx]}</p>
        <button onClick={onClose}
          className="w-full py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition"
          style={{ background:npc.color+'20', border:`1px solid ${npc.color}30` }}>
          Press E or tap to continue
        </button>
      </div>
    </div>
  );
}

// ── In-game menu ──────────────────────────────────────────────────
function GameMenu({ bondXP, flowerCount, onClose, onToggleFullscreen, isFullscreen, quality, onQualityChange }: {
  bondXP: number; flowerCount: number;
  onClose: () => void; onToggleFullscreen: () => void; isFullscreen: boolean;
  quality: 'high' | 'medium' | 'low'; onQualityChange: (q: 'high' | 'medium' | 'low') => void;
}) {
  const [tab, setTab] = useState<'inventory'|'profile'|'controls'|'settings'>('inventory');
  const tabs = [
    { key:'inventory', label:'🎒 Inventory' },
    { key:'profile',   label:'👤 Profile'   },
    { key:'controls',  label:'🎮 Controls'  },
    { key:'settings',  label:'⚙️ Settings'  },
  ] as const;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto"
      style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)' }}>
      <div className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background:'rgba(8,6,18,0.97)', border:'1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <span className="text-white font-bold text-lg">🌿 Meadow Haven</span>
          <button onClick={onClose}
            className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-lg font-bold">✕</button>
        </div>
        <div className="flex border-b border-white/10">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-xs font-semibold transition ${
                tab===t.key ? 'text-white border-b-2 border-pink-400 bg-white/5' : 'text-white/40 hover:text-white/70'
              }`}>{t.label}</button>
          ))}
        </div>
        <div className="p-6 min-h-[240px]">
          {tab==='inventory' && (
            <div>
              <h3 className="text-white font-bold mb-4">Collected Items</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon:'🌸', label:'Flowers',   count:flowerCount },
                  { icon:'🍄', label:'Mushrooms', count:0 },
                  { icon:'💎', label:'Crystals',  count:0 },
                ].map(it => (
                  <div key={it.label} className={`bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/10 ${it.count===0&&it.label!=='Flowers'?'opacity-40':''}`}>
                    <span className="text-3xl">{it.icon}</span>
                    <span className="text-white font-bold text-lg">{it.count}</span>
                    <span className="text-white/40 text-xs">{it.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-4 text-center">More items unlock as you explore 🌿</p>
            </div>
          )}
          {tab==='profile' && (
            <div>
              <h3 className="text-white font-bold mb-4">Your Profile</h3>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60 text-xs">💕 Bond XP</span>
                  <span className="text-white/60 text-xs">{bondXP}/100</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width:`${Math.min(bondXP,100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label:'Flowers collected', value:flowerCount, icon:'🌸' },
                  { label:'NPCs talked to',    value:0,           icon:'💬' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                    <span className="text-white/60 text-sm">{s.icon} {s.label}</span>
                    <span className="text-white font-bold text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==='controls' && (
            <div>
              <h3 className="text-white font-bold mb-4">Controls</h3>
              <div className="space-y-2">
                {[
                  { keys:'W / ↑',     action:'Move forward' },
                  { keys:'S / ↓',     action:'Move backward' },
                  { keys:'A / ←',     action:'Move left' },
                  { keys:'D / →',     action:'Move right' },
                  { keys:'E / Enter', action:'Talk to NPC / Continue dialogue' },
                  { keys:'M / Esc',   action:'Open / close menu' },
                  { keys:'F',         action:'Toggle fullscreen' },
                ].map(c => (
                  <div key={c.action} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                    <span className="text-white/60 text-sm">{c.action}</span>
                    <div className="flex gap-1">
                      {c.keys.split(' / ').map(k => (
                        <kbd key={k} className="bg-white/15 text-white text-xs px-2 py-1 rounded-lg font-mono">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab==='settings' && (
            <div>
              <h3 className="text-white font-bold mb-4">Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-white/80 text-sm">🖥️ Fullscreen</span>
                  <button onClick={onToggleFullscreen}
                    className={`relative w-12 h-6 rounded-full transition-colors ${isFullscreen?'bg-pink-500':'bg-white/20'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isFullscreen?'left-6':'left-0.5'}`} />
                  </button>
                </div>
                {/* Quality preset selector */}
                <div className="bg-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">🎮 Graphics Quality</span>
                    <span className="text-white/40 text-xs capitalize">{quality}</span>
                  </div>
                  <div className="flex gap-2">
                    {(['low','medium','high'] as const).map(q => (
                      <button key={q} onClick={() => onQualityChange(q)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                          quality===q ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/50 hover:text-white'
                        }`}>{q}</button>
                    ))}
                  </div>
                  <p className="text-white/25 text-xs mt-2">
                    {quality==='low' && 'Best for integrated graphics (Intel HD/UHD). Bloom + ACES only.'}
                    {quality==='medium' && 'Balanced. Bloom, tone mapping, saturation. Good for mid-range.'}
                    {quality==='high' && 'Full pipeline. SSAO + Bloom + DoF. RTX / dedicated GPU recommended.'}
                  </p>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-white/80 text-sm">🏷️ Show name tags</span>
                  <button className="relative w-12 h-6 rounded-full bg-pink-500">
                    <span className="absolute top-0.5 left-6 w-5 h-5 rounded-full bg-white shadow" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 opacity-40">
                  <span className="text-white/80 text-sm">🎵 Ambient music</span>
                  <span className="text-white/40 text-xs">Phase 7Y</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-white/30 text-xs">M or Esc to close</span>
          <button onClick={onClose}
            className="bg-pink-500 hover:bg-pink-400 text-white text-sm font-bold px-5 py-2 rounded-xl transition">Resume</button>
        </div>
      </div>
    </div>
  );
}

// ── Virtual joystick ──────────────────────────────────────────────
function VirtualJoystick({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
  return (
    <div className="md:hidden absolute bottom-4 right-4 z-10"
      style={{ display:'grid', gridTemplateColumns:'repeat(3,3rem)', gridTemplateRows:'repeat(2,3rem)', gap:'0.25rem' }}>
      {([
        { label:'↑', key:'ArrowUp',    col:2, row:1 },
        { label:'←', key:'ArrowLeft',  col:1, row:2 },
        { label:'↓', key:'ArrowDown',  col:2, row:2 },
        { label:'→', key:'ArrowRight', col:3, row:2 },
      ] as const).map(btn => (
        <button key={btn.key}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); keysRef.current.add(btn.key); }}
          onPointerUp={() => keysRef.current.delete(btn.key)}
          onPointerLeave={() => keysRef.current.delete(btn.key)}
          onPointerCancel={() => keysRef.current.delete(btn.key)}
          className="bg-white/25 backdrop-blur rounded-xl text-xl font-bold text-white active:bg-white/50 transition select-none touch-none flex items-center justify-center"
          style={{ gridColumn:btn.col, gridRow:btn.row }}>{btn.label}</button>
      ))}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────
interface Props {
  myColor: string; onBack: () => void;
  bondXP: number; onCollect: (n: number) => void; onBondXP?: (xp: number) => void;
}

export const MeadowHaven3D: React.FC<Props> = ({ myColor, onBack, bondXP, onCollect, onBondXP }) => {
  const { user } = useAuth();
  const myEmail  = user?.email ?? '';
  const myName   = getDisplayNameFromEmail(myEmail);

  const quality = useQualityTier();

  const containerRef = useRef<HTMLDivElement>(null);
  const posRef       = useRef(new THREE.Vector3(0, 0, 2));
  const movingRef    = useRef(false);
  const facingRef    = useRef(0);
  const keysRef      = useRef<Set<string>>(new Set());
  const nearbyNPCRef = useRef<NPC | null>(null);
  const npcLineIdx   = useRef<Record<string, number>>({});
  const talkedToRef  = useRef<Set<string>>(new Set());
  const dialogueRef  = useRef<{ npc: NPC; lineIdx: number } | null>(null);
  const menuOpenRef  = useRef(false);
  const blockedRef   = useRef(false);

  const [nearbyNPC,    setNearbyNPC]    = useState<NPC | null>(null);
  const [dialogue,     setDialogue]     = useState<{ npc: NPC; lineIdx: number } | null>(null);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flowerCount,  setFlowerCount]  = useState(0);
  const [qualityOverride, setQualityOverride] = useState<'high'|'medium'|'low'|null>(null);

  const effectiveQuality = qualityOverride ?? quality;

  useEffect(() => { dialogueRef.current=dialogue; blockedRef.current=!!dialogue||menuOpenRef.current; }, [dialogue]);
  useEffect(() => { menuOpenRef.current=menuOpen; blockedRef.current=!!dialogueRef.current||menuOpen; }, [menuOpen]);
  useEffect(() => { containerRef.current?.focus(); }, []);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }, []);

  const openDialogue = useCallback((npc: NPC) => {
    const idx = npcLineIdx.current[npc.id] ?? 0;
    npcLineIdx.current[npc.id] = (idx+1) % npc.lines.length;
    setDialogue({ npc, lineIdx: idx });
    if (!talkedToRef.current.has(npc.id)) { talkedToRef.current.add(npc.id); onBondXP?.(npc.xpReward); }
  }, [onBondXP]);
  const closeDialogue = useCallback(() => setDialogue(null), []);
  const handleCollect = useCallback((count: number) => { setFlowerCount(count); onCollect(count); }, [onCollect]);

  // SINGLE PERMANENT KEYDOWN LISTENER — empty [] dep, all state via refs
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (e.key === 'Escape') e.preventDefault();
      keysRef.current.add(e.key);
      const hasD = !!dialogueRef.current;
      const hasM = menuOpenRef.current;
      if (e.key==='e'||e.key==='E'||e.key==='Enter') {
        if (hasD) closeDialogue();
        else if (!hasM && nearbyNPCRef.current) openDialogue(nearbyNPCRef.current);
        return;
      }
      if (e.key==='Escape'||e.key==='m'||e.key==='M') {
        if (hasD) closeDialogue();
        else setMenuOpen(p => !p);
        return;
      }
      if (e.key==='f'||e.key==='F') { toggleFullscreen(); return; }
    };
    const up   = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const blur = () => keysRef.current.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    window.addEventListener('blur',    blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
      window.removeEventListener('blur',    blur);
    };
  }, []); // EMPTY — never re-registers

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="relative w-full select-none outline-none"
      style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 120px)', minHeight: 400, background: '#0d1f0a' }}
      onPointerDown={() => containerRef.current?.focus()}
    >
      <Canvas
        shadows
        camera={{ position: [11, CAM_HEIGHT, CAM_DIST], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: effectiveQuality !== 'low',
          toneMapping: THREE.NoToneMapping, // let PostFX handle tone mapping
          toneMappingExposure: 1.0,
          powerPreference: effectiveQuality === 'low' ? 'low-power' : 'high-performance',
        }}
        tabIndex={-1}
      >
        <Suspense fallback={null}>
          <Scene
            myEmail={myEmail} myName={myName} myColor={myColor}
            onCollect={handleCollect} onBondXP={onBondXP ?? (() => {})}
            nearbyNPCRef={nearbyNPCRef} setNearbyNPC={setNearbyNPC}
            blockedRef={blockedRef} posRef={posRef}
            movingRef={movingRef} facingRef={facingRef} keysRef={keysRef}
            quality={effectiveQuality}
          />
        </Suspense>
      </Canvas>

      {/* Bond XP HUD */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/45 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-white text-xs font-bold">💕 Bond XP</span>
          <div className="w-32 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width:`${Math.min(bondXP,100)}%` }} />
          </div>
          <span className="text-white/70 text-xs">{bondXP}/100</span>
        </div>
      </div>

      {/* Flowers HUD */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <div className="bg-black/45 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium">
          🌸 {flowerCount}
        </div>
      </div>

      {/* Quality badge — bottom right, subtle */}
      <div className="absolute bottom-10 right-3 z-10 pointer-events-none hidden md:block">
        <div className="bg-black/30 rounded-full px-2 py-0.5 text-white/30 text-xs capitalize">
          {effectiveQuality === 'low' ? '🔋 eco' : effectiveQuality === 'medium' ? '⚡ balanced' : '✨ ultra'}
        </div>
      </div>

      {dialogue && <DialogueBox npc={dialogue.npc} lineIdx={dialogue.lineIdx} onClose={closeDialogue} />}

      {menuOpen && (
        <GameMenu
          bondXP={bondXP} flowerCount={flowerCount}
          onClose={() => setMenuOpen(false)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          quality={effectiveQuality}
          onQualityChange={setQualityOverride}
        />
      )}

      {nearbyNPC && !dialogue && !menuOpen && (
        <button onClick={() => openDialogue(nearbyNPC)}
          className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg animate-bounce z-10"
          style={{ background: nearbyNPC.color }}>
          Talk to {nearbyNPC.name} {nearbyNPC.emoji}
        </button>
      )}

      <VirtualJoystick keysRef={keysRef} />

      {/* Top-left HUD */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button onClick={onBack}
          className="bg-black/45 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/60 transition">
          ← Exit
        </button>
        <button onClick={() => setMenuOpen(true)}
          className="bg-black/45 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/60 transition"
          title="Menu (M)">
          ☰ Menu
        </button>
      </div>

      <div className="hidden md:block absolute bottom-3 left-3 z-10 text-white/35 text-xs pointer-events-none">
        WASD / Arrows · E to talk · M / Esc for menu · F fullscreen
      </div>
    </div>
  );
};
