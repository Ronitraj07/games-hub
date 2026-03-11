/**
 * MeadowHaven3D — Phase 6F
 * -------------------------
 * Full atmospheric 3D world using @react-three/fiber + drei.
 * - Isometric-style camera (like Sky / Animal Crossing)
 * - Rolling terrain with hills, grass, path tiles
 * - Animated sky gradient + fog
 * - Directional sunlight with soft shadows
 * - 3D capsule avatars (you + partner) with name labels
 * - NPC billboard sprites (emoji) with glow ring + proximity prompt
 * - Glowing pond
 * - Flower pickups (bob animation)
 * - Fixed controls via ref (zero re-render bug)
 * - Fullscreen toggle
 * - Mobile virtual joystick
 */
import React, {
  useRef, useEffect, useCallback, useState, Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Sky, Stars, Billboard, Text, Html, Cylinder,
  Sphere, Box, Plane, RoundedBox, Environment,
} from '@react-three/drei';
import * as THREE from 'three';
import { useHeartboundSync, PlayerState } from '@/hooks/firebase/useHeartboundSync';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayNameFromEmail } from '@/lib/auth-config';
import { NPCS, NPC, NPC_INTERACT_RANGE } from './npcData';

// ── World constants ──────────────────────────────────────────────
const WORLD_SIZE  = 40;   // 40×40 units
const MOVE_SPEED  = 0.08;
const CAM_DIST    = 18;
const CAM_HEIGHT  = 14;
const CAM_ANGLE   = -0.45; // radians tilt (isometric)

// Terrain height map (simple procedural hills)
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
      const z = pos.getY(i); // plane is XY before rotation
      pos.setZ(i, terrainY(x, z));
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  }, []);

  return (
    <>
      {/* Main grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geo} args={[WORLD_SIZE, WORLD_SIZE, 80, 80]} />
        <meshLambertMaterial color="#4ade80" />
      </mesh>

      {/* Forest border wall */}
      {Array.from({ length: 20 }).map((_, i) => {
        const t = (i / 20) * Math.PI * 2;
        const r = WORLD_SIZE / 2 - 1;
        return (
          <group key={i} position={[Math.cos(t) * r, 0, Math.sin(t) * r]}>
            <Cylinder args={[0.6, 0.8, 3 + Math.random() * 2, 6]} castShadow>
              <meshLambertMaterial color="#15803d" />
            </Cylinder>
            <Sphere
              args={[1.2, 8, 6]}
              position={[0, 2.5, 0]}
              castShadow
            >
              <meshLambertMaterial color={i % 3 === 0 ? '#166534' : '#16a34a'} />
            </Sphere>
          </group>
        );
      })}

      {/* Dirt path (cross-shaped) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3, WORLD_SIZE - 4]} />
        <meshLambertMaterial color="#d4a574" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[WORLD_SIZE - 4, 3]} />
        <meshLambertMaterial color="#d4a574" />
      </mesh>

      {/* Pond */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[4, 32]} />
        <meshLambertMaterial color="#7dd3fc" transparent opacity={0.75} />
      </mesh>
      {/* Pond rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[4, 4.4, 32]} />
        <meshLambertMaterial color="#bae6fd" />
      </mesh>
    </>
  );
}

// ── Flowers ──────────────────────────────────────────────────────
const FLOWER_POS: [number, number][] = [
  [-8, -6], [6, -8], [-5, 7], [9, 5],
  [-10, 2], [10, -3], [3, -12], [-3, 11],
  [7, 9], [-7, -10], [12, 1], [-12, -1],
];

function Flower({
  pos, collected, onCollect, playerPos,
}: {
  pos: [number, number];
  collected: boolean;
  onCollect: () => void;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const ref2 = useRef<THREE.Group>(null!);
  const collected2 = useRef(collected);
  collected2.current = collected;

  useFrame(({ clock }) => {
    if (!ref2.current || collected2.current) return;
    ref2.current.position.y = terrainY(pos[0], pos[1]) + 0.5 + Math.sin(clock.elapsedTime * 2 + pos[0]) * 0.12;

    // Proximity collect
    const dx = playerPos.current.x - pos[0];
    const dz = playerPos.current.z - pos[1];
    if (Math.hypot(dx, dz) < 1.2 && !collected2.current) {
      onCollect();
    }
  });

  if (collected) return null;

  return (
    <group ref={ref2} position={[pos[0], terrainY(pos[0], pos[1]) + 0.5, pos[1]]}>
      <Billboard>
        <Text fontSize={0.5} anchorX="center" anchorY="middle">🌸</Text>
      </Billboard>
    </group>
  );
}

// ── NPC ──────────────────────────────────────────────────────────
function NPCSprite({
  npc, playerPos, onNearby, isNearby, showPrompt,
}: {
  npc: NPC;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  onNearby: (npc: NPC | null) => void;
  isNearby: boolean;
  showPrompt: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const wasNear   = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Bob animation
    groupRef.current.position.y = terrainY(npc.tx - 12, npc.ty - 9) + 0.8
      + Math.sin(clock.elapsedTime * 1.2 + npc.tx) * 0.08;

    // Proximity
    const dx = playerPos.current.x - (npc.tx - 12);
    const dz = playerPos.current.z - (npc.ty - 9);
    const dist = Math.hypot(dx, dz);
    const near = dist < 2.5;
    if (near !== wasNear.current) {
      wasNear.current = near;
      onNearby(near ? npc : null);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[npc.tx - 12, terrainY(npc.tx - 12, npc.ty - 9) + 0.8, npc.ty - 9]}
    >
      {/* Glow ring when nearby */}
      {isNearby && (
        <GlowRing color={npc.color} />
      )}

      {/* Emoji billboard */}
      <Billboard>
        <Text fontSize={0.8} anchorX="center" anchorY="middle">{npc.emoji}</Text>
      </Billboard>

      {/* Name tag */}
      <Billboard position={[0, 1.2, 0]}>
        <Text
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="black"
        >
          {npc.name}
        </Text>
      </Billboard>

      {/* Press E prompt */}
      {showPrompt && (
        <Billboard position={[0, 1.8, 0]}>
          <Text
            fontSize={0.18}
            color="#fde68a"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#92400e"
          >
            Press E to talk
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function GlowRing({ color }: { color: string }) {
  const ref2 = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref2.current) {
      const mat = ref2.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + 0.3 * Math.sin(clock.elapsedTime * 3);
    }
  });
  return (
    <mesh ref={ref2} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <ringGeometry args={[0.9, 1.2, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Player Avatar ────────────────────────────────────────────────
function Avatar({
  position, color, name, isMe, moving,
}: {
  position: [number, number, number];
  color:    string;
  name:     string;
  isMe:     boolean;
  moving:   boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // Bob when moving
    const bob = moving ? Math.sin(clock.elapsedTime * 8) * 0.05 : 0;
    groupRef.current.position.set(
      position[0],
      position[1] + bob,
      position[2],
    );
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.2} />
      </mesh>

      {/* Body */}
      <Cylinder
        args={[0.22, 0.28, 0.7, 12]}
        position={[0, 0.35, 0]}
        castShadow
      >
        <meshLambertMaterial color={color} />
      </Cylinder>

      {/* Head */}
      <Sphere args={[0.28, 16, 12]} position={[0, 0.92, 0]} castShadow>
        <meshLambertMaterial color="#fde7c3" />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.05, 8, 8]} position={[0.1, 0.97, 0.22]}>
        <meshBasicMaterial color="#1e293b" />
      </Sphere>
      <Sphere args={[0.05, 8, 8]} position={[-0.1, 0.97, 0.22]}>
        <meshBasicMaterial color="#1e293b" />
      </Sphere>

      {/* Selection ring for local player */}
      {isMe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <ringGeometry args={[0.38, 0.46, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Name label */}
      <Billboard position={[0, 1.5, 0]}>
        <Text
          fontSize={0.22}
          color={isMe ? color : 'white'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="black"
        >
          {name}{isMe ? ' ★' : ''}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Remote player (position interpolated) ────────────────────────
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
      color={player.spriteColor}
      name={player.name}
      isMe={false}
      moving={player.moving}
    />
  );
}

// ── Ambient decorations ──────────────────────────────────────────
function Decorations() {
  return (
    <>
      {/* Scattered small rocks */}
      {[[-6,3],[8,-7],[-9,-4],[5,10],[-11,6],[11,-9]].map(([x,z],i)=>(
        <Sphere key={i} args={[0.18+i*0.04,8,6]} position={[x,terrainY(x,z)+0.12,z]} castShadow>
          <meshLambertMaterial color="#94a3b8" />
        </Sphere>
      ))}
      {/* Mushrooms */}
      {[[-4,-8],[7,6],[-8,9]].map(([x,z],i)=>(
        <group key={i} position={[x,terrainY(x,z),z]}>
          <Cylinder args={[0.08,0.1,0.35,8]} position={[0,0.18,0]} castShadow>
            <meshLambertMaterial color="#e2d5b0" />
          </Cylinder>
          <Sphere args={[0.22,10,8]} position={[0,0.48,0]} castShadow>
            <meshLambertMaterial color={i===1?'#ef4444':'#f97316'} />
          </Sphere>
        </group>
      ))}
      {/* Wooden sign near spawn */}
      <group position={[1.8, terrainY(1.8, 0.5), 0.5]}>
        <Box args={[0.08, 0.6, 0.08]} position={[0, 0.3, 0]} castShadow>
          <meshLambertMaterial color="#92400e" />
        </Box>
        <Box args={[0.6, 0.35, 0.06]} position={[0, 0.7, 0]} castShadow>
          <meshLambertMaterial color="#b45309" />
        </Box>
        <Billboard position={[0, 0.7, 0.05]}>
          <Text fontSize={0.1} color="#fef9c3" anchorX="center" anchorY="middle">
            {'Meadow Haven 🌿'}
          </Text>
        </Billboard>
      </group>
    </>
  );
}

// ── Lighting ─────────────────────────────────────────────────────
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} color="#fff8e7" />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.4}
        color="#fff9e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      {/* Soft fill from opposite */}
      <directionalLight position={[-10, 8, -10]} intensity={0.3} color="#c7d2fe" />
      {/* Warm point near pond */}
      <pointLight position={[0, 2, 0]} intensity={0.8} color="#bae6fd" distance={8} />
    </>
  );
}

// ── Camera controller ────────────────────────────────────────────
function CameraRig({ target }: { target: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  useFrame(() => {
    const tx = target.current.x;
    const tz = target.current.z;
    camera.position.lerp(
      new THREE.Vector3(tx + CAM_DIST * 0.6, CAM_HEIGHT, tz + CAM_DIST),
      0.08,
    );
    camera.lookAt(tx, target.current.y + 1, tz);
  });
  return null;
}

// ── Movement controller (runs inside Canvas) ─────────────────────
interface ControllerProps {
  keysRef:    React.MutableRefObject<Set<string>>;
  posRef:     React.MutableRefObject<THREE.Vector3>;
  movingRef:  React.MutableRefObject<boolean>;
  onPublish:  (x: number, y: number, moving: boolean) => void;
  dialogOpen: React.MutableRefObject<boolean>;
}

function MovementController({ keysRef, posRef, movingRef, onPublish, dialogOpen }: ControllerProps) {
  useFrame(() => {
    if (dialogOpen.current) { movingRef.current = false; return; }
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
    // Pond boundary (radius 4)
    if (Math.hypot(np.x, np.z) > 4.2) {
      np.y = terrainY(np.x, np.z);
      posRef.current.copy(np);
      onPublish(np.x, np.z, true);
    }
  });
  return null;
}

// ── Main scene ───────────────────────────────────────────────────
interface SceneProps {
  myEmail:   string;
  myName:    string;
  myColor:   string;
  bondXP:    number;
  onCollect: (count: number) => void;
  onBondXP:  (xp: number) => void;
  nearbyNPCRef:  React.MutableRefObject<NPC | null>;
  setNearbyNPC:  (n: NPC | null) => void;
  dialogOpen:    React.MutableRefObject<boolean>;
  posRef:        React.MutableRefObject<THREE.Vector3>;
  movingRef:     React.MutableRefObject<boolean>;
  keysRef:       React.MutableRefObject<Set<string>>;
}

function Scene({
  myEmail, myName, myColor,
  onCollect, onBondXP,
  nearbyNPCRef, setNearbyNPC,
  dialogOpen, posRef, movingRef, keysRef,
}: SceneProps) {
  const remotePlayers = useRef<Record<string, PlayerState>>({});
  const handleRemote  = useCallback((p: Record<string, PlayerState>) => {
    remotePlayers.current = p;
  }, []);

  const { publish, markOnline } = useHeartboundSync(myEmail, myName, myColor, handleRemote);
  const flowerCount = useRef(0);
  const talkedTo    = useRef<Set<string>>(new Set());
  const [collectedFlowers, setCollectedFlowers] = useState<Set<number>>(new Set());
  const [remoteSnap, setRemoteSnap] = useState<Record<string, PlayerState>>({});

  useEffect(() => { markOnline(); }, [markOnline]);

  // Sync remote players to state at ~10fps
  useEffect(() => {
    const id = setInterval(() => setRemoteSnap({ ...remotePlayers.current }), 100);
    return () => clearInterval(id);
  }, []);

  const handleFlowerCollect = (i: number) => {
    if (collectedFlowers.has(i)) return;
    setCollectedFlowers(prev => new Set([...prev, i]));
    flowerCount.current++;
    onCollect(flowerCount.current);
    onBondXP(5);
  };

  const onPublish = useCallback((x: number, z: number, moving: boolean) => {
    // Convert 3D coords back to legacy 2D for Firebase
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
      <Sky
        sunPosition={[100, 30, 100]}
        turbidity={3}
        rayleigh={0.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <Terrain />
      <Decorations />

      {/* Flowers */}
      {FLOWER_POS.map((pos, i) => (
        <Flower
          key={i}
          pos={pos}
          collected={collectedFlowers.has(i)}
          onCollect={() => handleFlowerCollect(i)}
          playerPos={posRef}
        />
      ))}

      {/* NPCs */}
      {NPCS.map(npc => (
        <NPCSprite
          key={npc.id}
          npc={npc}
          playerPos={posRef}
          onNearby={handleNPCNearby}
          isNearby={nearbyNPCRef.current?.id === npc.id}
          showPrompt={nearbyNPCRef.current?.id === npc.id && !dialogOpen.current}
        />
      ))}

      {/* Local player */}
      <Avatar
        position={[posRef.current.x, terrainY(posRef.current.x, posRef.current.z), posRef.current.z]}
        color={myColor}
        name={myName}
        isMe={true}
        moving={movingRef.current}
      />

      {/* Remote players */}
      {Object.values(remoteSnap)
        .filter(p => p.email !== myEmail && p.online)
        .map(p => <RemoteAvatar key={p.email} player={p} />)
      }

      {/* Camera + movement */}
      <CameraRig target={posRef} />
      <MovementController
        keysRef={keysRef}
        posRef={posRef}
        movingRef={movingRef}
        onPublish={onPublish}
        dialogOpen={dialogOpen}
      />
    </>
  );
}

// ── Dialogue overlay (React DOM, outside Canvas) ─────────────────
interface DialogueProps {
  npc:      NPC;
  lineIdx:  number;
  onClose:  () => void;
}
function DialogueBox({ npc, lineIdx, onClose }: DialogueProps) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20 pointer-events-auto">
      <div
        className="rounded-2xl p-4 shadow-2xl border"
        style={{
          background: 'rgba(10,6,25,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor: npc.color + '55',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{npc.emoji}</span>
          <span className="font-bold text-white text-sm">{npc.name}</span>
          <div className="flex-1" />
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: npc.color + '30', color: npc.color }}
          >+{npc.xpReward} Bond XP</span>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed mb-3">
          {npc.lines[lineIdx]}
        </p>
        <button
          onClick={onClose}
          className="w-full py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition"
          style={{ background: npc.color + '20', border: `1px solid ${npc.color}30` }}
        >
          Press E or tap to continue
        </button>
      </div>
    </div>
  );
}

// ── Mobile joystick ──────────────────────────────────────────────
function VirtualJoystick({ keysRef }: { keysRef: React.MutableRefObject<Set<string>> }) {
  return (
    <div className="md:hidden absolute bottom-4 right-4 grid grid-cols-3 gap-1 opacity-85 z-10">
      {([
        { label: '↑', key: 'ArrowUp',    col: 2, row: 1 },
        { label: '←', key: 'ArrowLeft',  col: 1, row: 2 },
        { label: '↓', key: 'ArrowDown',  col: 2, row: 2 },
        { label: '→', key: 'ArrowRight', col: 3, row: 2 },
      ] as const).map(btn => (
        <button
          key={btn.key}
          onPointerDown={() => keysRef.current.add(btn.key)}
          onPointerUp={() => keysRef.current.delete(btn.key)}
          onPointerLeave={() => keysRef.current.delete(btn.key)}
          className="w-12 h-12 bg-white/25 backdrop-blur rounded-xl text-xl font-bold text-white active:bg-white/50 transition select-none"
          style={{ gridColumn: btn.col, gridRow: btn.row }}
        >{btn.label}</button>
      ))}
    </div>
  );
}

// ── Root export ──────────────────────────────────────────────────
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

  const containerRef = useRef<HTMLDivElement>(null);
  const posRef       = useRef(new THREE.Vector3(0, 0, 2));
  const movingRef    = useRef(false);
  const keysRef      = useRef<Set<string>>(new Set());
  const dialogOpen   = useRef(false);
  const nearbyNPCRef = useRef<NPC | null>(null);
  const npcLineIdx   = useRef<Record<string, number>>({});
  const talkedTo     = useRef<Set<string>>(new Set());

  const [nearbyNPC,   setNearbyNPC]   = useState<NPC | null>(null);
  const [dialogue,    setDialogue]    = useState<{ npc: NPC; lineIdx: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flowerCount, setFlowerCount] = useState(0);

  // Keep dialogOpen ref in sync
  useEffect(() => { dialogOpen.current = !!dialogue; }, [dialogue]);

  // ── Keyboard ────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Prevent arrow scroll
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      keysRef.current.add(e.key);

      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
        if (dialogue) {
          closeDialogue();
        } else if (nearbyNPCRef.current) {
          openDialogue(nearbyNPCRef.current);
        }
      }
      if (e.key === 'Escape') closeDialogue();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [dialogue]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const openDialogue = useCallback((npc: NPC) => {
    const idx = npcLineIdx.current[npc.id] ?? 0;
    npcLineIdx.current[npc.id] = (idx + 1) % npc.lines.length;
    setDialogue({ npc, lineIdx: idx });
    if (!talkedTo.current.has(npc.id)) {
      talkedTo.current.add(npc.id);
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
      className="relative w-full select-none"
      style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 120px)', minHeight: 400, background: '#0a1628' }}
    >
      {/* Three.js Canvas */}
      <Canvas
        shadows
        camera={{ position: [8, CAM_HEIGHT, CAM_DIST], fov: 55 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene
            myEmail={myEmail}
            myName={myName}
            myColor={myColor}
            bondXP={bondXP}
            onCollect={handleCollect}
            onBondXP={onBondXP ?? (() => {})}
            nearbyNPCRef={nearbyNPCRef}
            setNearbyNPC={setNearbyNPC}
            dialogOpen={dialogOpen}
            posRef={posRef}
            movingRef={movingRef}
            keysRef={keysRef}
          />
        </Suspense>
      </Canvas>

      {/* HUD — Bond XP bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur rounded-full px-4 py-1.5 flex items-center gap-2">
          <span className="text-white text-xs font-bold">💕 Bond XP</span>
          <div className="w-32 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(bondXP, 100)}%` }}
            />
          </div>
          <span className="text-white/70 text-xs">{bondXP}/100</span>
        </div>
      </div>

      {/* Flowers counter */}
      <div className="absolute top-3 right-16 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur rounded-full px-3 py-1 text-white text-xs font-medium">
          🌸 {flowerCount}
        </div>
      </div>

      {/* Dialogue */}
      {dialogue && (
        <DialogueBox
          npc={dialogue.npc}
          lineIdx={dialogue.lineIdx}
          onClose={closeDialogue}
        />
      )}

      {/* Mobile talk button */}
      {nearbyNPC && !dialogue && (
        <button
          onClick={() => openDialogue(nearbyNPC)}
          className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg animate-bounce z-10"
          style={{ background: nearbyNPC.color }}
        >
          Talk to {nearbyNPC.name} {nearbyNPC.emoji}
        </button>
      )}

      {/* Virtual joystick */}
      <VirtualJoystick keysRef={keysRef} />

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur text-white text-sm px-3 py-1.5 rounded-full hover:bg-black/60 transition"
        title="Toggle fullscreen (F)"
      >
        {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-black/60 transition"
      >
        ← Exit
      </button>

      {/* Desktop hint */}
      <div className="hidden md:block absolute bottom-3 left-3 z-10 text-white/40 text-xs pointer-events-none">
        WASD / Arrow keys to move &nbsp;|&nbsp; E to talk &nbsp;|&nbsp; F for fullscreen
      </div>
    </div>
  );
};
