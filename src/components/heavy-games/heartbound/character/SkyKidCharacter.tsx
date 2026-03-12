/**
 * SkyKidCharacter — Procedural Sky-style character
 * ─────────────────────────────────────────────────────────────────
 * Fully procedural — no GLB required.
 * Built from Three.js primitives with MeshToonMaterial for the
 * soft cel-shaded look of Sky: Children of the Light.
 *
 * Shape breakdown:
 *   • Head       — SphereGeometry, slightly oval
 *   • Hood/hat   — ConeGeometry with soft tip, drapes over head
 *   • Mask       — thin EllipsoidCurve flattened onto face
 *   • Hair wisps — small swept CylinderGeometry strands
 *   • Body/robe  — CylinderGeometry tapered wide at hem
 *   • Cape       — separate group, LatheGeometry-like fan shape,
 *                   sways with sine wave
 *   • Arms       — CapsuleGeometry, thin, slightly angled
 *   • Hands      — small SphereGeometry
 *   • Legs       — thin CapsuleGeometry, hidden under robe
 *
 * Animations:
 *   • Idle  — gentle body sway, cape flutter, head tilt
 *   • Walk  — arm swing, leg swing, body bob, cape billow
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

// ── Toon gradient texture (3-step) ─────────────────────────────────────
function makeToonGradient(): THREE.DataTexture {
  const data = new Uint8Array([40, 40, 40, 255, 160, 160, 160, 255, 255, 255, 255, 255]);
  const tex  = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}
const TOON_GRADIENT = makeToonGradient();

// ── Material factory ───────────────────────────────────────────────────
function toon(color: string, opts?: { transparent?: boolean; opacity?: number; side?: THREE.Side }): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color:       new THREE.Color(color),
    gradientMap: TOON_GRADIENT,
    transparent: opts?.transparent ?? false,
    opacity:     opts?.opacity     ?? 1.0,
    side:        opts?.side        ?? THREE.FrontSide,
  });
}

// ── Cape geometry (fan of quads, flows behind) ────────────────────────
function makeCapeGeometry(): THREE.BufferGeometry {
  // A simple quad that's wide at the bottom and narrow at the top,
  // giving a flowing cape silhouette.
  const w = 0.72, h = 0.80;
  const verts = new Float32Array([
    // top (attached at neck, narrow)
    -0.18, 0,  0.01,
     0.18, 0,  0.01,
    // bottom (wide hem, slight billow)
    -w * 0.5,  -h,  -0.10,
    -w * 0.15, -h,  -0.18,
     0,        -h,  -0.20,
     w * 0.15, -h,  -0.18,
     w * 0.5,  -h,  -0.10,
  ]);
  // Build triangles (fan)
  const idx = new Uint16Array([
    0,2,3,  0,3,1,
    0,3,4,  0,4,1,
    0,4,5,  0,5,1,
    0,5,6,  0,6,1,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

// ── Hood geometry (soft cone draped over head) ──────────────────────
const CAPE_GEO = makeCapeGeometry();

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
  moving    = false,
  facingAngle = 0,
}: SkyKidCharacterProps) {
  // ── Refs ──────────────────────────────────────────────────────
  const rootRef  = useRef<THREE.Group>(null!);
  const bodyRef  = useRef<THREE.Group>(null!);
  const capeRef  = useRef<THREE.Mesh>(null!);
  const headRef  = useRef<THREE.Group>(null!);
  const lArmRef  = useRef<THREE.Group>(null!);
  const rArmRef  = useRef<THREE.Group>(null!);
  const lLegRef  = useRef<THREE.Group>(null!);
  const rLegRef  = useRef<THREE.Group>(null!);

  const movRef = useRef(moving);
  const angRef = useRef(facingAngle);
  movRef.current = moving;
  angRef.current = facingAngle;

  // ── Materials (re-created when config changes) ──────────────────────
  const mats = useMemo(() => ({
    skin:   toon(config.skinTone),
    outfit: toon(config.outfitColor),
    cape:   toon(config.capeColor, { side: THREE.DoubleSide }),
    hair:   toon(config.hairColor),
    accent: toon(config.accentColor),
    mask:   toon('#e8d5c4', { transparent: true, opacity: 0.92 }),
    white:  toon('#f5f0ea'),
    dark:   toon('#1a0a00'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [config.skinTone, config.outfitColor, config.capeColor, config.hairColor, config.accentColor]);

  // ── Animation ─────────────────────────────────────────────────────
  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t = clock.elapsedTime;

    // Position
    if (posRef && terrainFn) {
      const p = posRef.current;
      rootRef.current.position.set(p.x, terrainFn(p.x, p.z), p.z);
    } else if (staticPos) {
      rootRef.current.position.set(staticPos[0], staticPos[1], staticPos[2]);
    }

    // Scale
    rootRef.current.scale.setScalar(config.height ?? 1.0);

    // Facing
    const targetAng = posRef ? (facingRef?.current ?? 0) : angRef.current;
    rootRef.current.rotation.y += (targetAng - rootRef.current.rotation.y) * 0.15;

    const isMoving = movingRef ? movingRef.current : movRef.current;

    if (isMoving) {
      // Walk cycle
      const freq = 2.6;
      if (bodyRef.current)  bodyRef.current.position.y  = Math.abs(Math.sin(t * freq)) * 0.03;
      if (bodyRef.current)  bodyRef.current.rotation.z  = Math.sin(t * freq) * 0.04;
      if (headRef.current)  headRef.current.rotation.x  = Math.sin(t * freq * 0.5) * 0.04;
      if (lArmRef.current)  lArmRef.current.rotation.x  =  Math.sin(t * freq) * 0.5;
      if (rArmRef.current)  rArmRef.current.rotation.x  = -Math.sin(t * freq) * 0.5;
      if (lLegRef.current)  lLegRef.current.rotation.x  = -Math.sin(t * freq) * 0.55;
      if (rLegRef.current)  rLegRef.current.rotation.x  =  Math.sin(t * freq) * 0.55;
      // Cape billows out when walking
      if (capeRef.current)  capeRef.current.rotation.x  = 0.25 + Math.sin(t * freq * 0.5) * 0.12;
    } else {
      // Idle sway
      if (bodyRef.current)  bodyRef.current.rotation.z  = Math.sin(t * 0.6) * 0.025;
      if (bodyRef.current)  bodyRef.current.position.y  = Math.sin(t * 0.9) * 0.012;
      if (headRef.current)  headRef.current.rotation.y  = Math.sin(t * 0.45) * 0.07;
      if (headRef.current)  headRef.current.rotation.x  = Math.sin(t * 0.6)  * 0.03;
      if (lArmRef.current)  lArmRef.current.rotation.z  = -0.15 + Math.sin(t * 0.8 + 0.5) * 0.05;
      if (rArmRef.current)  rArmRef.current.rotation.z  =  0.15 - Math.sin(t * 0.8 + 0.5) * 0.05;
      // Return legs to rest
      if (lLegRef.current)  lLegRef.current.rotation.x  += (0 - lLegRef.current.rotation.x) * 0.12;
      if (rLegRef.current)  rLegRef.current.rotation.x  += (0 - rLegRef.current.rotation.x) * 0.12;
      // Cape gentle flutter
      if (capeRef.current)  capeRef.current.rotation.x  = 0.08 + Math.sin(t * 1.1) * 0.06;
    }
  });

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <group ref={rootRef}>

      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Body group — everything except cape attached here */}
      <group ref={bodyRef} position={[0, 0, 0]}>

        {/* ── Legs (mostly hidden under robe) ── */}
        <group ref={lLegRef} position={[-0.10, 0.22, 0]}>
          <mesh material={mats.skin}>
            <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
          </mesh>
        </group>
        <group ref={rLegRef} position={[0.10, 0.22, 0]}>
          <mesh material={mats.skin}>
            <capsuleGeometry args={[0.055, 0.28, 4, 8]} />
          </mesh>
        </group>

        {/* ── Robe / body ── */}
        {/* Lower skirt — wide cone */}
        <mesh position={[0, 0.36, 0]} material={mats.outfit}>
          <cylinderGeometry args={[0.22, 0.44, 0.52, 14, 1]} />
        </mesh>
        {/* Upper torso */}
        <mesh position={[0, 0.72, 0]} material={mats.outfit}>
          <cylinderGeometry args={[0.17, 0.22, 0.36, 12, 1]} />
        </mesh>
        {/* Belt / accent trim */}
        <mesh position={[0, 0.58, 0]} material={mats.accent}>
          <cylinderGeometry args={[0.225, 0.225, 0.045, 12]} />
        </mesh>
        {/* Small collar */}
        <mesh position={[0, 0.88, 0]} material={mats.white}>
          <cylinderGeometry args={[0.13, 0.17, 0.07, 10]} />
        </mesh>

        {/* ── Cape (attached at neck, billows behind) ── */}
        <mesh
          ref={capeRef}
          geometry={CAPE_GEO}
          material={mats.cape}
          position={[0, 0.88, 0.06]}
          rotation={[0.08, 0, 0]}
        />

        {/* ── Arms ── */}
        <group ref={lArmRef} position={[-0.22, 0.76, 0]}>
          {/* Upper arm */}
          <mesh material={mats.outfit} rotation={[0, 0, 0.25]}>
            <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
          </mesh>
          {/* Forearm */}
          <mesh position={[-0.05, -0.22, 0]} material={mats.skin}>
            <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
          </mesh>
          {/* Hand */}
          <mesh position={[-0.07, -0.35, 0]} material={mats.skin}>
            <sphereGeometry args={[0.055, 8, 6]} />
          </mesh>
        </group>

        <group ref={rArmRef} position={[0.22, 0.76, 0]}>
          <mesh material={mats.outfit} rotation={[0, 0, -0.25]}>
            <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
          </mesh>
          <mesh position={[0.05, -0.22, 0]} material={mats.skin}>
            <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
          </mesh>
          <mesh position={[0.07, -0.35, 0]} material={mats.skin}>
            <sphereGeometry args={[0.055, 8, 6]} />
          </mesh>
        </group>

        {/* ── Head group ── */}
        <group ref={headRef} position={[0, 1.08, 0]}>

          {/* Head (slightly oval) */}
          <mesh material={mats.skin} scale={[1, 1.08, 0.95]}>
            <sphereGeometry args={[0.175, 16, 14]} />
          </mesh>

          {/* Sky mask — the signature oval face mask */}
          <mesh position={[0, 0.02, 0.14]} material={mats.mask} scale={[1, 0.7, 0.18]}>
            <sphereGeometry args={[0.17, 12, 8]} />
          </mesh>

          {/* Eye glints on mask */}
          <mesh position={[-0.055, 0.03, 0.175]} material={mats.dark}>
            <sphereGeometry args={[0.022, 6, 5]} />
          </mesh>
          <mesh position={[0.055, 0.03, 0.175]} material={mats.dark}>
            <sphereGeometry args={[0.022, 6, 5]} />
          </mesh>
          {/* Eye shine */}
          <mesh position={[-0.048, 0.038, 0.182]} material={mats.white}>
            <sphereGeometry args={[0.009, 4, 4]} />
          </mesh>
          <mesh position={[0.062, 0.038, 0.182]} material={mats.white}>
            <sphereGeometry args={[0.009, 4, 4]} />
          </mesh>

          {/* Hair wisps — a few swept strands */}
          <mesh position={[-0.10, 0.12, -0.08]} rotation={[0.3, 0.4, -0.5]} material={mats.hair}>
            <capsuleGeometry args={[0.022, 0.14, 3, 6]} />
          </mesh>
          <mesh position={[0.10, 0.10, -0.09]} rotation={[0.2, -0.3, 0.5]} material={mats.hair}>
            <capsuleGeometry args={[0.020, 0.12, 3, 6]} />
          </mesh>
          <mesh position={[0.02, 0.16, -0.10]} rotation={[0.4, 0.1, 0.1]} material={mats.hair}>
            <capsuleGeometry args={[0.018, 0.10, 3, 6]} />
          </mesh>

          {/* Hood — soft pointed cone draped over head */}
          {/* Hood base (draped over) */}
          <mesh position={[0, 0.09, -0.04]} material={mats.outfit} scale={[1, 1, 0.82]}>
            <sphereGeometry args={[0.195, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Hood tip / point */}
          <mesh position={[0, 0.32, -0.05]} rotation={[0.22, 0, 0]} material={mats.outfit}>
            <coneGeometry args={[0.115, 0.38, 10]} />
          </mesh>
          {/* Hood accent ring */}
          <mesh position={[0, 0.09, -0.01]} material={mats.accent} scale={[1, 0.25, 0.85]}>
            <torusGeometry args={[0.185, 0.018, 6, 16]} />
          </mesh>

        </group>
        {/* end headRef */}

      </group>
      {/* end bodyRef */}

      {/* Name label */}
      {name !== '' && (
        <Billboard position={[0, 2.0, 0]}>
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
          <ringGeometry args={[0.36, 0.48, 32]} />
          <meshBasicMaterial color={config.outfitColor} transparent opacity={0.65} />
        </mesh>
      )}

    </group>
  );
}
