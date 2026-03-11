/**
 * MeadowHaven3D — Phase 7A
 * -------------------------
 * FIXES:
 * - Single permanent keydown/keyup listener (no [dialogue] dep array)
 * - All state read via refs inside listener — zero re-registration
 * - keysRef.current.clear() on window blur — no stuck keys
 * - Container div gets tabIndex={-1} + focus() on mount — canvas no longer steals focus
 * - Auto-fullscreen triggered from HeartboundAdventures on enter
 * - menuOpenRef gates movement
 */
import React, {
  useRef, useEffect, useCallback, useState, Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, Billboard, Text, Cylinder, Sphere, Box,
} from '@react-three/drei';
import * as THREE from 'three';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import { NPCS, NPC } from './npcData';

// ── World constants ──────────────────────────────────────────────
const WORLD_SIZE = 40;
const MOVE_SPEED = 0.08;
const CAM_DIST   = 18;
const CAM_HEIGHT = 14;

function terrainY(x: number, z: number): number {
  return (
    Math.sin(x * 0.3) * 0.4 +
    Math.cos(z * 0.25) * 0.35 +
    Math.sin((x + z) * 0.15) * 0.25
  );
}

// ── Terrain ──────────────────────────────────────────────────────
function Terrain() {
  const geo = useRef<THREE.PlaneGeometry>(null!);
  useEffect(() => {
    const g = geo.current;
    if (!g) return;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      pos.setZ(i, terrainY(x, z));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geo} args={[WORLD_SIZE, WORLD_SIZE, 80, 80]} />
        <meshLambertMaterial color="#4ade80" />
      </mesh>
      {Array.from({ length: 20 }).map((_, i) => {
        const t = (i / 20) * Math.PI * 2;
        const r = WORLD_SIZE / 2 - 1;
        return (
          <group key={i} position={[Math.cos(t) * r, 0, Math.sin(t) * r]}>
            <Cylinder args={[0.6, 0.8, 3 + (i % 3) * 0.7, 6]} castShadow>
              <meshLambertMaterial color="#15803d" />
            </Cylinder>
            <Sphere args={[1.2, 8, 6]} position={[0, 2.5, 0]} castShadow>
              <meshLambertMaterial color={i % 3 === 0 ? '#166534' : '#16a34a'} />
            </Sphere>
          </group>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3, WORLD_SIZE - 4]} />
        <meshLambertMaterial color="#d4a574" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[WORLD_SIZE - 4, 3]} />
        <meshLambertMaterial color="#d4a574" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[4, 32]} />
        <meshLambertMaterial color="#7dd3fc" transparent opacity={0.75} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[4, 4.4, 32]} />
        <meshLambertMaterial color="#bae6fd" />
      </mesh>
    </>
  );
}

// ── Flowers ──────────────────────────────────────────────────────
const FLOWER_POS: [number, number][] = [
  [-8,-6],[6,-8],[-5,7],[9,5],[-10,2],[10,-3],
  [3,-12],[-3,11],[7,9],[-7,-10],[12,1],[-12,-1],
];

function Flower({ pos, collected, onCollect, playerPos }: {
  pos: [number, number];
  collected: boolean;
  onCollect: () => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const ref = useRef<THREE.Group>(null!);
  const colRef = useRef(collected);
  colRef.current = collected;
  useFrame(({ clock }) => {
    if (!ref.current || colRef.current) return;
    ref.current.position.y = terrainY(pos[0], pos[1]) + 0.5 + Math.sin(clock.elapsedTime * 2 + pos[0]) * 0.12;
    const dx = playerPos.current.x - pos[0];
    const dz = playerPos.current.z - pos[1];
    if (Math.hypot(dx, dz) < 1.2 && !colRef.current) onCollect();
  });
  if (collected) return null;
  return (
    <group ref={ref} position={[pos[0], terrainY(pos[0], pos[1]) + 0.5, pos[1]]}>
      <Billboard>
        <Text fontSize={0.5} anchorX="center" anchorY="middle">🌸</Text>
      </Billboard>
    </group>
  );
}

// ── Glow ring ─────────────────────────────────────────────────────
function GlowRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + 0.3 * Math.sin(clock.elapsedTime * 3);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <ringGeometry args={[0.9, 1.2, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── NPC ──────────────────────────────────────────────────────────
function NPCSprite({ npc, playerPos, onNearby, isNearby, showPrompt }: {
  npc: NPC;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  onNearby: (npc: NPC | null) => void;
  isNearby: boolean;
  showPrompt: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const wasNear  = useRef(false);
  const wx = npc.tx - 12;
  const wz = npc.ty - 9;
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = terrainY(wx, wz) + 0.8 + Math.sin(clock.elapsedTime * 1.2 + npc.tx) * 0.08;
    const near = Math.hypot(playerPos.current.x - wx, playerPos.current.z - wz) < 2.5;
    if (near !== wasNear.current) { wasNear.current = near; onNearby(near ? npc : null); }
  });
  return (
    <group ref={groupRef} position={[wx, terrainY(wx, wz) + 0.8, wz]}>
      {isNearby && <GlowRing color={npc.color} />}
      <Billboard>
        <Text fontSize={0.8} anchorX="center" anchorY="middle">{npc.emoji}</Text>
      </Billboard>
      <Billboard position={[0, 1.2, 0]}>
        <Text fontSize={0.18} color="white" anchorX="center" anchorY="middle"
          outlineWidth={0.03} outlineColor="black">{npc.name}</Text>
      </Billboard>
      {showPrompt && (
        <Billboard position={[0, 1.8, 0]}>
          <Text fontSize={0.18} color="#fde68a" anchorX="center" anchorY="middle"
            outlineWidth={0.03} outlineColor="#92400e">Press E to talk</Text>
        </Billboard>
      )}
    </group>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ position, color, name, isMe, moving }: {
  position: [number, number, number];
  color: string; name: string; isMe: boolean; moving: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const movRef   = useRef(moving);
  movRef.current = moving;
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const bob = movRef.current ? Math.sin(clock.elapsedTime * 8) * 0.05 : 0;
    groupRef.current.position.set(position[0], position[1] + bob, position[2]);
  });
  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>
      <Cylinder args={[0.22, 0.28, 0.7, 12]} position={[0, 0.35, 0]} castShadow>
        <meshLambertMaterial color={color} />
      </Cylinder>
      <Sphere args={[0.28, 16, 12]} position={[0, 0.92, 0]} castShadow>
        <meshLambertMaterial color="#fde7c3" />
      </Sphere>
      <Sphere args={[0.05, 8, 8]} position={[0.1, 0.97, 0.22]}>
        <meshBasicMaterial color="#1e293b" />
      </Sphere>
      <Sphere args={[0.05, 8, 8]} position={[-0.1, 0.97, 0.22]}>
        <meshBasicMaterial color="#1e293b" />
      </Sphere>
      {isMe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <ringGeometry args={[0.38, 0.46, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}
      <Billboard position={[0, 1.5, 0]}>
        <Text fontSize={0.22} color={isMe ? color : 'white'} anchorX="center" anchorY="middle"
          outlineWidth={0.04} outlineColor="black">
          {name}{isMe ? ' ★' : ''}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Remote avatar ─────────────────────────────────────────────────
function RemoteAvatar({ player }: { player: PlayerState }) {
  const pos = useRef(new THREE.Vector3(player.x / 20 - 10, 0, player.y / 20 - 9));
  useFrame(() => {
    const tx = player.x / 20 - 10;
    const tz = player.y / 20 - 9;
    pos.current.lerp(new THREE.Vector3(tx, terrainY(tx, tz), tz), 0.12);
  });
  if (!player.online) return null;
  return (
    <Avatar
      position={[pos.current.x, pos.current.y, pos.current.z]}
      color={player.spriteColor} name={player.name} isMe={false} moving={player.moving}
    />
  );
}

// ── Decorations ───────────────────────────────────────────────────
function Decorations() {
  return (
    <>
      {[[-6,3],[8,-7],[-9,-4],[5,10],[-11,6],[11,-9]].map(([x,z],i) => (
        <Sphere key={i} args={[0.18+i*0.04,8,6]} position={[x,terrainY(x,z)+0.12,z]} castShadow>
          <meshLambertMaterial color="#94a3b8" />
        </Sphere>
      ))}
      {[[-4,-8],[7,6],[-8,9]].map(([x,z],i) => (
        <group key={i} position={[x,terrainY(x,z),z]}>
          <Cylinder args={[0.08,0.1,0.35,8]} position={[0,0.18,0]} castShadow>
            <meshLambertMaterial color="#e2d5b0" />
          </Cylinder>
          <Sphere args={[0.22,10,8]} position={[0,0.48,0]} castShadow>
            <meshLambertMaterial color={i===1?'#ef4444':'#f97316'} />
          </Sphere>
        </group>
      ))}
      <group position={[1.8, terrainY(1.8, 0.5), 0.5]}>
        <Box args={[0.08,0.6,0.08]} position={[0,0.3,0]} castShadow>
          <meshLambertMaterial color="#92400e" />
        </Box>
        <Box args={[0.6,0.35,0.06]} position={[0,0.7,0]} castShadow>
          <meshLambertMaterial color="#b45309" />
        </Box>
        <Billboard position={[0,0.7,0.05]}>
          <Text fontSize={0.1} color="#fef9c3" anchorX="center" anchorY="middle">Meadow Haven 🌿</Text>
        </Billboard>
      </group>
    </>
  );
}

// ── Lighting ──────────────────────────────────────────────────────
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#fff8e7" />
      <directionalLight position={[15,20,10]} intensity={1.4} color="#fff9e6" castShadow
        shadow-mapSize={[2048,2048]} shadow-camera-far={80}
        shadow-camera-left={-25} shadow-camera-right={25}
        shadow-camera-top={25} shadow-camera-bottom={-25} />
      <directionalLight position={[-10,8,-10]} intensity={0.3} color="#c7d2fe" />
      <pointLight position={[0,2,0]} intensity={0.8} color="#bae6fd" distance={8} />
    </>
  );
}

// ── Camera ────────────────────────────────────────────────────────
function CameraRig({ target }: { target: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(
      new THREE.Vector3(target.current.x + CAM_DIST * 0.6, CAM_HEIGHT, target.current.z + CAM_DIST),
      0.08,
    );
    camera.lookAt(target.current.x, target.current.y + 1, target.current.z);
  });
  return null;
}

// ── Movement controller ───────────────────────────────────────────
function MovementController({ keysRef, posRef, movingRef, onPublish, blockedRef }: {
  keysRef:    React.MutableRefObject<Set<string>>;
  posRef:     React.MutableRefObject<THREE.Vector3>;
  movingRef:  React.MutableRefObject<boolean>;
  onPublish:  (x: number, z: number, moving: boolean) => void;
  blockedRef: React.MutableRefObject<boolean>; // dialogue OR menu open
}) {
  useFrame(() => {
    if (blockedRef.current) { movingRef.current = false; return; }
    const k = keysRef.current;
    let dx = 0, dz = 0;
    if (k.has('ArrowLeft')  || k.has('a') || k.has('A')) dx -= MOVE_SPEED;
    if (k.has('ArrowRight') || k.has('d') || k.has('D')) dx += MOVE_SPEED;
    if (k.has('ArrowUp')    || k.has('w') || k.has('W')) dz -= MOVE_SPEED;
    if (k.has('ArrowDown')  || k.has('s') || k.has('S')) dz += MOVE_SPEED;
    if (dx !== 0 && dz !== 0) { dx *= 0.707; dz *= 0.707; }
    movingRef.current = dx !== 0 || dz !== 0;
    if (!movingRef.current) return;
    const np = posRef.current.clone().add(new THREE.Vector3(dx, 0, dz));
    const half = WORLD_SIZE / 2 - 1.5;
    np.x = Math.max(-half, Math.min(half, np.x));
    np.z = Math.max(-half, Math.min(half, np.z));
    if (Math.hypot(np.x, np.z) > 4.2) {
      np.y = terrainY(np.x, np.z);
      posRef.current.copy(np);
      onPublish(np.x, np.z, true);
    }
  });
  return null;
}

// ── Scene ─────────────────────────────────────────────────────────
function Scene({
  myEmail, myName, myColor,
  onCollect, onBondXP,
  nearbyNPCRef, setNearbyNPC,
  blockedRef, posRef, movingRef, keysRef,
}: {
  myEmail: string; myName: string; myColor: string;
  onCollect: (n: number) => void; onBondXP: (xp: number) => void;
  nearbyNPCRef: React.MutableRefObject<NPC | null>;
  setNearbyNPC: (n: NPC | null) => void;
  blockedRef: React.MutableRefObject<boolean>;
  posRef: React.MutableRefObject<THREE.Vector3>;
  movingRef: React.MutableRefObject<boolean>;
  keysRef: React.MutableRefObject<Set<string>>;
}) {
  const remotePlayers = useRef<Record<string, PlayerState>>({});
  const handleRemote  = useCallback((p: Record<string, PlayerState>) => { remotePlayers.current = p; }, []);
  const { publish, markOnline } = useHeartboundSync(myEmail, myName, myColor, handleRemote);
  const flowerCountRef = useRef(0);
  const [collectedFlowers, setCollectedFlowers] = useState<Set<number>>(new Set());
  const [remoteSnap, setRemoteSnap]             = useState<Record<string, PlayerState>>({});

  useEffect(() => { markOnline(); }, [markOnline]);
  useEffect(() => {
    const id = setInterval(() => setRemoteSnap({ ...remotePlayers.current }), 100);
    return () => clearInterval(id);
  }, []);

  const handleFlowerCollect = useCallback((i: number) => {
    if (collectedFlowers.has(i)) return;
    setCollectedFlowers(prev => new Set([...prev, i]));
    flowerCountRef.current++;
    onCollect(flowerCountRef.current);
    onBondXP(5);
  }, [collectedFlowers, onCollect, onBondXP]);

  const onPublish = useCallback((x: number, z: number, moving: boolean) => {
    publish({ x: (x + 10) * 20, y: (z + 9) * 20, dir: 'down', moving });
  }, [publish]);

  const handleNPCNearby = useCallback((npc: NPC | null) => {
    if (nearbyNPCRef.current?.id === npc?.id) return;
    nearbyNPCRef.current = npc;
    setNearbyNPC(npc);
  }, [nearbyNPCRef, setNearbyNPC]);

  return (
    <>
      <Lighting />
      <fog attach="fog" args={['#d4edda', 30, 65]} />
      <Sky sunPosition={[100,30,100]} turbidity={3} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Terrain />
      <Decorations />
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
      <Avatar
        position={[posRef.current.x, terrainY(posRef.current.x, posRef.current.z), posRef.current.z]}
        color={myColor} name={myName} isMe moving={movingRef.current}
      />
      {Object.values(remoteSnap).filter(p => p.email !== myEmail && p.online).map(p => (
        <RemoteAvatar key={p.email} player={p} />
      ))}
      <CameraRig target={posRef} />
      <MovementController keysRef={keysRef} posRef={posRef} movingRef={movingRef}
        onPublish={onPublish} blockedRef={blockedRef} />
    </>
  );
}

// ── Dialogue box ──────────────────────────────────────────────────
function DialogueBox({ npc, lineIdx, onClose }: { npc: NPC; lineIdx: number; onClose: () => void }) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20 pointer-events-auto">
      <div className="rounded-2xl p-4 shadow-2xl border"
        style={{ background: 'rgba(10,6,25,0.92)', backdropFilter: 'blur(12px)', borderColor: npc.color + '55' }}>
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

// ── In-game menu ──────────────────────────────────────────────────
function GameMenu({ bondXP, flowerCount, onClose, onToggleFullscreen, isFullscreen }: {
  bondXP: number;
  flowerCount: number;
  onClose: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  const [tab, setTab] = useState<'inventory' | 'profile' | 'controls' | 'settings'>('inventory');
  const tabs = [
    { key: 'inventory', label: '🎒 Inventory' },
    { key: 'profile',   label: '👤 Profile' },
    { key: 'controls',  label: '🎮 Controls' },
    { key: 'settings',  label: '⚙️ Settings' },
  ] as const;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(10,8,20,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <span className="text-white font-bold text-lg">🌿 Meadow Haven</span>
          <button onClick={onClose}
            className="text-white/50 hover:text-white transition text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
            ✕
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/10">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-xs font-semibold transition ${
                tab === t.key
                  ? 'text-white border-b-2 border-pink-400 bg-white/5'
                  : 'text-white/40 hover:text-white/70'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[240px]">

          {tab === 'inventory' && (
            <div>
              <h3 className="text-white font-bold mb-4">Collected Items</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/10">
                  <span className="text-3xl">🌸</span>
                  <span className="text-white font-bold text-lg">{flowerCount}</span>
                  <span className="text-white/40 text-xs">Flowers</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/10 opacity-40">
                  <span className="text-3xl">🍄</span>
                  <span className="text-white font-bold text-lg">0</span>
                  <span className="text-white/40 text-xs">Mushrooms</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/10 opacity-40">
                  <span className="text-3xl">💎</span>
                  <span className="text-white font-bold text-lg">0</span>
                  <span className="text-white/40 text-xs">Crystals</span>
                </div>
              </div>
              <p className="text-white/30 text-xs mt-4 text-center">More items unlock as you explore 🌿</p>
            </div>
          )}

          {tab === 'profile' && (
            <div>
              <h3 className="text-white font-bold mb-4">Your Profile</h3>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ background: '#60a5fa' }} />
                  <div>
                    <p className="text-white font-semibold text-sm">Explorer</p>
                    <p className="text-white/40 text-xs">Bond Level 1 — Wanderer</p>
                  </div>
                </div>
                <div className="mb-1 flex justify-between">
                  <span className="text-white/60 text-xs">💕 Bond XP</span>
                  <span className="text-white/60 text-xs">{bondXP}/100</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(bondXP, 100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Flowers collected', value: flowerCount, icon: '🌸' },
                  { label: 'NPCs talked to',    value: 0,           icon: '💬' },
                  { label: 'Distance walked',   value: '0m',        icon: '👣' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                    <span className="text-white/60 text-sm">{s.icon} {s.label}</span>
                    <span className="text-white font-bold text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'controls' && (
            <div>
              <h3 className="text-white font-bold mb-4">Controls</h3>
              <div className="space-y-2">
                {[
                  { keys: 'W / ↑',         action: 'Move forward' },
                  { keys: 'S / ↓',         action: 'Move backward' },
                  { keys: 'A / ←',         action: 'Move left' },
                  { keys: 'D / →',         action: 'Move right' },
                  { keys: 'E / Enter',      action: 'Talk to NPC / Continue dialogue' },
                  { keys: 'M / Escape',     action: 'Open / close menu' },
                  { keys: 'F',             action: 'Toggle fullscreen' },
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

          {tab === 'settings' && (
            <div>
              <h3 className="text-white font-bold mb-4">Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-white/80 text-sm">🖥️ Fullscreen</span>
                  <button onClick={onToggleFullscreen}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isFullscreen ? 'bg-pink-500' : 'bg-white/20'
                    }`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      isFullscreen ? 'left-6' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <span className="text-white/80 text-sm">🏷️ Show name tags</span>
                  <button className="relative w-12 h-6 rounded-full transition-colors bg-pink-500">
                    <span className="absolute top-0.5 left-6 w-5 h-5 rounded-full bg-white shadow" />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 opacity-50">
                  <span className="text-white/80 text-sm">🎵 Ambient music</span>
                  <span className="text-white/40 text-xs">Coming in Phase 7D</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 opacity-50">
                  <span className="text-white/80 text-sm">🌫️ Fog density</span>
                  <span className="text-white/40 text-xs">Coming in Phase 7C</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-white/30 text-xs">M or Esc to close</span>
          <button onClick={onClose}
            className="bg-pink-500 hover:bg-pink-400 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile joystick ───────────────────────────────────────────────
function VirtualJoystick({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
  return (
    <div className="md:hidden absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-85 z-10" style={{gridTemplateRows:'repeat(2,1fr)'}}>
      {([
        { label: '↑', key: 'ArrowUp',    col: 2, row: 1 },
        { label: '←', key: 'ArrowLeft',  col: 1, row: 2 },
        { label: '↓', key: 'ArrowDown',  col: 2, row: 2 },
        { label: '→', key: 'ArrowRight', col: 3, row: 2 },
      ] as const).map(btn => (
        <button key={btn.key}
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); keysRef.current.add(btn.key); }}
          onPointerUp={() => keysRef.current.delete(btn.key)}
          onPointerLeave={() => keysRef.current.delete(btn.key)}
          onPointerCancel={() => keysRef.current.delete(btn.key)}
          className="w-12 h-12 bg-white/25 backdrop-blur rounded-xl text-xl font-bold text-white active:bg-white/50 transition select-none touch-none"
          style={{ gridColumn: btn.col, gridRow: btn.row }}>
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────
interface Props {
  myColor:   string;
  onBack:    () => void;
  bondXP:    number;
  onCollect: (count: number) => void;
  onBondXP?: (xp: number)   => void;
}

export const MeadowHaven3D: React.FC<Props> = ({ myColor, onBack, bondXP, onCollect, onBondXP }) => {
  const { user } = useAuth();
  const myEmail  = user?.email ?? '';
  const myName   = getDisplayNameFromEmail(myEmail);

  const containerRef  = useRef<HTMLDivElement>(null);
  const posRef        = useRef(new THREE.Vector3(0, 0, 2));
  const movingRef     = useRef(false);
  const keysRef       = useRef<Set<string>>(new Set());
  const nearbyNPCRef  = useRef<NPC | null>(null);
  const npcLineIdx    = useRef<Record<string, number>>({});
  const talkedToRef   = useRef<Set<string>>(new Set());

  // All state that the keydown handler needs, kept in refs to avoid re-registration
  const dialogueRef   = useRef<{ npc: NPC; lineIdx: number } | null>(null);
  const menuOpenRef   = useRef(false);
  const blockedRef    = useRef(false); // dialogue OR menu

  const [nearbyNPC,    setNearbyNPC]    = useState<NPC | null>(null);
  const [dialogue,     setDialogue]     = useState<{ npc: NPC; lineIdx: number } | null>(null);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flowerCount,  setFlowerCount]  = useState(0);

  // Keep refs in sync with state
  useEffect(() => { dialogueRef.current = dialogue; blockedRef.current = !!dialogue || menuOpenRef.current; }, [dialogue]);
  useEffect(() => { menuOpenRef.current = menuOpen; blockedRef.current = !!dialogueRef.current || menuOpen; }, [menuOpen]);

  // ── Auto-focus so keyboard works immediately ─────────────────────
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // ── Fullscreen change listener ───────────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ── Single permanent keyboard listener (NO dependency array) ─────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();

      // Movement keys always into ref
      keysRef.current.add(e.key);

      // Action keys — read state via refs, never trigger re-registration
      const hasDialogue = !!dialogueRef.current;
      const hasMenu     = menuOpenRef.current;

      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (hasDialogue) {
          closeDialogue();
        } else if (!hasMenu && nearbyNPCRef.current) {
          openDialogue(nearbyNPCRef.current);
        }
      }

      if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        if (hasDialogue) {
          closeDialogue();
        } else {
          setMenuOpen(prev => !prev);
        }
      }

      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };

    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    // Clear all keys if window loses focus (prevents stuck movement)
    const blur = () => keysRef.current.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    window.addEventListener('blur',    blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
      window.removeEventListener('blur',    blur);
    };
  }, []); // ← EMPTY — never re-registers

  const openDialogue = useCallback((npc: NPC) => {
    const idx = npcLineIdx.current[npc.id] ?? 0;
    npcLineIdx.current[npc.id] = (idx + 1) % npc.lines.length;
    setDialogue({ npc, lineIdx: idx });
    if (!talkedToRef.current.has(npc.id)) {
      talkedToRef.current.add(npc.id);
      onBondXP?.(npc.xpReward);
    }
  }, [onBondXP]);

  const closeDialogue = useCallback(() => setDialogue(null), []);

  const handleCollect = useCallback((count: number) => {
    setFlowerCount(count);
    onCollect(count);
  }, [onCollect]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="relative w-full select-none outline-none"
      style={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        minHeight: 400,
        background: '#0a1628',
      }}
      // Re-focus if canvas click steals focus back to div
      onPointerDown={() => containerRef.current?.focus()}
    >
      {/* Canvas */}
      <Canvas
        shadows
        camera={{ position: [8, CAM_HEIGHT, CAM_DIST], fov: 55 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        // Prevent canvas from capturing keyboard focus
        tabIndex={-1}
      >
        <Suspense fallback={null}>
          <Scene
            myEmail={myEmail} myName={myName} myColor={myColor}
            onCollect={handleCollect} onBondXP={onBondXP ?? (() => {})}
            nearbyNPCRef={nearbyNPCRef} setNearbyNPC={setNearbyNPC}
            blockedRef={blockedRef} posRef={posRef}
            movingRef={movingRef} keysRef={keysRef}
          />
        </Suspense>
      </Canvas>

      {/* HUD — Bond XP */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-white text-xs font-bold">💕 Bond XP</span>
          <div className="w-32 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(bondXP, 100)}%` }} />
          </div>
          <span className="text-white/70 text-xs">{bondXP}/100</span>
        </div>
      </div>

      {/* Flowers counter */}
      <div className="absolute top-3 right-36 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur rounded-full px-3 py-1 text-white text-xs font-medium">
          🌸 {flowerCount}
        </div>
      </div>

      {/* Dialogue */}
      {dialogue && (
        <DialogueBox npc={dialogue.npc} lineIdx={dialogue.lineIdx} onClose={closeDialogue} />
      )}

      {/* In-game menu */}
      {menuOpen && (
        <GameMenu
          bondXP={bondXP}
          flowerCount={flowerCount}
          onClose={() => setMenuOpen(false)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Mobile: talk button */}
      {nearbyNPC && !dialogue && !menuOpen && (
        <button
          onClick={() => openDialogue(nearbyNPC)}
          className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg animate-bounce z-10"
          style={{ background: nearbyNPC.color }}>
          Talk to {nearbyNPC.name} {nearbyNPC.emoji}
        </button>
      )}

      {/* Virtual joystick */}
      <VirtualJoystick keysRef={keysRef} />

      {/* Menu button (top-right area) */}
      <button
        onClick={() => setMenuOpen(true)}
        className="absolute top-3 right-20 z-10 bg-black/40 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/60 transition"
        title="Menu (M)">
        ☰ Menu
      </button>

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/60 transition"
        title="Fullscreen (F)">
        {isFullscreen ? '⛶ Exit' : '⛶'}
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/60 transition">
        ← Exit
      </button>

      {/* Desktop hint */}
      <div className="hidden md:block absolute bottom-3 left-3 z-10 text-white/40 text-xs pointer-events-none">
        WASD / Arrows to move &nbsp;·&nbsp; E to talk &nbsp;·&nbsp; M for menu &nbsp;·&nbsp; F fullscreen
      </div>
    </div>
  );
};
