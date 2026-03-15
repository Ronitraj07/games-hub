/**
 * MeadowHaven3D — Phase 7F/Step 1+2
 *
 * What changed:
 *  - WORLD_SIZE: 48 → 400 (8× area increase)
 *  - Terrain: inline primitive → Terrain component (200×200 segs, noise heightmap, 2-layer vertex color, island falloff)
 *  - Trees:   30 hardcoded primitives → Forest component (240 instances, 4 species, 3-layer canopy, seeded placement)
 *  - Rocks:   10 smooth spheres → Rocks component (80 clusters, displaced IcosahedronGeometry)
 *  - Pond:    radius 3.8 → 14, proportional to new world
 *  - Fog:     linear fog(30,80) → fogExp2(0.006) — exponential atmospheric haze
 *  - Lights:  shadow camera widened to cover 400u
 *  - Atmosphere: Fireflies 32→80, BlossomPetals 300 added
 *  - Scale anchors: DistantMountains (7 peaks), OceanPlane
 *  - Movement bounds: clamped to ±192 (island edge)
 *  - SPAWN moved to (8, 0, 8) — still near center/campfire
 *  - Camera offset scaled up (was 7u back, now 14u back)
 *  - NPC positions remapped to new coordinate space
 *
 * All gameplay systems preserved: VRM avatars, NPC dialogues,
 * flower collection, Firebase sync, menu, quality tier, joystick.
 */
import React, {
  useRef, useEffect, useCallback, useState, Suspense, useMemo,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Billboard, Text, Environment,
} from '@react-three/drei';
import * as THREE from 'three';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import { NPCS, NPC } from './npcData';
import { VRMCharacter } from './character/VRMCharacter';
import { MovementController } from './gameplay/MovementController';
import { Terrain, OceanPlane, DistantMountains, terrainHeight, WORLD_HALF } from './world/Terrain';
import { Forest } from './world/Trees';
import { Rocks } from './world/Rocks';
import { Pond } from './world/Pond';
import { Lighting } from './world/Lighting';
import { Atmosphere, Fireflies, BlossomPetals } from './world/Atmosphere';

// ─── Constants ───────────────────────────────────────────────────────────────
const SPAWN = new THREE.Vector3(8, 0, 8);

const CAM_OFFSET = new THREE.Vector3(0, 14, 20);
const CAM_LERP   = 0.07;
const CAM_LOOK_Y = 2.0;

const MOVE_BOUND  = 190;
const POND_RADIUS = 14;

// ─── NPC world position remapping ────────────────────────────────────────────
const NPC_SCALE = WORLD_HALF / 14;
function npcWorldPos(npc: NPC): [number, number, number] {
  const wx = (npc.tx - 12) * NPC_SCALE * 0.55;
  const wz = (npc.ty - 9)  * NPC_SCALE * 0.55;
  return [wx, terrainHeight(wx, wz) + 1.0, wz];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Remote avatar ────────────────────────────────────────────────────────────
function RemoteAvatar({ player }: { player: PlayerState }) {
  const posRef       = useRef(new THREE.Vector3(
    player.x / 20 - 10, 0, player.y / 20 - 9,
  ));
  const movingRef    = useRef(player.moving);
  const sprintingRef = useRef(player.sprinting ?? false);
  useFrame(() => {
    const tx = player.x / 20 - 10, tz = player.y / 20 - 9;
    const prev = posRef.current.clone();
    posRef.current.lerp(new THREE.Vector3(tx, terrainHeight(tx, tz), tz), 0.12);
    movingRef.current    = posRef.current.distanceTo(prev) > 0.001;
    sprintingRef.current = player.sprinting ?? false;
  });
  if (!player.online) return null;
  return (
    <VRMCharacter
      email={player.email} uid={player.email}
      posRef={posRef} movingRef={movingRef} sprintingRef={sprintingRef}
      isLocalPlayer={false}
    />
  );
}

// ─── Flower collectibles ────────────────────────────────────────────────────────
const FLOWER_POS: [number, number][] = [
  [-28,-20],[20,-28],[-16,24],[32,16],[-36,4],[36,-8],[8,-44],
  [-8,40],[24,32],[-24,-36],[44,0],[-44,0],[16,24],[-20,-16],
  [28,-40],[-32,32],[40,-28],[-30,44],[10,-50],[50,10],
];

function Flower({ pos, collected, onCollect, playerPos }: {
  pos: [number, number]; collected: boolean; onCollect: () => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const ref    = useRef<THREE.Group>(null!);
  const colRef = useRef(collected);
  colRef.current = collected;
  useFrame(({ clock }) => {
    if (!ref.current || colRef.current) return;
    ref.current.position.y = terrainHeight(pos[0], pos[1]) + 1.2
      + Math.sin(clock.elapsedTime * 2 + pos[0]) * 0.25;
    if (
      Math.hypot(playerPos.current.x - pos[0], playerPos.current.z - pos[1]) < 2.5
      && !colRef.current
    ) onCollect();
  });
  if (collected) return null;
  return (
    <group ref={ref} position={[pos[0], terrainHeight(pos[0], pos[1]) + 1.2, pos[1]]}>
      <Billboard>
        <Text fontSize={0.7} anchorX="center" anchorY="middle">🌸</Text>
      </Billboard>
    </group>
  );
}

// ─── Glow ring ───────────────────────────────────────────────────────────────────
function GlowRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current)
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + 0.3 * Math.sin(clock.elapsedTime * 3);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
      <ringGeometry args={[1.4, 2.0, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── NPC sprite ───────────────────────────────────────────────────────────────
function NPCSprite({ npc, playerPos, onNearby, isNearby, showPrompt }: {
  npc: NPC; playerPos: React.MutableRefObject<THREE.Vector3>;
  onNearby: (npc: NPC | null) => void; isNearby: boolean; showPrompt: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const wasNear  = useRef(false);
  const [wx, , wz] = npcWorldPos(npc);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      terrainHeight(wx, wz) + 1.2 + Math.sin(clock.elapsedTime * 1.2 + npc.tx) * 0.15;
    const near = Math.hypot(playerPos.current.x - wx, playerPos.current.z - wz) < 4.5;
    if (near !== wasNear.current) { wasNear.current = near; onNearby(near ? npc : null); }
  });
  return (
    <group ref={groupRef} position={[wx, terrainHeight(wx, wz) + 1.2, wz]}>
      {isNearby && <GlowRing color={npc.color} />}
      <Billboard>
        <Text fontSize={1.1} anchorX="center" anchorY="middle">{npc.emoji}</Text>
      </Billboard>
      <Billboard position={[0, 1.8, 0]}>
        <Text fontSize={0.28} color="white" anchorX="center" anchorY="middle"
          outlineWidth={0.04} outlineColor="black">{npc.name}</Text>
      </Billboard>
      {showPrompt && (
        <Billboard position={[0, 2.6, 0]}>
          <Text fontSize={0.24} color="#fde68a" anchorX="center" anchorY="middle"
            outlineWidth={0.04} outlineColor="#78350f">Press E to talk</Text>
        </Billboard>
      )}
    </group>
  );
}

// ─── Camera rig ───────────────────────────────────────────────────────────────
function CameraRig({ target }: { target: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  const camTarget  = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = target.current;
    camTarget.current.set(p.x + CAM_OFFSET.x, p.y + CAM_OFFSET.y, p.z + CAM_OFFSET.z);
    camera.position.lerp(camTarget.current, CAM_LERP);
    camera.lookAt(p.x, p.y + CAM_LOOK_Y, p.z);
  });
  return null;
}

// ─── Scene ─────────────────────────────────────────────────────────────────────
function Scene({
  myEmail, myName, myUid, myColor,
  onCollect, onBondXP,
  nearbyNPCRef, setNearbyNPC,
  blockedRef, posRef, movingRef, sprintingRef, facingRef, keysRef,
}: {
  myEmail: string; myName: string; myUid: string; myColor: string;
  onCollect: (n: number) => void; onBondXP: (xp: number) => void;
  nearbyNPCRef: React.MutableRefObject<NPC | null>;
  setNearbyNPC: (n: NPC | null) => void;
  blockedRef: React.MutableRefObject<boolean>;
  posRef: React.MutableRefObject<THREE.Vector3>;
  movingRef: React.MutableRefObject<boolean>;
  sprintingRef: React.MutableRefObject<boolean>;
  facingRef: React.MutableRefObject<number>;
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

  const onPublish = useCallback((x: number, z: number, moving: boolean, sprinting: boolean) => {
    publish({ x: (x + 10) * 20, y: (z + 9) * 20, dir: 'down', moving, sprinting });
  }, [publish]);

  const handleNPCNearby = useCallback((npc: NPC | null) => {
    if (nearbyNPCRef.current?.id === npc?.id) return;
    nearbyNPCRef.current = npc;
    setNearbyNPC(npc);
  }, [nearbyNPCRef, setNearbyNPC]);

  return (
    <>
      <Lighting />
      <Environment preset="sunset" />
      <Terrain />
      <OceanPlane />
      <DistantMountains />
      <Pond />
      <Forest />
      <Rocks />
      <Atmosphere />
      <Fireflies />
      <BlossomPetals />

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

      <VRMCharacter
        email={myEmail} uid={myUid}
        posRef={posRef} movingRef={movingRef}
        sprintingRef={sprintingRef} facingRef={facingRef}
        isLocalPlayer={true}
      />

      {Object.values(remoteSnap)
        .filter(p => p.email !== myEmail && p.online)
        .map(p => <RemoteAvatar key={p.email} player={p} />)
      }

      <CameraRig target={posRef} />
      <MovementController
        keysRef={keysRef} posRef={posRef} movingRef={movingRef}
        sprintingRef={sprintingRef} facingRef={facingRef}
        onPublish={onPublish} blockedRef={blockedRef}
        moveBound={MOVE_BOUND}
        pondRadius={POND_RADIUS}
      />
    </>
  );
}

// ─── Dialogue box ─────────────────────────────────────────────────────────────
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

// ─── Game menu ────────────────────────────────────────────────────────────────
function GameMenu({ bondXP, flowerCount, onClose, onExit, onToggleFullscreen, isFullscreen, quality, onQualityChange }: {
  bondXP: number; flowerCount: number;
  onClose: () => void; onExit: () => void;
  onToggleFullscreen: () => void; isFullscreen: boolean;
  quality: 'high' | 'medium' | 'low'; onQualityChange: (q: 'high' | 'medium' | 'low') => void;
}) {
  const [tab, setTab] = useState<'inventory' | 'profile' | 'controls' | 'settings'>('inventory');
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
                tab === t.key
                  ? 'text-white bg-white/5 border-b-2 border-pink-400'
                  : 'text-white/35 hover:text-white/60 border-b-2 border-transparent'
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
                  { icon: '🌸', label: 'Flowers',   count: flowerCount, glow: 'rgba(244,114,182,0.3)' },
                  { icon: '🍄', label: 'Mushrooms', count: 0,           glow: 'rgba(251,146,60,0.15)' },
                  { icon: '💎', label: 'Crystals',  count: 0,           glow: 'rgba(99,102,241,0.15)' },
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
                    style={{ width: `${Math.min(bondXP, 100)}%`, background: 'linear-gradient(90deg,#f472b6,#818cf8)' }} />
                </div>
              </div>
            </div>
          )}
          {tab === 'controls' && (
            <div className="space-y-1.5">
              {[
                { keys: 'W A S D / Arrows', action: 'Move' },
                { keys: 'Shift',            action: 'Sprint' },
                { keys: 'E / Enter',        action: 'Talk to NPC' },
                { keys: 'Esc / M',          action: 'Menu' },
                { keys: 'F',               action: 'Fullscreen' },
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
                  {(['low', 'medium', 'high'] as const).map(q => (
                    <button key={q} onClick={() => onQualityChange(q)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                        quality === q
                          ? 'bg-pink-500 text-white'
                          : 'bg-white/8 text-white/40 hover:text-white hover:bg-white/15'
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

// ─── Virtual joystick ─────────────────────────────────────────────────────────
function VirtualJoystick({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
  return (
    <div className="absolute bottom-4 right-4 z-10"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3,3rem)', gridTemplateRows: 'repeat(2,3rem)', gap: '0.25rem' }}>
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
          className="bg-white/25 backdrop-blur rounded-xl text-xl font-bold text-white active:bg-white/50 transition select-none touch-none flex items-center justify-center"
          style={{ gridColumn: btn.col, gridRow: btn.row }}>{btn.label}</button>
      ))}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
interface Props {
  myColor: string; onBack: () => void;
  bondXP: number; onCollect: (n: number) => void; onBondXP?: (xp: number) => void;
}

export const MeadowHaven3D: React.FC<Props> = ({ myColor, onBack, bondXP, onCollect, onBondXP }) => {
  const { user }   = useAuth();
  const myEmail    = user?.email ?? '';
  const myUid      = user?.uid   ?? '';
  const myName     = getDisplayNameFromEmail(myEmail);
  const quality    = useQualityTier();
  const isTouch    = useIsTouchDevice();

  const containerRef   = useRef<HTMLDivElement>(null);
  const posRef         = useRef(SPAWN.clone());
  const movingRef      = useRef(false);
  const sprintingRef   = useRef(false);
  const facingRef      = useRef(0);
  const keysRef        = useRef<Set<string>>(new Set());
  const nearbyNPCRef   = useRef<NPC | null>(null);
  const npcLineIdx     = useRef<Record<string, number>>({});
  const talkedToRef    = useRef<Set<string>>(new Set());
  const dialogueRef    = useRef<{ npc: NPC; lineIdx: number } | null>(null);
  const menuOpenRef    = useRef(false);
  const blockedRef     = useRef(false);
  const escPressedRef  = useRef(false);

  const [nearbyNPC,       setNearbyNPC]       = useState<NPC | null>(null);
  const [dialogue,        setDialogue]        = useState<{ npc: NPC; lineIdx: number } | null>(null);
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [flowerCount,     setFlowerCount]     = useState(0);
  const [qualityOverride, setQualityOverride] = useState<'high' | 'medium' | 'low' | null>(null);
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
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'Escape') {
        e.preventDefault(); escPressedRef.current = true;
        if (dialogueRef.current) { escPressedRef.current = false; closeDialogue(); }
        else setMenuOpen(p => !p);
        return;
      }
      keysRef.current.add(e.key);
      if (e.key === 'ShiftLeft' || e.key === 'ShiftRight') keysRef.current.add('Shift');
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (dialogueRef.current) closeDialogue();
        else if (!menuOpenRef.current && nearbyNPCRef.current) openDialogue(nearbyNPCRef.current);
        return;
      }
      if (e.key === 'm' || e.key === 'M') { if (dialogueRef.current) closeDialogue(); else setMenuOpen(p => !p); return; }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight') {
        keysRef.current.delete('Shift');
        keysRef.current.delete('ShiftLeft');
        keysRef.current.delete('ShiftRight');
      }
    };
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
        camera={{
          position: [SPAWN.x + CAM_OFFSET.x, SPAWN.y + CAM_OFFSET.y, SPAWN.z + CAM_OFFSET.z],
          fov: 60,
          near: 0.5,
          far: 1200,
        }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: effectiveQuality !== 'low',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: effectiveQuality === 'high' ? 1.12 : 1.0,
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
            movingRef={movingRef} sprintingRef={sprintingRef}
            facingRef={facingRef} keysRef={keysRef}
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/45 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-white text-xs font-bold">💕 Bond XP</span>
          <div className="w-32 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(bondXP, 100)}%`, background: 'linear-gradient(90deg,#f472b6,#34d399)' }} />
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
          WASD / Arrows · Shift to sprint · E to talk · Esc / M menu · F fullscreen
        </div>
      )}
    </div>
  );
};
