/**
 * SkyCharacterV2
 * Extended SKY-style character with:
 * - Cape with verlet-chain physics
 * - Flowing / wild / windswept hair physics
 * - All avatar_config fields (capeColor, capeAccent, capeStyle, maskStyle, height)
 * - Backwards-compatible with old AvatarConfig (skinTone, hairColor, hairStyle, outfitColor, accessory)
 * - Zero GLB files — pure Three.js primitives + procedural animation
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Cylinder, Sphere, Box, Cone, Torus, Billboard, Text,
} from '@react-three/drei';
import * as THREE from 'three';
import { useCapePhysics } from './CapePhysics';
import { useHairPhysics } from './HairPhysics';
import { useProceduralAnim, AnimState } from './useProceduralAnim';

// ── Types ──────────────────────────────────────────────────────────
export interface AvatarConfigV2 {
  // Core (Phase 0 compat)
  skinTone:    string;
  hairColor:   string;
  hairStyle:   'short' | 'long' | 'bun' | 'none' | 'flowing' | 'wild' | 'windswept';
  outfitColor: string;
  accessory:   'none' | 'hat' | 'crown' | 'halo';
  // Phase 1 additions
  capeColor:   string;
  capeAccent:  string;
  capeStyle:   'standard' | 'tattered' | 'royal' | 'none';
  maskStyle:   'none' | 'half' | 'full' | 'visor';
  accentColor: string;
  height:      number; // 0.8 – 1.2 scale multiplier
}

export const DEFAULT_AVATAR_V2: AvatarConfigV2 = {
  skinTone:    '#fde7c3',
  hairColor:   '#3b1f0a',
  hairStyle:   'flowing',
  outfitColor: '#6366f1',
  accessory:   'none',
  capeColor:   '#6366f1',
  capeAccent:  '#a78bfa',
  capeStyle:   'standard',
  maskStyle:   'none',
  accentColor: '#f472b6',
  height:      1.0,
};

// ── Terrain sampler (passed in from world) ────────────────────────
type TerrainFn = (x: number, z: number) => number;

// ── Props ──────────────────────────────────────────────────────────
interface SkyCharacterV2Props {
  config: AvatarConfigV2;
  name: string;
  isMe: boolean;
  terrainFn?: TerrainFn;
  posRef?: React.MutableRefObject<THREE.Vector3>;
  movingRef?: React.MutableRefObject<boolean>;
  facingRef?: React.MutableRefObject<number>;
  staticPos?: [number, number, number];
  moving?: boolean;
  facingAngle?: number;
  animState?: AnimState;
}

export function SkyCharacterV2({
  config, name, isMe,
  terrainFn,
  posRef, movingRef, facingRef,
  staticPos, moving = false, facingAngle = 0,
  animState = 'idle',
}: SkyCharacterV2Props) {
  const rootRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const lArmRef = useRef<THREE.Group>(null!);
  const rArmRef = useRef<THREE.Group>(null!);
  const lLegRef = useRef<THREE.Group>(null!);
  const rLegRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);

  const movRef = useRef(moving);
  const angRef = useRef(facingAngle);
  movRef.current = moving;
  angRef.current = facingAngle;

  // Physics hooks
  const capeChain = useCapePhysics(config.capeStyle !== 'none');
  const hairChain = useHairPhysics(
    config.hairStyle === 'flowing' || config.hairStyle === 'wild' || config.hairStyle === 'windswept'
  );

  // Procedural animation
  useProceduralAnim({
    rootRef, bodyRef, lArmRef, rArmRef, lLegRef, rLegRef, headRef,
    movingRef, facingRef,
    posRef, terrainFn,
    animState,
  });

  // Root position sync
  useFrame(() => {
    if (!rootRef.current) return;
    if (posRef && terrainFn) {
      const p = posRef.current;
      const y = terrainFn(p.x, p.z);
      const isMoving = movingRef?.current ?? false;
      const bob = isMoving ? 0 : 0;
      rootRef.current.position.set(p.x, y + bob, p.z);
    } else if (staticPos) {
      rootRef.current.position.set(staticPos[0], staticPos[1], staticPos[2]);
    }
    const h = config.height ?? 1.0;
    rootRef.current.scale.setScalar(h);
    const targetAng = posRef ? (facingRef?.current ?? 0) : angRef.current;
    const cur = rootRef.current.rotation.y;
    rootRef.current.rotation.y = cur + (targetAng - cur) * 0.15;
  });

  const {
    skinTone, hairColor, hairStyle, outfitColor, accessory,
    capeColor, capeAccent, capeStyle, maskStyle, accentColor,
  } = config;
  const darkOutfit = new THREE.Color(outfitColor).offsetHSL(0, 0, -0.12).getStyle();
  const darkCape   = new THREE.Color(capeColor).offsetHSL(0, 0, -0.18).getStyle();

  return (
    <group ref={rootRef}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.38, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.20} />
      </mesh>

      <group ref={bodyRef}>
        {/* ── Legs ── */}
        <group ref={lLegRef} position={[-0.13, 0.35, 0]}>
          <Cylinder args={[0.095, 0.10, 0.55, 8]} position={[0, -0.28, 0]} castShadow>
            <meshStandardMaterial color={darkOutfit} roughness={0.85} /></Cylinder>
          <Sphere args={[0.11, 8, 6]} position={[0, -0.59, 0.04]} castShadow>
            <meshStandardMaterial color="#1e1b18" roughness={0.9} /></Sphere>
        </group>
        <group ref={rLegRef} position={[0.13, 0.35, 0]}>
          <Cylinder args={[0.095, 0.10, 0.55, 8]} position={[0, -0.28, 0]} castShadow>
            <meshStandardMaterial color={darkOutfit} roughness={0.85} /></Cylinder>
          <Sphere args={[0.11, 8, 6]} position={[0, -0.59, 0.04]} castShadow>
            <meshStandardMaterial color="#1e1b18" roughness={0.9} /></Sphere>
        </group>

        {/* ── Body / Torso ── */}
        <Cylinder args={[0.22, 0.26, 0.72, 12]} position={[0, 0.36, 0]} castShadow>
          <meshStandardMaterial color={outfitColor} roughness={0.70} metalness={0.05} envMapIntensity={0.4} /></Cylinder>

        {/* ── Accent stripe ── */}
        <Cylinder args={[0.225, 0.225, 0.06, 12]} position={[0, 0.56, 0]}>
          <meshStandardMaterial color={accentColor} roughness={0.6} metalness={0.1} emissive={accentColor} emissiveIntensity={0.15} /></Cylinder>

        {/* ── Neck ── */}
        <Cylinder args={[0.11, 0.13, 0.18, 8]} position={[0, 0.84, 0]} castShadow>
          <meshStandardMaterial color={skinTone} roughness={0.80} /></Cylinder>

        {/* ── Arms ── */}
        <group ref={lArmRef} position={[-0.29, 0.58, 0]}>
          <Cylinder args={[0.075, 0.085, 0.52, 8]} position={[0, -0.26, 0]} castShadow>
            <meshStandardMaterial color={outfitColor} roughness={0.75} /></Cylinder>
          <Sphere args={[0.085, 8, 6]} position={[0, -0.55, 0]} castShadow>
            <meshStandardMaterial color={skinTone} roughness={0.80} /></Sphere>
        </group>
        <group ref={rArmRef} position={[0.29, 0.58, 0]}>
          <Cylinder args={[0.075, 0.085, 0.52, 8]} position={[0, -0.26, 0]} castShadow>
            <meshStandardMaterial color={outfitColor} roughness={0.75} /></Cylinder>
          <Sphere args={[0.085, 8, 6]} position={[0, -0.55, 0]} castShadow>
            <meshStandardMaterial color={skinTone} roughness={0.80} /></Sphere>
        </group>

        {/* ── Cape ── */}
        {capeStyle !== 'none' && (
          <group position={[0, 0.65, -0.22]}>
            {capeChain.map((pos, i) => {
              if (i === 0) return null;
              const prev = capeChain[i - 1];
              const seg = new THREE.Vector3().subVectors(
                new THREE.Vector3(...pos),
                new THREE.Vector3(...prev)
              );
              const len = seg.length();
              const mid = new THREE.Vector3(
                (pos[0] + prev[0]) / 2,
                (pos[1] + prev[1]) / 2,
                (pos[2] + prev[2]) / 2,
              );
              const opacity = capeStyle === 'tattered' ? 0.7 - i * 0.06 : 0.92;
              const w = 0.38 - i * 0.03;
              return (
                <mesh key={i} position={mid}>
                  <boxGeometry args={[w, len, 0.04]} />
                  <meshStandardMaterial
                    color={i % 2 === 0 ? capeColor : darkCape}
                    roughness={0.7} metalness={0.05}
                    transparent opacity={opacity}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              );
            })}
            {/* Cape shoulder clasp */}
            <Sphere args={[0.06, 8, 6]} position={[-0.22, 0, 0]}>
              <meshStandardMaterial color={capeAccent} roughness={0.3} metalness={0.7} /></Sphere>
            <Sphere args={[0.06, 8, 6]} position={[0.22, 0, 0]}>
              <meshStandardMaterial color={capeAccent} roughness={0.3} metalness={0.7} /></Sphere>
          </group>
        )}
      </group>

      {/* ── Head ── */}
      <group ref={headRef} position={[0, 0, 0]}>
        <Sphere args={[0.29, 16, 12]} position={[0, 1.15, 0]} castShadow>
          <meshStandardMaterial color={skinTone} roughness={0.75} /></Sphere>

        {/* Cheeks */}
        <Sphere args={[0.06, 6, 4]} position={[0.18, 1.13, 0.24]}>
          <meshBasicMaterial color="#f9a8d4" transparent opacity={0.45} /></Sphere>
        <Sphere args={[0.06, 6, 4]} position={[-0.18, 1.13, 0.24]}>
          <meshBasicMaterial color="#f9a8d4" transparent opacity={0.45} /></Sphere>

        {/* Eyes */}
        <Sphere args={[0.055, 8, 6]} position={[0.10, 1.18, 0.25]}>
          <meshBasicMaterial color="#1e293b" /></Sphere>
        <Sphere args={[0.055, 8, 6]} position={[-0.10, 1.18, 0.25]}>
          <meshBasicMaterial color="#1e293b" /></Sphere>
        <Sphere args={[0.022, 6, 4]} position={[0.115, 1.20, 0.295]}>
          <meshBasicMaterial color="white" /></Sphere>
        <Sphere args={[0.022, 6, 4]} position={[-0.085, 1.20, 0.295]}>
          <meshBasicMaterial color="white" /></Sphere>

        {/* Smile */}
        <Torus args={[0.09, 0.018, 6, 12, Math.PI]} rotation={[0, 0, Math.PI]} position={[0, 1.06, 0.27]}>
          <meshBasicMaterial color="#c2715a" /></Torus>

        {/* ── Mask ── */}
        {maskStyle === 'half' && (
          <mesh position={[0, 1.12, 0.27]}>
            <boxGeometry args={[0.34, 0.16, 0.06]} />
            <meshStandardMaterial color={outfitColor} roughness={0.5} metalness={0.3} transparent opacity={0.88} />
          </mesh>
        )}
        {maskStyle === 'full' && (
          <Sphere args={[0.295, 14, 10]} position={[0, 1.15, 0.01]}>
            <meshStandardMaterial color={outfitColor} roughness={0.4} metalness={0.35} transparent opacity={0.82} />
          </Sphere>
        )}
        {maskStyle === 'visor' && (
          <mesh position={[0, 1.18, 0.26]}>
            <boxGeometry args={[0.36, 0.10, 0.05]} />
            <meshStandardMaterial color={accentColor} roughness={0.15} metalness={0.6} transparent opacity={0.75}
              emissive={accentColor} emissiveIntensity={0.4} />
          </mesh>
        )}

        {/* ── Hair ── */}
        {(hairStyle === 'short' || hairStyle === 'bun') && (
          <Sphere args={[0.31, 12, 10]} position={[0, 1.28, -0.04]} castShadow>
            <meshStandardMaterial color={hairColor} roughness={0.9} /></Sphere>
        )}
        {hairStyle === 'bun' && (
          <Sphere args={[0.14, 10, 8]} position={[0, 1.53, 0.04]} castShadow>
            <meshStandardMaterial color={hairColor} roughness={0.9} /></Sphere>
        )}
        {/* Physics hair styles */}
        {(hairStyle === 'flowing' || hairStyle === 'long') && (
          <group position={[0, 1.28, -0.04]}>
            <Sphere args={[0.30, 12, 10]} castShadow>
              <meshStandardMaterial color={hairColor} roughness={0.9} /></Sphere>
            {hairChain.map((pos, i) => {
              if (i === 0) return null;
              const w = 0.18 - i * 0.022;
              return (
                <mesh key={i} position={pos as [number,number,number]}>
                  <sphereGeometry args={[Math.max(0.04, w), 6, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.88} />
                </mesh>
              );
            })}
          </group>
        )}
        {hairStyle === 'wild' && (
          <group position={[0, 1.28, -0.04]}>
            <Sphere args={[0.32, 10, 8]} castShadow>
              <meshStandardMaterial color={hairColor} roughness={0.88} /></Sphere>
            {[-0.18, 0, 0.18].map((ox, j) =>
              hairChain.slice(0, 4).map((pos, i) => (
                <mesh key={`${j}-${i}`} position={[pos[0] + ox, pos[1], pos[2]] as [number,number,number]}>
                  <sphereGeometry args={[0.07 - i * 0.01, 5, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.85} />
                </mesh>
              ))
            )}
          </group>
        )}
        {hairStyle === 'windswept' && (
          <group position={[0.08, 1.28, -0.04]}>
            <Sphere args={[0.30, 10, 8]} castShadow>
              <meshStandardMaterial color={hairColor} roughness={0.88} /></Sphere>
            {hairChain.map((pos, i) => {
              if (i === 0) return null;
              return (
                <mesh key={i} position={[pos[0] + 0.05 * i, pos[1], pos[2]] as [number,number,number]}>
                  <sphereGeometry args={[Math.max(0.03, 0.14 - i * 0.018), 5, 4]} />
                  <meshStandardMaterial color={hairColor} roughness={0.85} />
                </mesh>
              );
            })}
          </group>
        )}

        {/* ── Accessory ── */}
        {accessory === 'hat' && (
          <group position={[0, 1.48, 0]}>
            <Cylinder args={[0.36, 0.36, 0.07, 16]}>
              <meshStandardMaterial color="#1e1b18" roughness={0.85} /></Cylinder>
            <Cylinder args={[0.18, 0.20, 0.38, 14]} position={[0, 0.22, 0]}>
              <meshStandardMaterial color="#1e1b18" roughness={0.85} /></Cylinder>
            <Cylinder args={[0.185, 0.185, 0.06, 14]} position={[0, 0.10, 0]}>
              <meshStandardMaterial color="#f59e0b" roughness={0.7} metalness={0.1} /></Cylinder>
          </group>
        )}
        {accessory === 'crown' && (
          <group position={[0, 1.48, 0]}>
            <Torus args={[0.22, 0.045, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.8} /></Torus>
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <Cone key={i} args={[0.045, 0.16, 5]}
                position={[Math.cos((deg * Math.PI) / 180) * 0.22, 0.09, Math.sin((deg * Math.PI) / 180) * 0.22]}>
                <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.8} /></Cone>
            ))}
          </group>
        )}
        {accessory === 'halo' && (
          <Torus args={[0.26, 0.04, 8, 28]} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.58, 0]}>
            <meshStandardMaterial color="#fef9c3" roughness={0.1} metalness={0.6} emissive="#fef08a" emissiveIntensity={0.7} /></Torus>
        )}

        {/* Name label */}
        {name !== '' && (
          <Billboard position={[0, 1.85, 0]}>
            <Text fontSize={0.22} color={isMe ? outfitColor : 'white'}
              anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="black">
              {name}{isMe ? ' ★' : ''}
            </Text>
          </Billboard>
        )}
      </group>

      {/* Selection ring */}
      {isMe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
          <ringGeometry args={[0.40, 0.50, 32]} />
          <meshBasicMaterial color={outfitColor} transparent opacity={0.70} />
        </mesh>
      )}
    </group>
  );
}
