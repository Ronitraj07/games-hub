/**
 * SkyCharacterV2  —  Realistic Sky-style character
 * ─────────────────────────────────────────────────────────────────
 * Anatomy overhaul: human proportions, defined skull, brow ridge,
 * nose bridge, eye sockets, lip detail, clavicle shoulders, tapered
 * torso, robe/skirt hem, realistic limb tapering, cape with physics,
 * flowing hair chain, all accessories preserved.
 *
 * Zero GLB — pure Three.js primitives + procedural anim.
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
  skinTone:    string;
  hairColor:   string;
  hairStyle:   'short' | 'long' | 'bun' | 'none' | 'flowing' | 'wild' | 'windswept';
  outfitColor: string;
  accessory:   'none' | 'hat' | 'crown' | 'halo';
  capeColor:   string;
  capeAccent:  string;
  capeStyle:   'standard' | 'tattered' | 'royal' | 'none';
  maskStyle:   'none' | 'half' | 'full' | 'visor';
  accentColor: string;
  height:      number;
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

type TerrainFn = (x: number, z: number) => number;

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

// ── Helpers ────────────────────────────────────────────────────────
function darken(hex: string, amt = -0.12) {
  return new THREE.Color(hex).offsetHSL(0, 0, amt).getStyle();
}
function lighten(hex: string, amt = 0.12) {
  return new THREE.Color(hex).offsetHSL(0, 0, amt).getStyle();
}

// ── Sub-components ─────────────────────────────────────────────────

/** Realistic human skull: cranium + brow + cheekbones + jaw + chin */
function Head({ skinTone }: { skinTone: string }) {
  const mid = darken(skinTone, -0.06);
  return (
    <group>
      {/* Cranium — slightly elongated ovoid */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.27, 20, 16]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} metalness={0} />
      </mesh>
      {/* Back-of-head extension (occipital) */}
      <mesh position={[0, -0.04, -0.07]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} metalness={0} />
      </mesh>
      {/* Forehead flattening plate */}
      <mesh position={[0, 0.09, 0.18]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} metalness={0} />
      </mesh>
      {/* Brow ridge L */}
      <mesh position={[-0.10, 0.06, 0.22]} rotation={[0.1, 0.15, 0]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color={mid} roughness={0.75} metalness={0} />
      </mesh>
      {/* Brow ridge R */}
      <mesh position={[0.10, 0.06, 0.22]} rotation={[0.1, -0.15, 0]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color={mid} roughness={0.75} metalness={0} />
      </mesh>
      {/* Upper cheekbone L */}
      <mesh position={[-0.17, -0.03, 0.18]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} metalness={0} />
      </mesh>
      {/* Upper cheekbone R */}
      <mesh position={[0.17, -0.03, 0.18]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} metalness={0} />
      </mesh>
      {/* Mid face / philtrum area */}
      <mesh position={[0, -0.06, 0.25]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color={skinTone} roughness={0.72} metalness={0} />
      </mesh>
      {/* Jaw / lower face */}
      <mesh position={[0, -0.14, 0.12]} scale={[1.1, 0.7, 1.0]}>
        <sphereGeometry args={[0.19, 14, 10]} />
        <meshStandardMaterial color={skinTone} roughness={0.73} metalness={0} />
      </mesh>
      {/* Chin */}
      <mesh position={[0, -0.19, 0.16]}>
        <sphereGeometry args={[0.065, 8, 6]} />
        <meshStandardMaterial color={mid} roughness={0.74} metalness={0} />
      </mesh>
    </group>
  );
}

/** Realistic face features */
function Face({ skinTone, outfitColor }: { skinTone: string; outfitColor: string }) {
  const shadowCol = darken(skinTone, -0.18);
  const lipCol    = darken(skinTone, -0.22);
  const blushCol  = '#f9a8d4';
  return (
    <group>
      {/* ── Eye sockets (subtle shadow domes) ── */}
      <mesh position={[-0.105, 0.055, 0.255]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial color={shadowCol} roughness={0.95} metalness={0} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0.105, 0.055, 0.255]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial color={shadowCol} roughness={0.95} metalness={0} transparent opacity={0.35} />
      </mesh>

      {/* ── Iris (coloured, slightly raised) ── */}
      <mesh position={[-0.105, 0.056, 0.268]}>
        <sphereGeometry args={[0.033, 10, 8]} />
        <meshStandardMaterial color="#6b3f1f" roughness={0.1} metalness={0} />
      </mesh>
      <mesh position={[0.105, 0.056, 0.268]}>
        <sphereGeometry args={[0.033, 10, 8]} />
        <meshStandardMaterial color="#6b3f1f" roughness={0.1} metalness={0} />
      </mesh>

      {/* ── Pupil ── */}
      <mesh position={[-0.105, 0.057, 0.278]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshBasicMaterial color="#0a0605" />
      </mesh>
      <mesh position={[0.105, 0.057, 0.278]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshBasicMaterial color="#0a0605" />
      </mesh>

      {/* ── Specular dot ── */}
      <mesh position={[-0.097, 0.063, 0.284]}>
        <sphereGeometry args={[0.008, 6, 4]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0.113, 0.063, 0.284]}>
        <sphereGeometry args={[0.008, 6, 4]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* ── Upper eyelid line ── */}
      <mesh position={[-0.105, 0.065, 0.270]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.064, 0.008, 0.008]} />
        <meshBasicMaterial color="#2d1a0a" />
      </mesh>
      <mesh position={[0.105, 0.065, 0.270]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.064, 0.008, 0.008]} />
        <meshBasicMaterial color="#2d1a0a" />
      </mesh>

      {/* ── Nose bridge ── */}
      <mesh position={[0, 0.02, 0.265]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.022, 0.06, 0.018]} />
        <meshStandardMaterial color={darken(skinTone, -0.06)} roughness={0.8} metalness={0} />
      </mesh>
      {/* Nose tip */}
      <mesh position={[0, -0.02, 0.278]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color={skinTone} roughness={0.75} metalness={0} />
      </mesh>
      {/* Nostril wing L */}
      <mesh position={[-0.028, -0.028, 0.268]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color={darken(skinTone, -0.08)} roughness={0.8} metalness={0} />
      </mesh>
      {/* Nostril wing R */}
      <mesh position={[0.028, -0.028, 0.268]}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshStandardMaterial color={darken(skinTone, -0.08)} roughness={0.8} metalness={0} />
      </mesh>

      {/* ── Lips ── */}
      {/* Upper lip */}
      <mesh position={[0, -0.075, 0.272]} scale={[1.0, 0.6, 1.0]}>
        <sphereGeometry args={[0.038, 8, 6]} />
        <meshStandardMaterial color={lipCol} roughness={0.65} metalness={0} />
      </mesh>
      {/* Lower lip */}
      <mesh position={[0, -0.092, 0.274]} scale={[1.1, 0.65, 1.0]}>
        <sphereGeometry args={[0.038, 8, 6]} />
        <meshStandardMaterial color={lighten(lipCol, 0.06)} roughness={0.6} metalness={0} />
      </mesh>

      {/* ── Blush ── */}
      <mesh position={[-0.16, 0.005, 0.222]} rotation={[0, 0.3, 0]}>
        <circleGeometry args={[0.046, 16]} />
        <meshBasicMaterial color={blushCol} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.16, 0.005, 0.222]} rotation={[0, -0.3, 0]}>
        <circleGeometry args={[0.046, 16]} />
        <meshBasicMaterial color={blushCol} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Realistic tapered torso with clavicle shoulders and robe hem */
function Body({ outfitColor, accentColor, skinTone }: { outfitColor: string; accentColor: string; skinTone: string }) {
  const dark = darken(outfitColor);
  const light = lighten(outfitColor, 0.08);
  return (
    <group>
      {/* Neck */}
      <Cylinder args={[0.085, 0.105, 0.22, 10]} position={[0, 0.87, 0]} castShadow>
        <meshStandardMaterial color={skinTone} roughness={0.78} metalness={0} />
      </Cylinder>

      {/* ── Chest / upper torso ── */}
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.195, 0.225, 0.42, 14]} />
        <meshStandardMaterial color={outfitColor} roughness={0.68} metalness={0.06} envMapIntensity={0.4} />
      </mesh>

      {/* Chest centre seam */}
      <mesh position={[0, 0.62, 0.20]}>
        <boxGeometry args={[0.022, 0.36, 0.012]} />
        <meshStandardMaterial color={accentColor} roughness={0.55} metalness={0.15} emissive={accentColor} emissiveIntensity={0.1} />
      </mesh>

      {/* ── Lower torso / hip flare ── */}
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.235, 0.255, 0.34, 14]} />
        <meshStandardMaterial color={dark} roughness={0.72} metalness={0.04} />
      </mesh>

      {/* ── Robe / skirt hem (flared) ── */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.31, 0.37, 0.18, 16, 1, true]} />
        <meshStandardMaterial color={dark} roughness={0.82} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.355, 0.40, 0.08, 16, 1, true]} />
        <meshStandardMaterial color={lighten(dark, 0.05)} roughness={0.85} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Clavicle / shoulder yoke ── */}
      <mesh position={[-0.22, 0.73, 0]} rotation={[0, 0, -0.12]}>
        <sphereGeometry args={[0.095, 10, 8]} />
        <meshStandardMaterial color={outfitColor} roughness={0.65} metalness={0.08} />
      </mesh>
      <mesh position={[0.22, 0.73, 0]} rotation={[0, 0, 0.12]}>
        <sphereGeometry args={[0.095, 10, 8]} />
        <meshStandardMaterial color={outfitColor} roughness={0.65} metalness={0.08} />
      </mesh>

      {/* ── Belt ── */}
      <Cylinder args={[0.24, 0.24, 0.055, 16]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.2} emissive={accentColor} emissiveIntensity={0.08} />
      </Cylinder>
    </group>
  );
}

/** Realistic tapered arm (upper arm wider, forearm tapers, hand) */
function Arm({ side, outfitColor, skinTone }: { side: 1 | -1; outfitColor: string; skinTone: string }) {
  const x = side * 0.285;
  return (
    <group position={[x, 0.64, 0]}>
      {/* Upper arm */}
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.07, 0.075, 0.28, 10]} />
        <meshStandardMaterial color={outfitColor} roughness={0.72} metalness={0} />
      </mesh>
      {/* Elbow */}
      <mesh position={[0, -0.29, 0]}>
        <sphereGeometry args={[0.068, 10, 8]} />
        <meshStandardMaterial color={outfitColor} roughness={0.7} metalness={0} />
      </mesh>
      {/* Forearm — tapers toward wrist */}
      <mesh position={[0, -0.44, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.28, 10]} />
        <meshStandardMaterial color={outfitColor} roughness={0.72} metalness={0} />
      </mesh>
      {/* Wrist cuff */}
      <mesh position={[0, -0.59, 0]}>
        <cylinderGeometry args={[0.052, 0.058, 0.04, 10]} />
        <meshStandardMaterial color={darken(outfitColor)} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Hand */}
      <mesh position={[0, -0.66, 0]} scale={[1, 0.72, 0.55]}>
        <sphereGeometry args={[0.072, 10, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.78} metalness={0} />
      </mesh>
      {/* Thumb nub */}
      <mesh position={[side * 0.05, -0.65, 0.04]}>
        <sphereGeometry args={[0.028, 6, 4]} />
        <meshStandardMaterial color={skinTone} roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

/** Realistic leg (thigh tapers to calf, ankle, foot) */
function Leg({ side, outfitColor }: { side: 1 | -1; outfitColor: string }) {
  const x = side * 0.115;
  const dark = darken(outfitColor);
  return (
    <group position={[x, 0.08, 0]}>
      {/* Upper leg / thigh */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.10, 0.105, 0.32, 10]} />
        <meshStandardMaterial color={dark} roughness={0.82} metalness={0} />
      </mesh>
      {/* Knee */}
      <mesh position={[0, -0.34, 0]}>
        <sphereGeometry args={[0.095, 10, 8]} />
        <meshStandardMaterial color={dark} roughness={0.8} metalness={0} />
      </mesh>
      {/* Calf — tapers */}
      <mesh position={[0, -0.52, 0]}>
        <cylinderGeometry args={[0.075, 0.095, 0.34, 10]} />
        <meshStandardMaterial color={dark} roughness={0.82} metalness={0} />
      </mesh>
      {/* Ankle */}
      <mesh position={[0, -0.70, 0]}>
        <sphereGeometry args={[0.068, 8, 6]} />
        <meshStandardMaterial color="#1e1b18" roughness={0.88} metalness={0} />
      </mesh>
      {/* Foot */}
      <mesh position={[0, -0.75, 0.055]} scale={[0.85, 0.5, 1.35]}>
        <sphereGeometry args={[0.085, 10, 8]} />
        <meshStandardMaterial color="#1e1b18" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

/** Hair — flowing chain + cap */
function Hair({ hairColor, hairStyle, chain }: { hairColor: string; hairStyle: AvatarConfigV2['hairStyle']; chain: [number,number,number][] }) {
  if (hairStyle === 'none') return null;
  return (
    <group position={[0, 0, 0]}>
      {/* Hair cap */}
      <mesh position={[0, 0.10, -0.02]} scale={[1.04, 0.92, 1.04]}>
        <sphereGeometry args={[0.275, 14, 12]} />
        <meshStandardMaterial color={hairColor} roughness={0.88} metalness={0} />
      </mesh>
      {/* Side sweep L */}
      <mesh position={[-0.18, 0.04, 0.14]} rotation={[0.2, 0.3, 0.1]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color={hairColor} roughness={0.88} metalness={0} />
      </mesh>
      {/* Side sweep R */}
      <mesh position={[0.18, 0.04, 0.14]} rotation={[0.2, -0.3, -0.1]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial color={hairColor} roughness={0.88} metalness={0} />
      </mesh>

      {/* Bun */}
      {hairStyle === 'bun' && (
        <mesh position={[0, 0.32, -0.05]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshStandardMaterial color={hairColor} roughness={0.88} metalness={0} />
        </mesh>
      )}

      {/* Physics chain (flowing / long / wild / windswept) */}
      {(hairStyle === 'flowing' || hairStyle === 'long' || hairStyle === 'wild' || hairStyle === 'windswept') &&
        chain.map((pos, i) => {
          if (i === 0) return null;
          const radius = Math.max(0.025, 0.11 - i * 0.014);
          const ox = hairStyle === 'windswept' ? 0.05 * i : hairStyle === 'wild' ? Math.sin(i * 1.4) * 0.06 : 0;
          return (
            <mesh key={i} position={[pos[0] + ox, pos[1] - 0.04, pos[2] - 0.02]}>
              <sphereGeometry args={[radius, 7, 5]} />
              <meshStandardMaterial color={hairColor} roughness={0.86} metalness={0} />
            </mesh>
          );
        })}
    </group>
  );
}

/** Cape with verlet chain physics */
function Cape({ capeColor, capeAccent, capeStyle, chain }: { capeColor: string; capeAccent: string; capeStyle: AvatarConfigV2['capeStyle']; chain: [number,number,number][] }) {
  if (capeStyle === 'none') return null;
  const dark = darken(capeColor, -0.16);
  return (
    <group position={[0, 0.68, -0.22]}>
      {/* Shoulder clasp L */}
      <mesh position={[-0.20, 0.0, 0]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color={capeAccent} roughness={0.28} metalness={0.75} />
      </mesh>
      {/* Shoulder clasp R */}
      <mesh position={[0.20, 0.0, 0]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial color={capeAccent} roughness={0.28} metalness={0.75} />
      </mesh>
      {/* Cape segments from chain */}
      {chain.map((pos, i) => {
        if (i === 0) return null;
        const prev = chain[i - 1];
        const seg = new THREE.Vector3(
          pos[0] - prev[0], pos[1] - prev[1], pos[2] - prev[2]
        );
        const len = seg.length();
        const mid: [number,number,number] = [
          (pos[0] + prev[0]) / 2,
          (pos[1] + prev[1]) / 2,
          (pos[2] + prev[2]) / 2,
        ];
        const opacity = capeStyle === 'tattered' ? 0.72 - i * 0.055 : 0.93;
        const w = Math.max(0.12, 0.40 - i * 0.028);
        return (
          <mesh key={i} position={mid}>
            <boxGeometry args={[w, len + 0.01, 0.045]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? capeColor : dark}
              roughness={0.68} metalness={0.04}
              transparent opacity={opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      {/* Trim at bottom */}
      {capeStyle === 'royal' && (
        <mesh position={[0, chain[chain.length - 1]?.[1] ?? -0.6, 0]}>
          <boxGeometry args={[0.38, 0.04, 0.06]} />
          <meshStandardMaterial color={capeAccent} roughness={0.3} metalness={0.55} />
        </mesh>
      )}
    </group>
  );
}

// ── Main Character ─────────────────────────────────────────────────
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

  const capeChain = useCapePhysics(config.capeStyle !== 'none');
  const hairChain = useHairPhysics(
    config.hairStyle === 'flowing' || config.hairStyle === 'wild' ||
    config.hairStyle === 'windswept' || config.hairStyle === 'long'
  );

  useProceduralAnim({
    rootRef, bodyRef, lArmRef, rArmRef, lLegRef, rLegRef, headRef,
    movingRef, facingRef, posRef, terrainFn, animState,
  });

  useFrame(() => {
    if (!rootRef.current) return;
    if (posRef && terrainFn) {
      const p = posRef.current;
      rootRef.current.position.set(p.x, terrainFn(p.x, p.z), p.z);
    } else if (staticPos) {
      rootRef.current.position.set(staticPos[0], staticPos[1], staticPos[2]);
    }
    rootRef.current.scale.setScalar(config.height ?? 1.0);
    const targetAng = posRef ? (facingRef?.current ?? 0) : angRef.current;
    const cur = rootRef.current.rotation.y;
    rootRef.current.rotation.y = cur + (targetAng - cur) * 0.15;
  });

  const { skinTone, hairColor, hairStyle, outfitColor, accessory, capeColor, capeAccent, capeStyle, maskStyle, accentColor } = config;

  return (
    <group ref={rootRef}>
      {/* Ground shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
        <circleGeometry args={[0.38, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} />
      </mesh>

      <group ref={bodyRef}>
        {/* Legs */}
        <group ref={lLegRef}><Leg side={-1} outfitColor={outfitColor} /></group>
        <group ref={rLegRef}><Leg side={1}  outfitColor={outfitColor} /></group>

        {/* Body */}
        <Body outfitColor={outfitColor} accentColor={accentColor} skinTone={skinTone} />

        {/* Arms — attached to arm refs for animation */}
        <group ref={lArmRef}><Arm side={-1} outfitColor={outfitColor} skinTone={skinTone} /></group>
        <group ref={rArmRef}><Arm side={1}  outfitColor={outfitColor} skinTone={skinTone} /></group>

        {/* Cape */}
        <Cape capeColor={capeColor} capeAccent={capeAccent} capeStyle={capeStyle} chain={capeChain} />
      </group>

      {/* Head group */}
      <group ref={headRef} position={[0, 1.02, 0]}>
        <Head skinTone={skinTone} />
        <Face skinTone={skinTone} outfitColor={outfitColor} />

        {/* Hair — offset from head centre */}
        <group position={[0, 0.06, 0]}>
          <Hair hairColor={hairColor} hairStyle={hairStyle} chain={hairChain} />
        </group>

        {/* ── Mask ── */}
        {maskStyle === 'half' && (
          <mesh position={[0, -0.04, 0.27]}>
            <boxGeometry args={[0.32, 0.14, 0.055]} />
            <meshStandardMaterial color={outfitColor} roughness={0.48} metalness={0.3} transparent opacity={0.88} />
          </mesh>
        )}
        {maskStyle === 'full' && (
          <mesh position={[0, 0, 0.01]} scale={[1.02, 1.02, 1.0]}>
            <sphereGeometry args={[0.275, 14, 10]} />
            <meshStandardMaterial color={outfitColor} roughness={0.38} metalness={0.35} transparent opacity={0.80} />
          </mesh>
        )}
        {maskStyle === 'visor' && (
          <mesh position={[0, 0.04, 0.264]}>
            <boxGeometry args={[0.34, 0.088, 0.048]} />
            <meshStandardMaterial color={accentColor} roughness={0.14} metalness={0.6} transparent opacity={0.75}
              emissive={accentColor} emissiveIntensity={0.42} />
          </mesh>
        )}

        {/* ── Accessories ── */}
        {accessory === 'hat' && (
          <group position={[0, 0.30, -0.02]}>
            <Cylinder args={[0.32, 0.32, 0.07, 18]}>
              <meshStandardMaterial color="#1e1b18" roughness={0.85} /></Cylinder>
            <Cylinder args={[0.16, 0.18, 0.36, 14]} position={[0, 0.22, 0]}>
              <meshStandardMaterial color="#1e1b18" roughness={0.85} /></Cylinder>
            <Cylinder args={[0.165, 0.165, 0.055, 14]} position={[0, 0.09, 0]}>
              <meshStandardMaterial color="#f59e0b" roughness={0.65} metalness={0.15} /></Cylinder>
          </group>
        )}
        {accessory === 'crown' && (
          <group position={[0, 0.30, 0]}>
            <Torus args={[0.20, 0.042, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#fbbf24" roughness={0.28} metalness={0.82} /></Torus>
            {[0,72,144,216,288].map((deg, i) => (
              <Cone key={i} args={[0.042, 0.15, 5]}
                position={[Math.cos((deg*Math.PI)/180)*0.20, 0.09, Math.sin((deg*Math.PI)/180)*0.20]}>
                <meshStandardMaterial color="#fbbf24" roughness={0.28} metalness={0.82} /></Cone>
            ))}
          </group>
        )}
        {accessory === 'halo' && (
          <Torus args={[0.24, 0.038, 8, 28]} rotation={[Math.PI/2,0,0]} position={[0, 0.40, 0]}>
            <meshStandardMaterial color="#fef9c3" roughness={0.08} metalness={0.65}
              emissive="#fef08a" emissiveIntensity={0.75} /></Torus>
        )}

        {/* Name label */}
        {name !== '' && (
          <Billboard position={[0, 0.65, 0]}>
            <Text fontSize={0.22} color={isMe ? outfitColor : 'white'}
              anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="black">
              {name}{isMe ? ' ★' : ''}
            </Text>
          </Billboard>
        )}
      </group>

      {/* Player selection ring */}
      {isMe && (
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.009, 0]}>
          <ringGeometry args={[0.40, 0.50, 32]} />
          <meshBasicMaterial color={outfitColor} transparent opacity={0.68} />
        </mesh>
      )}
    </group>
  );
}
