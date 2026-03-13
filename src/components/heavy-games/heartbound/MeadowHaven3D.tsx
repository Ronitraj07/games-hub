/**
 * MeadowHaven3D — Phase 3 (VRM)
 * Local player → VRMCharacter (sparkles.vrm / shizzy.vrm)
 * Remote players → SkyKidCharacter (unchanged)
 * Fix: pass posRef (MutableRefObject) not posRef.current (stale snapshot)
 */
import React, {
  useRef, useEffect, useCallback, useState, Suspense, useMemo,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, Stars, Billboard, Text, Cylinder, Sphere, Box,
  Cone, Environment, Points, PointMaterial, Cloud,
} from '@react-three/drei';
import * as THREE from 'three';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import { NPCS, NPC } from './npcData';
import { SkyKidCharacter, SkyKidConfig, DEFAULT_SKYKID_CONFIG } from './character/SkyKidCharacter';
import { VRMCharacter } from './character/VRMCharacter';

const WORLD_SIZE  = 48;
const MOVE_SPEED  = 0.09;
const CAM_DIST    = 12;
const CAM_HEIGHT  = 8;
const CAM_LERP    = 0.06;
const POND_RADIUS = 3.8;
const SPAWN = new THREE.Vector3(5, 0, 6);

function useIsTouchDevice(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);
}

function useQualityTier(): 'high' | 'medium' | 'low' {
  return useMemo(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return 'low';
      const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (!ext) return 'medium';
      const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
      if (/Intel|Mali|Adreno 3|Adreno 4|PowerVR/i.test(renderer)) return 'low';
      if (/Adreno 5|GTX 7|GTX 8|GTX 9[0-4]|RX 4|RX 5[0-4]/i.test(renderer)) return 'medium';
      return 'high';
    } catch { return 'medium'; }
  }, []);
}

function terrainY(x: number, z: number): number {
  return (
    Math.sin(x * 0.28) * 1.2 +
    Math.cos(z * 0.22) * 1.0 +
    Math.sin((x + z) * 0.13) * 0.7 +
    Math.sin(x * 0.6 + 1.2) * 0.3 +
    Math.cos(z * 0.5 - 0.8) * 0.25
  );
}

function RemoteAvatar({ player }: { player: PlayerState }) {
  const posRef = useRef(new THREE.Vector3(player.x / 20 - 10, 0, player.y / 20 - 9));
  useFrame(() => {
    const tx = player.x / 20 - 10, tz = player.y / 20 - 9;
    posRef.current.lerp(new THREE.Vector3(tx, terrainY(tx, tz), tz), 0.12);
  });
  if (!player.online) return null;
  const cfg: SkyKidConfig = { ...DEFAULT_SKYKID_CONFIG, outfitColor: player.spriteColor, capeColor: player.spriteColor };
  return (
    <SkyKidCharacter
      config={cfg} name={player.name} isMe={false}
      staticPos={[posRef.current.x, posRef.current.y, posRef.current.z]}
      moving={player.moving}
    />
  );
}

function Terrain() {
  const geo = useRef<THREE.PlaneGeometry>(null!);
  useEffect(() => {
    const g = geo.current; if (!g) return;
    const pos = g.attributes.position;
    const colors: number[] = [];
    const valley = new THREE.Color('#1e5c35'), low = new THREE.Color('#2d6a4f'),
          mid    = new THREE.Color('#52b788'), high = new THREE.Color('#74c69d'),
          dirt   = new THREE.Color('#8B6914');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getY(i), y = terrainY(x, z);
      pos.setZ(i, y);
      const t = THREE.MathUtils.clamp((y + 2.0) / 5.0, 0, 1);
      let c: THREE.Color;
      if      (t < 0.12) c = dirt.clone().lerp(valley, t / 0.12);
      else if (t < 0.35) c = valley.clone().lerp(low, (t - 0.12) / 0.23);
      else if (t < 0.65) c = low.clone().lerp(mid, (t - 0.35) / 0.30);
      else               c = mid.clone().lerp(high, (t - 0.65) / 0.35);
      colors.push(c.r, c.g, c.b);
    }
    pos.needsUpdate = true;
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <planeGeometry ref={geo} args={[WORLD_SIZE, WORLD_SIZE, 120, 120]} />
        <meshStandardMaterial vertexColors roughness={0.90} metalness={0.0} envMapIntensity={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]} receiveShadow>
        <planeGeometry args={[3.2, WORLD_SIZE - 4]} />
        <meshStandardMaterial color="#b8864e" roughness={0.98} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE - 4, 3.2]} />
        <meshStandardMaterial color="#b8864e" roughness={0.98} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[WORLD_SIZE + 4, WORLD_SIZE + 4]} />
        <meshBasicMaterial color="#0d1a0e" />
      </mesh>
    </>
  );
}

function Pond() {
  const waterRef = useRef<THREE.Mesh>(null!), rippleRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const mat = waterRef.current.material as THREE.MeshStandardMaterial, t = clock.elapsedTime;
    mat.color.setRGB(0.28 + 0.04 * Math.sin(t * 0.35), 0.62 + 0.07 * Math.sin(t * 0.28 + 1.1), 0.90 + 0.05 * Math.sin(t * 0.45 + 2.3));
    mat.opacity = 0.78 + 0.06 * Math.sin(t * 0.55);
    mat.envMapIntensity = 2.2 + 0.5 * Math.sin(t * 0.4);
    if (rippleRef.current) { const p = 1.0 + 0.03 * Math.sin(t * 1.2); rippleRef.current.scale.set(p, p, p); }
  });
  const lilyPads = useMemo(() => [
    { pos: [1.2, 0.08, -1.4]  as [number, number, number], i: 0 },
    { pos: [-1.8, 0.08, 0.8]  as [number, number, number], i: 1 },
    { pos: [0.5, 0.08, 2.1]   as [number, number, number], i: 2 },
    { pos: [-2.3, 0.08, -1.2] as [number, number, number], i: 3 },
    { pos: [2.5, 0.08, 1.0]   as [number, number, number], i: 4 },
    { pos: [-0.7, 0.08, -2.5] as [number, number, number], i: 5 },
  ], []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <circleGeometry args={[4.4, 48]} /><meshStandardMaterial color="#0d2a40" roughness={0.8} metalness={0.05} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[4.0, 4.8, 48]} /><meshStandardMaterial color="#7da8c4" roughness={0.95} metalness={0} transparent opacity={0.55} /></mesh>
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <circleGeometry args={[4.0, 48]} /><meshStandardMaterial color="#5ac8fa" roughness={0.04} metalness={0.25} transparent opacity={0.82} envMapIntensity={2.4} /></mesh>
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.072, 0]}>
        <ringGeometry args={[1.8, 2.1, 32]} /><meshBasicMaterial color="#a8d8f0" transparent opacity={0.18} /></mesh>
      {lilyPads.map(({ pos, i }) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, (i * 1.3) % (Math.PI * 2), 0]} position={pos}>
            <circleGeometry args={[0.30 + (i % 3) * 0.05, 14]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#1a5c38' : '#2d6a4f'} roughness={0.75} metalness={0} envMapIntensity={0.4} /></mesh>
          {i % 3 === 0 && <Billboard position={[pos[0], pos[1] + 0.12, pos[2]]}><Text fontSize={0.18} anchorX="center" anchorY="middle">🌸</Text></Billboard>}
        </group>
      ))}
    </group>
  );
}

const TREE_POSITIONS: [number, number, number, number][] = [
  [-14,-6,1.0,0],[-12,8,1.3,1],[-16,2,0.9,2],[13,-7,1.1,0],[14,5,1.4,1],[15,10,0.85,2],
  [-6,-14,1.0,0],[5,-15,1.2,1],[-10,-13,1.3,2],[7,14,0.9,0],[-5,15,1.1,1],[10,13,1.0,2],
  [-17,-1,1.2,0],[16,0,1.0,1],[-3,-17,0.9,2],[3,17,1.3,0],[-14,12,1.0,1],[12,-14,1.1,2],
  [-8,16,0.9,0],[8,-16,1.2,1],[-16,-10,1.0,2],[16,-9,0.85,0],[16,8,1.1,1],[-15,-3,1.3,2],
  [-11,-16,1.0,0],[11,16,0.9,1],[-13,14,1.1,2],[14,-12,1.2,0],[-4,-16,1.0,1],[4,-18,0.9,2],
];
const TREE_GREENS = ['#1a5c38','#206040','#2d6a4f','#166534','#1b4332'];
function Tree({ x, z, scale, variant }: { x: number; z: number; scale: number; variant: number }) {
  const gy = terrainY(x, z), trunk = '#6b3c1f',
        lc = TREE_GREENS[variant % 5], lc2 = TREE_GREENS[(variant + 1) % 5], lc3 = TREE_GREENS[(variant + 2) % 5];
  return (
    <group position={[x, gy, z]} scale={[scale, scale, scale]}>
      <Cylinder args={[0.16, 0.28, 1.5, 8]} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={trunk} roughness={0.97} metalness={0} /></Cylinder>
      <Cylinder args={[0.32, 0.36, 0.3, 8]} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={trunk} roughness={0.97} metalness={0} /></Cylinder>
      <Cone args={[1.4, 2.2, 8]} position={[0, 2.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={lc} roughness={0.86} metalness={0} envMapIntensity={0.25} /></Cone>
      <Cone args={[1.05, 1.9, 8]} position={[0.1, 3.7, 0.05]} castShadow receiveShadow>
        <meshStandardMaterial color={lc2} roughness={0.84} metalness={0} envMapIntensity={0.2} /></Cone>
      <Cone args={[0.68, 1.55, 7]} position={[-0.05, 4.75, -0.05]} castShadow receiveShadow>
        <meshStandardMaterial color={lc3} roughness={0.88} metalness={0} envMapIntensity={0.2} /></Cone>
    </group>
  );
}
function Forest() { return <>{TREE_POSITIONS.map(([x, z, s, v], i) => <Tree key={i} x={x} z={z} scale={s} variant={v} />)}</>; }

function Fireflies() {
  const count = 32;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = 1.8 + Math.random() * 5.5;
      arr[i * 3] = Math.cos(a) * r; arr[i * 3 + 1] = 0.4 + Math.random() * 2.2; arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);
  const attrRef = useRef<THREE.BufferAttribute>(null!);
  const orig    = useMemo(() => Float32Array.from(positions), [positions]);
  useFrame(({ clock }) => {
    if (!attrRef.current) return; const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      attrRef.current.setXYZ(i,
        orig[i * 3]     + Math.sin(t * 0.55 + i * 1.35) * 0.42,
        orig[i * 3 + 1] + Math.sin(t * 0.85 + i * 0.75) * 0.28,
        orig[i * 3 + 2] + Math.cos(t * 0.48 + i * 1.12) * 0.42,
      );
    }
    attrRef.current.needsUpdate = true;
  });
  return (
    <Points>
      <bufferGeometry>
        <bufferAttribute ref={attrRef} attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <PointMaterial size={0.14} color="#fff59d" transparent opacity={0.92} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

function Decorations() {
  return (
    <>
      {([ [-6,3,0.18],[8,-7,0.22],[-9,-4,0.16],[5,10,0.20],[-11,6,0.24],[11,-9,0.19],[-7,11,0.15],[9,8,0.21],[3,-12,0.17],[-12,3,0.20] ] as [number,number,number][]).map(([x,z,r],i) => (
        <Sphere key={i} args={[r,8,6]} position={[x,terrainY(x,z)+r*0.5,z]} castShadow>
          <meshStandardMaterial color={i%2===0?'#6b6560':'#8f8680'} roughness={0.95} metalness={0.04}/></Sphere>
      ))}
      {([ [-4,-8],[7,6],[-8,9],[-3,8],[6,-5],[10,2],[-5,12] ] as [number,number][]).map(([x,z],i) => (
        <group key={i} position={[x,terrainY(x,z),z]}>
          <Cylinder args={[0.06,0.09,0.38,8]} position={[0,0.19,0]} castShadow>
            <meshStandardMaterial color="#ddd0b0" roughness={0.9} metalness={0}/></Cylinder>
          <Sphere args={[0.22,10,8]} position={[0,0.50,0]} castShadow>
            <meshStandardMaterial color={['#dc2626','#ea580c','#9333ea','#0891b2','#16a34a','#e11d48','#854d0e'][i]} roughness={0.6} metalness={0.04} envMapIntensity={0.3}/></Sphere>
        </group>
      ))}
      <group position={[2.0,terrainY(2.0,0.8)+0.01,0.8]}>
        <Box args={[0.1,0.65,0.1]} position={[0,0.33,0]} castShadow><meshStandardMaterial color="#92400e" roughness={0.95} metalness={0}/></Box>
        <Box args={[0.65,0.38,0.07]} position={[0,0.77,0]} castShadow><meshStandardMaterial color="#b45309" roughness={0.9} metalness={0}/></Box>
        <Billboard position={[0,0.77,0.06]}><Text fontSize={0.1} color="#fef9c3" anchorX="center" anchorY="middle">Meadow Haven 🌿</Text></Billboard>
      </group>
    </>
  );
}

const FLOWER_POS: [number,number][] = [ [-7,-5],[5,-7],[-4,6],[8,4],[-9,1],[9,-2],[2,-11],[-2,10],[6,8],[-6,-9],[11,0],[-11,0],[4,6],[-5,-4],[7,-10],[-8,8] ];
function Flower({ pos, collected, onCollect, playerPos }: { pos:[number,number]; collected:boolean; onCollect:()=>void; playerPos:React.MutableRefObject<THREE.Vector3> }) {
  const ref = useRef<THREE.Group>(null!), colRef = useRef(collected);
  colRef.current = collected;
  useFrame(({ clock }) => {
    if (!ref.current || colRef.current) return;
    ref.current.position.y = terrainY(pos[0], pos[1]) + 0.6 + Math.sin(clock.elapsedTime * 2 + pos[0]) * 0.14;
    if (Math.hypot(playerPos.current.x - pos[0], playerPos.current.z - pos[1]) < 1.2 && !colRef.current) onCollect();
  });
  if (collected) return null;
  return (
    <group ref={ref} position={[pos[0], terrainY(pos[0], pos[1]) + 0.6, pos[1]]}>
      <Billboard><Text fontSize={0.45} anchorX="center" anchorY="middle">🌸</Text></Billboard>
    </group>
  );
}

function GlowRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => { if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.3 * Math.sin(clock.elapsedTime * 3); });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <ringGeometry args={[0.9, 1.3, 32]} /><meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

function NPCSprite({ npc, playerPos, onNearby, isNearby, showPrompt }: {
  npc: NPC; playerPos: React.MutableRefObject<THREE.Vector3>;
  onNearby: (npc: NPC|null) => void; isNearby: boolean; showPrompt: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!), wasNear = useRef(false);
  const wx = npc.tx - 12, wz = npc.ty - 9;
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = terrainY(wx, wz) + 0.9 + Math.sin(clock.elapsedTime * 1.2 + npc.tx) * 0.1;
    const near = Math.hypot(playerPos.current.x - wx, playerPos.current.z - wz) < 2.8;
    if (near !== wasNear.current) { wasNear.current = near; onNearby(near ? npc : null); }
  });
  return (
    <group ref={groupRef} position={[wx, terrainY(wx, wz) + 0.9, wz]}>
      {isNearby && <GlowRing color={npc.color} />}
      <Billboard><Text fontSize={0.85} anchorX="center" anchorY="middle">{npc.emoji}</Text></Billboard>
      <Billboard position={[0, 1.3, 0]}><Text fontSize={0.2} color="white" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="black">{npc.name}</Text></Billboard>
      {showPrompt && <Billboard position={[0, 1.9, 0]}><Text fontSize={0.19} color="#fde68a" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#78350f">Press E to talk</Text></Billboard>}
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.50} color="#fff0cc" />
      <directionalLight position={[22,30,10]} intensity={2.2} color="#ffe488" castShadow
        shadow-mapSize={[2048,2048]} shadow-camera-far={110}
        shadow-camera-left={-35} shadow-camera-right={35}
        shadow-camera-top={35} shadow-camera-bottom={-35} shadow-bias={-0.0008} />
      <directionalLight position={[-14,8,-14]} intensity={0.30} color="#b0c8f8" />
      <pointLight position={[0,2.8,0]} intensity={1.4} color="#7ee8fa" distance={11} decay={2} />
      <hemisphereLight args={['#9be8d8','#3a6030',0.38]} />
    </>
  );
}

function CameraRig({ target }: { target: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(target.current.x + CAM_DIST * 0.3, CAM_HEIGHT, target.current.z + CAM_DIST), CAM_LERP);
    camera.lookAt(target.current.x, target.current.y + 0.8, target.current.z);
  });
  return null;
}

function MovementController({ keysRef, posRef, movingRef, facingRef, onPublish, blockedRef }: {
  keysRef: React.MutableRefObject<Set<string>>;
  posRef: React.MutableRefObject<THREE.Vector3>;
  movingRef: React.MutableRefObject<boolean>;
  facingRef: React.MutableRefObject<number>;
  onPublish: (x: number, z: number, moving: boolean) => void;
  blockedRef: React.MutableRefObject<boolean>;
}) {
  useFrame(() => {
    if (blockedRef.current) { movingRef.current = false; return; }
    const k = keysRef.current; let dx = 0, dz = 0;
    if (k.has('ArrowLeft')  || k.has('a') || k.has('A')) dx -= MOVE_SPEED;
    if (k.has('ArrowRight') || k.has('d') || k.has('D')) dx += MOVE_SPEED;
    if (k.has('ArrowUp')    || k.has('w') || k.has('W')) dz -= MOVE_SPEED;
    if (k.has('ArrowDown')  || k.has('s') || k.has('S')) dz += MOVE_SPEED;
    if (dx !== 0 && dz !== 0) { dx *= 0.707; dz *= 0.707; }
    movingRef.current = dx !== 0 || dz !== 0;
    if (!movingRef.current) return;
    facingRef.current = Math.atan2(dx, dz);
    const np = posRef.current.clone().add(new THREE.Vector3(dx, 0, dz));
    const half = WORLD_SIZE / 2 - 2;
    np.x = Math.max(-half, Math.min(half, np.x));
    np.z = Math.max(-half, Math.min(half, np.z));
    if (Math.hypot(np.x, np.z) < POND_RADIUS) return;
    np.y = terrainY(np.x, np.z);
    posRef.current.copy(np);
    onPublish(np.x, np.z, true);
  });
  return null;
}

function Scene({ myEmail, myName, myUid, myColor, onCollect, onBondXP, nearbyNPCRef, setNearbyNPC, blockedRef, posRef, movingRef, facingRef, keysRef }: {
  myEmail: string; myName: string; myUid: string; myColor: string;
  onCollect: (n: number) => void; onBondXP: (xp: number) => void;
  nearbyNPCRef: React.MutableRefObject<NPC|null>; setNearbyNPC: (n: NPC|null) => void;
  blockedRef: React.MutableRefObject<boolean>; posRef: React.MutableRefObject<THREE.Vector3>;
  movingRef: React.MutableRefObject<boolean>; facingRef: React.MutableRefObject<number>;
  keysRef: React.MutableRefObject<Set<string>>;
}) {
  const remotePlayers = useRef<Record<string, PlayerState>>({});
  const { publish, markOnline } = useHeartboundSync(
    myEmail, myName, myColor,
    useCallback((p: Record<string, PlayerState>) => { remotePlayers.current = p; }, []),
  );
  const flowerCountRef = useRef(0);
  const [collectedFlowers, setCollectedFlowers] = useState<Set<number>>(new Set());
  const [remoteSnap, setRemoteSnap] = useState<Record<string, PlayerState>>({});
  useEffect(() => { markOnline(); }, [markOnline]);
  useEffect(() => { const id = setInterval(() => setRemoteSnap({ ...remotePlayers.current }), 100); return () => clearInterval(id); }, []);

  const handleFlowerCollect = useCallback((i: number) => {
    if (collectedFlowers.has(i)) return;
    setCollectedFlowers(prev => new Set([...prev, i]));
    flowerCountRef.current++; onCollect(flowerCountRef.current); onBondXP(5);
  }, [collectedFlowers, onCollect, onBondXP]);

  const onPublish = useCallback((x: number, z: number, moving: boolean) => {
    publish({ x: (x + 10) * 20, y: (z + 9) * 20, dir: 'down', moving });
  }, [publish]);

  const handleNPCNearby = useCallback((npc: NPC|null) => {
    if (nearbyNPCRef.current?.id === npc?.id) return;
    nearbyNPCRef.current = npc; setNearbyNPC(npc);
  }, [nearbyNPCRef, setNearbyNPC]);

  return (
    <>
      <Lighting />
      <Environment preset="sunset" />
      <fog attach="fog" args={['#b8d4c0', 48, 105]} />
      <Sky sunPosition={[80,20,-40]} turbidity={4.2} rayleigh={1.1} mieCoefficient={0.006} mieDirectionalG={0.87} inclination={0.52} azimuth={0.18} />
      <Stars radius={85} depth={40} count={1000} factor={3} fade speed={0.3} />
      <Cloud position={[-18,14,-15]} speed={0.2} opacity={0.55} />
      <Cloud position={[20,16,-20]} speed={0.15} opacity={0.45} />
      <Cloud position={[5,18,-30]} speed={0.18} opacity={0.50} />
      <Terrain /><Pond /><Forest /><Decorations /><Fireflies />

      {FLOWER_POS.map((pos, i) => (
        <Flower key={i} pos={pos} collected={collectedFlowers.has(i)}
          onCollect={() => handleFlowerCollect(i)} playerPos={posRef} />
      ))}
      {NPCS.map(npc => (
        <NPCSprite key={npc.id} npc={npc} playerPos={posRef}
          onNearby={handleNPCNearby}
          isNearby={nearbyNPCRef.current?.id === npc.id}
          showPrompt={nearbyNPCRef.current?.id === npc.id && !blockedRef.current} />
      ))}

      {/* ── LOCAL PLAYER — VRM ── */}
      <VRMCharacter
        email={myEmail}
        uid={myUid}
        posRef={posRef}          // ← live ref, NOT posRef.current
        isLocalPlayer={true}
      />

      {Object.values(remoteSnap)
        .filter(p => p.email !== myEmail && p.online)
        .map(p => <RemoteAvatar key={p.email} player={p} />)
      }

      <CameraRig target={posRef} />
      <MovementController
        keysRef={keysRef} posRef={posRef} movingRef={movingRef}
        facingRef={facingRef} onPublish={onPublish} blockedRef={blockedRef}
      />
    </>
  );
}

function DialogueBox({ npc, lineIdx, onClose }: { npc: NPC; lineIdx: number; onClose: () => void }) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20 pointer-events-auto">
      <div className="rounded-2xl p-4 shadow-2xl border"
        style={{ background: 'rgba(10,6,25,0.93)', backdropFilter: 'blur(14px)', borderColor: npc.color + '55' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{npc.emoji}</span>
          <span className="font-bold text-white text-sm">{npc.name}</span>
          <div className="flex-1" />
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: npc.color + '30', color: npc.color }}>+{npc.xpReward} Bond XP</span>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed mb-3">{npc.lines[lineIdx]}</p>
        <button onClick={onClose}
          className="w-full py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition"
          style={{ background: npc.color + '20', border: `1px solid ${npc.color}30` }}>
          Press E or tap to continue
        </button>
      </div>
    </div>
  );
}

function GameMenu({ bondXP, flowerCount, onClose, onExit, onToggleFullscreen, isFullscreen, quality, onQualityChange }: {
  bondXP: number; flowerCount: number;
  onClose: () => void; onExit: () => void;
  onToggleFullscreen: () => void; isFullscreen: boolean;
  quality: 'high'|'medium'|'low'; onQualityChange: (q:'high'|'medium'|'low') => void;
}) {
  const [tab, setTab] = useState<'inventory'|'profile'|'controls'|'settings'>('inventory');
  const tabs = [
    { key: 'inventory' as const, label: '🎒', full: 'Inventory' },
    { key: 'profile'   as const, label: '👤', full: 'Profile' },
    { key: 'controls'  as const, label: '🎮', full: 'Controls' },
    { key: 'settings'  as const, label: '⚙️',  full: 'Settings' },
  ];
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg mx-3 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg,#0f0c1a 0%,#0c1a0f 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="relative px-6 py-5"
          style={{ background: 'linear-gradient(90deg,rgba(236,72,153,0.18) 0%,rgba(99,102,241,0.18) 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <p className="text-white font-bold text-base leading-none">Meadow Haven</p>
              <p className="text-white/40 text-xs mt-0.5">💕 Bond XP: {bondXP}/100 &nbsp;·&nbsp; 🌸 {flowerCount} flowers</p>
            </div>
          </div>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition text-lg font-bold">✕</button>
        </div>
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-semibold transition ${
                tab === t.key ? 'text-white bg-white/5 border-b-2 border-pink-400' : 'text-white/35 hover:text-white/60 border-b-2 border-transparent'
              }`}>
              <span className="text-base">{t.label}</span><span>{t.full}</span>
            </button>
          ))}
        </div>
        <div className="p-5 min-h-[220px]">
          {tab === 'inventory' && (
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Collected Items</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon:'🌸', label:'Flowers',   count: flowerCount, glow:'rgba(244,114,182,0.3)' },
                  { icon:'🍄', label:'Mushrooms', count: 0,           glow:'rgba(251,146,60,0.15)' },
                  { icon:'💎', label:'Crystals',  count: 0,           glow:'rgba(99,102,241,0.15)' },
                ].map(it => (
                  <div key={it.label}
                    className={`rounded-2xl p-4 flex flex-col items-center gap-1.5 border transition ${it.count > 0 ? 'border-white/15' : 'border-white/5 opacity-40'}`}
                    style={{ background: it.count > 0 ? `radial-gradient(circle at 50% 0%,${it.glow},rgba(255,255,255,0.02))` : 'rgba(255,255,255,0.03)' }}>
                    <span className="text-3xl">{it.icon}</span>
                    <span className="text-white font-bold text-xl">{it.count}</span>
                    <span className="text-white/40 text-xs">{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'profile' && (
            <div className="space-y-3">
              <div className="rounded-2xl p-4 border border-white/8"
                style={{ background: 'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(99,102,241,0.08))' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60 text-xs">💕 Bond XP</span>
                  <span className="text-white/60 text-xs font-bold">{bondXP}/100</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(bondXP,100)}%`, background: 'linear-gradient(90deg,#f472b6,#818cf8)' }} />
                </div>
              </div>
            </div>
          )}
          {tab === 'controls' && (
            <div className="space-y-1.5">
              {[
                { keys: 'W A S D / Arrows', action: 'Move' },
                { keys: 'E / Enter',         action: 'Talk to NPC' },
                { keys: 'Esc / M',           action: 'Menu' },
                { keys: 'F',                 action: 'Fullscreen' },
              ].map(c => (
                <div key={c.action} className="flex items-center justify-between rounded-xl px-4 py-2.5 border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-white/55 text-sm">{c.action}</span>
                  <div className="flex gap-1">
                    {c.keys.split(' / ').map(k => (
                      <kbd key={k} className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-md font-mono">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'settings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl px-4 py-3 border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-white/80 text-sm">🖥️ Fullscreen</span>
                <button onClick={onToggleFullscreen}
                  className={`relative w-12 h-6 rounded-full transition-colors ${isFullscreen ? 'bg-pink-500' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isFullscreen ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="rounded-xl px-4 py-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-white/80 text-sm">🎮 Graphics</span>
                  <span className="text-white/35 text-xs capitalize">{quality}</span>
                </div>
                <div className="flex gap-2">
                  {(['low','medium','high'] as const).map(q => (
                    <button key={q} onClick={() => onQualityChange(q)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        quality === q ? 'bg-pink-500 text-white' : 'bg-white/8 text-white/40 hover:text-white hover:bg-white/15'
                      }`}>{q}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
          <button onClick={onExit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.08))', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
            <span>🚪</span> Exit
          </button>
          <div className="flex-1" />
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white transition hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,#ec4899,#6366f1)', boxShadow: '0 4px 20px rgba(236,72,153,0.35)' }}>▶ Resume</button>
        </div>
      </div>
    </div>
  );
}

function VirtualJoystick({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
  return (
    <div className="absolute bottom-4 right-4 z-10"
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
          style={{ gridColumn: btn.col, gridRow: btn.row }}>{btn.label}</button>
      ))}
    </div>
  );
}

interface Props {
  myColor: string; onBack: () => void;
  bondXP: number; onCollect: (n: number) => void; onBondXP?: (xp: number) => void;
}

export const MeadowHaven3D: React.FC<Props> = ({ myColor, onBack, bondXP, onCollect, onBondXP }) => {
  const { user }    = useAuth();
  const myEmail     = user?.email ?? '';
  const myUid       = user?.uid   ?? '';
  const myName      = getDisplayNameFromEmail(myEmail);
  const quality     = useQualityTier();
  const isTouch     = useIsTouchDevice();

  const containerRef  = useRef<HTMLDivElement>(null);
  const posRef        = useRef(SPAWN.clone());
  const movingRef     = useRef(false);
  const facingRef     = useRef(0);
  const keysRef       = useRef<Set<string>>(new Set());
  const nearbyNPCRef  = useRef<NPC|null>(null);
  const npcLineIdx    = useRef<Record<string, number>>({});
  const talkedToRef   = useRef<Set<string>>(new Set());
  const dialogueRef   = useRef<{ npc: NPC; lineIdx: number }|null>(null);
  const menuOpenRef   = useRef(false);
  const blockedRef    = useRef(false);
  const escPressedRef = useRef(false);

  const [nearbyNPC,       setNearbyNPC]      = useState<NPC|null>(null);
  const [dialogue,        setDialogue]       = useState<{ npc: NPC; lineIdx: number }|null>(null);
  const [menuOpen,        setMenuOpen]       = useState(false);
  const [isFullscreen,    setIsFullscreen]   = useState(false);
  const [flowerCount,     setFlowerCount]    = useState(0);
  const [qualityOverride, setQualityOverride]= useState<'high'|'medium'|'low'|null>(null);
  const effectiveQuality = qualityOverride ?? quality;

  useEffect(() => { dialogueRef.current = dialogue; blockedRef.current = !!dialogue || menuOpenRef.current; }, [dialogue]);
  useEffect(() => { menuOpenRef.current = menuOpen; blockedRef.current = !!dialogueRef.current || menuOpen; }, [menuOpen]);

  const requestFS = useCallback(() => containerRef.current?.requestFullscreen().catch(() => {}), []);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) requestFS(); else document.exitFullscreen().catch(() => {});
  }, [requestFS]);

  useEffect(() => {
    const onFSChange = () => {
      const isNowFS = !!document.fullscreenElement;
      setIsFullscreen(isNowFS);
      if (!isNowFS && escPressedRef.current) { escPressedRef.current = false; requestFS(); }
    };
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, [requestFS]);

  const openDialogue = useCallback((npc: NPC) => {
    const idx = npcLineIdx.current[npc.id] ?? 0;
    npcLineIdx.current[npc.id] = (idx + 1) % npc.lines.length;
    setDialogue({ npc, lineIdx: idx });
    if (!talkedToRef.current.has(npc.id)) { talkedToRef.current.add(npc.id); onBondXP?.(npc.xpReward); }
  }, [onBondXP]);
  const closeDialogue = useCallback(() => setDialogue(null), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (e.key === 'Escape') {
        e.preventDefault(); escPressedRef.current = true;
        if (dialogueRef.current) { escPressedRef.current = false; closeDialogue(); }
        else setMenuOpen(p => !p);
        return;
      }
      keysRef.current.add(e.key);
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (dialogueRef.current) closeDialogue();
        else if (!menuOpenRef.current && nearbyNPCRef.current) openDialogue(nearbyNPCRef.current);
        return;
      }
      if (e.key === 'm' || e.key === 'M') { if (dialogueRef.current) closeDialogue(); else setMenuOpen(p => !p); return; }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
    };
    const up   = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const blur = () => keysRef.current.clear();
    document.addEventListener('keydown', down, true);
    document.addEventListener('keyup',   up);
    window.addEventListener('blur',      blur);
    return () => {
      document.removeEventListener('keydown', down, true);
      document.removeEventListener('keyup',   up);
      window.removeEventListener('blur',      blur);
    };
  }, [closeDialogue, openDialogue, toggleFullscreen]);

  const handleCollect = useCallback((count: number) => { setFlowerCount(count); onCollect(count); }, [onCollect]);
  const handleExit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onBack();
  }, [onBack]);

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
        camera={{ position: [11, CAM_HEIGHT, CAM_DIST], fov: 62 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: effectiveQuality !== 'low',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: effectiveQuality === 'high' ? 1.1 : 1.0,
          powerPreference: effectiveQuality === 'low' ? 'low-power' : 'high-performance',
        }}
        tabIndex={-1}
      >
        <Suspense fallback={null}>
          <Scene
            myEmail={myEmail} myName={myName} myUid={myUid} myColor={myColor}
            onCollect={handleCollect} onBondXP={onBondXP ?? (() => {})}
            nearbyNPCRef={nearbyNPCRef} setNearbyNPC={setNearbyNPC}
            blockedRef={blockedRef} posRef={posRef}
            movingRef={movingRef} facingRef={facingRef} keysRef={keysRef}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/45 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-white text-xs font-bold">💕 Bond XP</span>
          <div className="w-32 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(bondXP,100)}%`, background: 'linear-gradient(90deg,#f472b6,#34d399)' }} />
          </div>
          <span className="text-white/70 text-xs">{bondXP}/100</span>
        </div>
      </div>

      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="bg-black/45 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium">🌸 {flowerCount}</div>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <button onClick={() => setMenuOpen(true)}
          className="bg-black/45 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/60 transition">☰ Menu</button>
      </div>

      {dialogue && <DialogueBox npc={dialogue.npc} lineIdx={dialogue.lineIdx} onClose={closeDialogue} />}

      {menuOpen && (
        <GameMenu
          bondXP={bondXP} flowerCount={flowerCount}
          onClose={() => setMenuOpen(false)}
          onExit={handleExit}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          quality={effectiveQuality}
          onQualityChange={setQualityOverride}
        />
      )}

      {nearbyNPC && !dialogue && !menuOpen && isTouch && (
        <button onClick={() => openDialogue(nearbyNPC)}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg animate-bounce z-10"
          style={{ background: nearbyNPC.color }}>
          Talk to {nearbyNPC.name} {nearbyNPC.emoji}
        </button>
      )}

      {isTouch && <VirtualJoystick keysRef={keysRef} />}

      {!isTouch && (
        <div className="absolute bottom-3 left-3 z-10 text-white/35 text-xs pointer-events-none">
          WASD / Arrows · E to talk · Esc / M for menu · F fullscreen
        </div>
      )}
    </div>
  );
};
