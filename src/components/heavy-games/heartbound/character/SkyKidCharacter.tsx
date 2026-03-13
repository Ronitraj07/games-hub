/**
 * SkyKidCharacter — Procedural Sky-style character v3
 * ─────────────────────────────────────────────────────────────────
 * Fully procedural, no GLB required.
 *
 * v3 upgrades:
 *   • MeshStandardMaterial (PBR) — real depth, catches scene light
 *   • LatheGeometry robe — exact Sky silhouette curve
 *   • LatheGeometry hood — organic soft-tip shape
 *   • Subdivided cape mesh with per-frame vertex sine displacement
 *     (real cloth ripple, not rigid fan)
 *   • Chibi proportions — larger head, wider robe hem
 *   • Better face — bigger eyes, cheek blush, forehead shadow
 *   • Roughness variation per part (skin smooth, fabric rough)
 *   • Slight transparency at cape hem
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── Config ───────────────────────────────────────────────────────────
export interface SkyKidConfig {
  outfitColor:  string;
  capeColor:    string;
  hairColor:    string;
  accentColor:  string;
  skinTone:     string;
  height:       number;
}

export const DEFAULT_SKYKID_CONFIG: SkyKidConfig = {
  outfitColor:  '#6366f1',
  capeColor:    '#6366f1',
  hairColor:    '#3b1f0a',
  accentColor:  '#f472b6',
  skinTone:     '#fde7c3',
  height:       1.0,
};

type TerrainFn = (x: number, z: number) => number;

interface SkyKidCharacterProps {
  config:       SkyKidConfig;
  name:         string;
  isMe:         boolean;
  terrainFn?:   TerrainFn;
  posRef?:      React.MutableRefObject<THREE.Vector3>;
  movingRef?:   React.MutableRefObject<boolean>;
  facingRef?:   React.MutableRefObject<number>;
  staticPos?:   [number, number, number];
  moving?:      boolean;
  facingAngle?: number;
}

// ── Robe LatheGeometry ───────────────────────────────────────────────────
// Points define the robe profile: [radius, height]
// Starts at hem (wide), pinches at waist, widens at chest, narrows at collar
const ROBE_POINTS = [
  new THREE.Vector2(0.48, 0.00),   // hem base
  new THREE.Vector2(0.50, 0.08),   // hem flare
  new THREE.Vector2(0.45, 0.22),   // lower skirt
  new THREE.Vector2(0.32, 0.42),   // mid skirt
  new THREE.Vector2(0.22, 0.56),   // waist
  new THREE.Vector2(0.24, 0.68),   // lower chest
  new THREE.Vector2(0.22, 0.78),   // chest
  new THREE.Vector2(0.19, 0.88),   // upper chest
  new THREE.Vector2(0.15, 0.95),   // collar
  new THREE.Vector2(0.12, 1.00),   // neck top
];
const ROBE_GEO = new THREE.LatheGeometry(ROBE_POINTS, 24);

// ── Hood LatheGeometry ───────────────────────────────────────────────────
// Organic pointed hood profile
const HOOD_POINTS = [
  new THREE.Vector2(0.21, 0.00),
  new THREE.Vector2(0.22, 0.06),
  new THREE.Vector2(0.20, 0.14),
  new THREE.Vector2(0.17, 0.24),
  new THREE.Vector2(0.13, 0.36),
  new THREE.Vector2(0.09, 0.50),
  new THREE.Vector2(0.055,0.64),
  new THREE.Vector2(0.025,0.78),
  new THREE.Vector2(0.006,0.90),
  new THREE.Vector2(0.000,0.96),
];
const HOOD_GEO = new THREE.LatheGeometry(HOOD_POINTS, 20);

// ── Cape cloth geometry ─────────────────────────────────────────────────
// Subdivided plane that we deform in useFrame for cloth ripple
const CAPE_SEGS_W = 6;
const CAPE_SEGS_H = 10;
const CAPE_W      = 0.78;
const CAPE_H      = 0.88;
const CAPE_GEO_BASE = new THREE.PlaneGeometry(CAPE_W, CAPE_H, CAPE_SEGS_W, CAPE_SEGS_H);
// Store original positions for displacement
const CAPE_ORIG_POS = (CAPE_GEO_BASE.attributes.position as THREE.BufferAttribute).clone();

// ── Material factory (MeshStandardMaterial, PBR) ─────────────────────
function std(
  color: string,
  opts?: {
    roughness?: number; metalness?: number;
    transparent?: boolean; opacity?: number;
    side?: THREE.Side; emissive?: string; emissiveIntensity?: number;
  }
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color:             new THREE.Color(color),
    roughness:         opts?.roughness         ?? 0.75,
    metalness:         opts?.metalness         ?? 0.0,
    transparent:       opts?.transparent       ?? false,
    opacity:           opts?.opacity           ?? 1.0,
    side:              opts?.side              ?? THREE.FrontSide,
    emissive:          opts?.emissive ? new THREE.Color(opts.emissive) : new THREE.Color('#000000'),
    emissiveIntensity: opts?.emissiveIntensity ?? 0.0,
    envMapIntensity:   0.6,
  });
}

// ── Main component ───────────────────────────────────────────────────
export function SkyKidCharacter({
  config,
  name,
  isMe,
  terrainFn,
  posRef,
  movingRef,
  facingRef,
  staticPos,
  moving     = false,
  facingAngle = 0,
}: SkyKidCharacterProps) {

  // ── Refs ──────────────────────────────────────────────────────
  const rootRef  = useRef<THREE.Group>(null!);
  const bodyRef  = useRef<THREE.Group>(null!);
  const headRef  = useRef<THREE.Group>(null!);
  const lArmRef  = useRef<THREE.Group>(null!);
  const rArmRef  = useRef<THREE.Group>(null!);
  const lLegRef  = useRef<THREE.Group>(null!);
  const rLegRef  = useRef<THREE.Group>(null!);
  const capeRef  = useRef<THREE.Mesh>(null!);

  const movRef   = useRef(moving);
  const angRef   = useRef(facingAngle);
  movRef.current = moving;
  angRef.current = facingAngle;

  // ── Materials — recreated only when a colour value changes ─────────────
  const mats = useMemo(() => ({
    skin:    std(config.skinTone,    { roughness: 0.50, metalness: 0.0 }),
    outfit:  std(config.outfitColor, { roughness: 0.80, metalness: 0.0 }),
    cape:    std(config.capeColor,   { roughness: 0.70, metalness: 0.02, side: THREE.DoubleSide, transparent: true, opacity: 0.96 }),
    hair:    std(config.hairColor,   { roughness: 0.85, metalness: 0.0 }),
    accent:  std(config.accentColor, { roughness: 0.45, metalness: 0.1 }),
    mask:    std('#e8d8c8',          { roughness: 0.40, metalness: 0.05, transparent: true, opacity: 0.94 }),
    white:   std('#f8f2ea',          { roughness: 0.72 }),
    dark:    std('#0f0500',          { roughness: 0.90 }),
    eyeWhite:std('#ffffff',          { roughness: 0.30, emissive: '#ffffff', emissiveIntensity: 0.08 }),
    blush:   std('#f4a0a0',          { roughness: 0.90, transparent: true, opacity: 0.38 }),
    shadow:  std('#1a0830',          { roughness: 1.0,  transparent: true, opacity: 0.22 }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [config.skinTone, config.outfitColor, config.capeColor, config.hairColor, config.accentColor]);

  // ── Cape cloth geometry (cloned per instance so we can deform it) ────
  const capeGeo = useMemo(() => CAPE_GEO_BASE.clone(), []);

  // ── Animation ───────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t = clock.elapsedTime;

    // ── World position ──────────────────────────────────────────────
    if (posRef && terrainFn) {
      const p = posRef.current;
      rootRef.current.position.set(p.x, terrainFn(p.x, p.z), p.z);
    } else if (staticPos) {
      rootRef.current.position.set(staticPos[0], staticPos[1], staticPos[2]);
    }

    rootRef.current.scale.setScalar(config.height ?? 1.0);

    const targetAng = posRef ? (facingRef?.current ?? 0) : angRef.current;
    rootRef.current.rotation.y += (targetAng - rootRef.current.rotation.y) * 0.15;

    const isMoving = movingRef ? movingRef.current : movRef.current;

    // ── Body + limb animation ─────────────────────────────────────────
    if (isMoving) {
      const f = 2.6;
      if (bodyRef.current) { bodyRef.current.position.y = Math.abs(Math.sin(t * f)) * 0.035; bodyRef.current.rotation.z = Math.sin(t * f) * 0.038; }
      if (headRef.current) { headRef.current.rotation.x = Math.sin(t * f * 0.5) * 0.04; headRef.current.rotation.z = -Math.sin(t * f) * 0.025; }
      if (lArmRef.current) { lArmRef.current.rotation.x =  Math.sin(t * f) * 0.52; lArmRef.current.rotation.z = -0.12; }
      if (rArmRef.current) { rArmRef.current.rotation.x = -Math.sin(t * f) * 0.52; rArmRef.current.rotation.z =  0.12; }
      if (lLegRef.current)   lLegRef.current.rotation.x  = -Math.sin(t * f) * 0.58;
      if (rLegRef.current)   rLegRef.current.rotation.x  =  Math.sin(t * f) * 0.58;
    } else {
      if (bodyRef.current) { bodyRef.current.rotation.z = Math.sin(t * 0.55) * 0.022; bodyRef.current.position.y = Math.sin(t * 0.85) * 0.010; }
      if (headRef.current) { headRef.current.rotation.y = Math.sin(t * 0.42) * 0.072; headRef.current.rotation.x = Math.sin(t * 0.58) * 0.030; }
      if (lArmRef.current) { lArmRef.current.rotation.z = -0.18 + Math.sin(t * 0.78 + 0.5) * 0.045; lArmRef.current.rotation.x = Math.sin(t * 0.6) * 0.04; }
      if (rArmRef.current) { rArmRef.current.rotation.z =  0.18 - Math.sin(t * 0.78 + 0.5) * 0.045; rArmRef.current.rotation.x = Math.sin(t * 0.6) * 0.04; }
      if (lLegRef.current)   lLegRef.current.rotation.x += (0 - lLegRef.current.rotation.x) * 0.10;
      if (rLegRef.current)   rLegRef.current.rotation.x += (0 - rLegRef.current.rotation.x) * 0.10;
    }

    // ── Cape cloth ripple (vertex displacement) ──────────────────────
    if (capeRef.current) {
      const pos  = capeGeo.attributes.position as THREE.BufferAttribute;
      const orig = CAPE_ORIG_POS;
      const walkBillow = isMoving ? 0.18 : 0.06;
      for (let i = 0; i < pos.count; i++) {
        const ox = orig.getX(i);
        const oy = orig.getY(i);
        const oz = orig.getZ(i);
        // Normalised 0→1 from top (0) to hem (1)
        const v  = (oy + CAPE_H * 0.5) / CAPE_H;
        // More displacement toward hem, less at neck attachment
        const amp = v * v * walkBillow;
        const wave = Math.sin(t * 2.2 + ox * 4.0 + oy * 2.5) * amp
                   + Math.sin(t * 1.4 + ox * 2.5)             * amp * 0.5;
        pos.setXYZ(i, ox, oy, oz + wave);
      }
      pos.needsUpdate = true;
      capeGeo.computeVertexNormals();

      // Tilt cape back when walking
      capeRef.current.rotation.x = isMoving
        ? 0.30 + Math.sin(t * 2.6 * 0.5) * 0.10
        : 0.06 + Math.sin(t * 1.0)        * 0.05;
    }
  });

  // ── JSX ────────────────────────────────────────────────────────────
  return (
    <group ref={rootRef}>

      {/* Ground shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.20} depthWrite={false} />
      </mesh>

      <group ref={bodyRef}>

        {/* ─── Legs (visible below robe hem when walking) ─── */}
        <group ref={lLegRef} position={[-0.09, 0.18, 0]}>
          <mesh material={mats.skin}>
            <capsuleGeometry args={[0.048, 0.26, 6, 10]} />
          </mesh>
          {/* Soft shoe */}
          <mesh position={[-0.01, -0.19, 0.04]} material={mats.dark} scale={[1, 0.55, 1.3]}>
            <sphereGeometry args={[0.058, 8, 6]} />
          </mesh>
        </group>
        <group ref={rLegRef} position={[0.09, 0.18, 0]}>
          <mesh material={mats.skin}>
            <capsuleGeometry args={[0.048, 0.26, 6, 10]} />
          </mesh>
          <mesh position={[0.01, -0.19, 0.04]} material={mats.dark} scale={[1, 0.55, 1.3]}>
            <sphereGeometry args={[0.058, 8, 6]} />
          </mesh>
        </group>

        {/* ─── Robe (LatheGeometry) ─── */}
        <mesh geometry={ROBE_GEO} material={mats.outfit} castShadow receiveShadow />

        {/* Inner robe shadow at hem (darker inner cylinder) */}
        <mesh position={[0, 0.04, 0]} material={mats.shadow}>
          <cylinderGeometry args={[0.40, 0.44, 0.12, 16]} />
        </mesh>

        {/* Accent belt */}
        <mesh position={[0, 0.57, 0]} material={mats.accent}>
          <cylinderGeometry args={[0.232, 0.232, 0.042, 16]} />
        </mesh>
        {/* Belt buckle dot */}
        <mesh position={[0, 0.57, 0.235]} material={mats.accent}>
          <sphereGeometry args={[0.030, 8, 6]} />
        </mesh>

        {/* Collar */}
        <mesh position={[0, 0.92, 0]} material={mats.white}>
          <cylinderGeometry args={[0.125, 0.155, 0.065, 14]} />
        </mesh>

        {/* ─── Cape ─── */}
        <mesh
          ref={capeRef}
          geometry={capeGeo}
          material={mats.cape}
          position={[0, 0.60, -0.05]}
          rotation={[0.06, 0, 0]}
          castShadow
        />

        {/* ─── Arms ─── */}
        {/* Left arm — pivot at shoulder */}
        <group ref={lArmRef} position={[-0.24, 0.82, 0]}>
          <mesh material={mats.outfit}>
            <capsuleGeometry args={[0.048, 0.20, 6, 10]} />
          </mesh>
          {/* Elbow */}
          <mesh position={[-0.02, -0.18, 0.02]} material={mats.skin}>
            <capsuleGeometry args={[0.038, 0.14, 5, 8]} />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.03, -0.31, 0.04]} material={mats.skin} scale={[1, 0.85, 0.9]}>
            <sphereGeometry args={[0.052, 10, 8]} />
          </mesh>
          {/* Sleeve cuff accent */}
          <mesh position={[-0.01, -0.12, 0.01]} material={mats.accent}>
            <cylinderGeometry args={[0.044, 0.048, 0.030, 10]} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rArmRef} position={[0.24, 0.82, 0]}>
          <mesh material={mats.outfit}>
            <capsuleGeometry args={[0.048, 0.20, 6, 10]} />
          </mesh>
          <mesh position={[0.02, -0.18, 0.02]} material={mats.skin}>
            <capsuleGeometry args={[0.038, 0.14, 5, 8]} />
          </mesh>
          <mesh position={[0.03, -0.31, 0.04]} material={mats.skin} scale={[1, 0.85, 0.9]}>
            <sphereGeometry args={[0.052, 10, 8]} />
          </mesh>
          <mesh position={[0.01, -0.12, 0.01]} material={mats.accent}>
            <cylinderGeometry args={[0.044, 0.048, 0.030, 10]} />
          </mesh>
        </group>

        {/* ─── Head group ─── */}
        <group ref={headRef} position={[0, 1.14, 0]}>

          {/* Head — slightly large chibi oval */}
          <mesh material={mats.skin} scale={[1.0, 1.06, 0.96]} castShadow>
            <sphereGeometry args={[0.195, 20, 16]} />
          </mesh>

          {/* Forehead shadow gradient (subtle depth) */}
          <mesh position={[0, 0.08, 0.15]} material={mats.shadow} scale={[0.9, 0.55, 0.22]}>
            <sphereGeometry args={[0.18, 10, 8]} />
          </mesh>

          {/* ─ Sky mask ─ */}
          {/* Mask base — slightly off-white, hugs the face */}
          <mesh position={[0, 0.015, 0.155]} material={mats.mask} scale={[1, 0.72, 0.16]} castShadow>
            <sphereGeometry args={[0.185, 14, 10]} />
          </mesh>

          {/* Eyes — larger, expressive */}
          {/* Left eye dark iris */}
          <mesh position={[-0.062, 0.028, 0.182]} material={mats.dark} scale={[1, 1.2, 0.5]}>
            <sphereGeometry args={[0.030, 10, 8]} />
          </mesh>
          {/* Right eye dark iris */}
          <mesh position={[0.062, 0.028, 0.182]} material={mats.dark} scale={[1, 1.2, 0.5]}>
            <sphereGeometry args={[0.030, 10, 8]} />
          </mesh>
          {/* Eye whites (subtle) */}
          <mesh position={[-0.062, 0.030, 0.186]} material={mats.eyeWhite} scale={[0.55, 0.70, 0.3]}>
            <sphereGeometry args={[0.030, 8, 6]} />
          </mesh>
          <mesh position={[0.062, 0.030, 0.186]} material={mats.eyeWhite} scale={[0.55, 0.70, 0.3]}>
            <sphereGeometry args={[0.030, 8, 6]} />
          </mesh>
          {/* Eye shine dots */}
          <mesh position={[-0.053, 0.042, 0.192]} material={mats.eyeWhite}>
            <sphereGeometry args={[0.009, 5, 4]} />
          </mesh>
          <mesh position={[0.071, 0.042, 0.192]} material={mats.eyeWhite}>
            <sphereGeometry args={[0.009, 5, 4]} />
          </mesh>

          {/* Cheek blush — two soft transparent spheres */}
          <mesh position={[-0.105, -0.020, 0.148]} material={mats.blush} scale={[1.4, 0.7, 0.35]}>
            <sphereGeometry args={[0.052, 8, 6]} />
          </mesh>
          <mesh position={[0.105, -0.020, 0.148]} material={mats.blush} scale={[1.4, 0.7, 0.35]}>
            <sphereGeometry args={[0.052, 8, 6]} />
          </mesh>

          {/* Hair wisps — swept strands peeking under hood */}
          <mesh position={[-0.13, 0.05, -0.10]} rotation={[0.30, 0.45, -0.55]} material={mats.hair}>
            <capsuleGeometry args={[0.020, 0.15, 4, 8]} />
          </mesh>
          <mesh position={[0.13, 0.03, -0.11]} rotation={[0.20, -0.35, 0.50]} material={mats.hair}>
            <capsuleGeometry args={[0.018, 0.13, 4, 8]} />
          </mesh>
          <mesh position={[0.02, 0.08, -0.14]} rotation={[0.40, 0.12, 0.08]} material={mats.hair}>
            <capsuleGeometry args={[0.016, 0.11, 4, 8]} />
          </mesh>
          {/* Fringe wisp at forehead */}
          <mesh position={[-0.05, 0.16, 0.12]} rotation={[0.80, -0.20, -0.30]} material={mats.hair}>
            <capsuleGeometry args={[0.013, 0.08, 3, 6]} />
          </mesh>

          {/* ─ Hood (LatheGeometry, draped over head) ─ */}
          <mesh
            geometry={HOOD_GEO}
            material={mats.outfit}
            position={[0, 0.02, -0.04]}
            castShadow
          />
          {/* Hood inner shadow */}
          <mesh position={[0, 0.02, -0.04]} material={mats.shadow} scale={[0.88, 1, 0.88]}>
            <mesh geometry={HOOD_GEO} />
          </mesh>
          {/* Hood accent ring at base */}
          <mesh position={[0, 0.04, -0.01]} material={mats.accent} scale={[1, 0.22, 0.90]}>
            <torusGeometry args={[0.205, 0.016, 6, 18]} />
          </mesh>

        </group>
        {/* end headRef */}

      </group>
      {/* end bodyRef */}

      {/* Name label */}
      {name !== '' && (
        <Billboard position={[0, 2.1, 0]}>
          <Text
            fontSize={0.22}
            color={isMe ? config.outfitColor : 'white'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="black"
          >
            {name}{isMe ? ' ★' : ''}
          </Text>
        </Billboard>
      )}

      {/* Selection ring */}
      {isMe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
          <ringGeometry args={[0.38, 0.50, 32]} />
          <meshBasicMaterial color={config.outfitColor} transparent opacity={0.60} />
        </mesh>
      )}

    </group>
  );
}
