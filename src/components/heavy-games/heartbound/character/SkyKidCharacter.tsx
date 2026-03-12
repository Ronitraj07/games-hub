/**
 * SkyKidCharacter
 * ─────────────────────────────────────────────────────────────────
 * Loads /public/models/skykid.glb and renders it in-scene.
 *
 * Fix 2 (2026-03-12):
 *   The old useEffect([cloned, config]) fired before the GLB was
 *   actually rendered into the scene (Suspense boundary), so the
 *   first tint was lost.  On subsequent config changes React's
 *   object-reference comparison for `config` was unreliable.
 *
 *   New approach: track a `tintDirty` ref.  Set it true whenever
 *   any colour field changes (compared by value, not reference).
 *   In useFrame, if dirty, traverse the cloned scene and apply
 *   colours, then clear the flag.  This guarantees tinting happens
 *   after the mesh is on-screen and re-applies on every real change.
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── Config type ───────────────────────────────────────────────────
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

// Keyword lists for mesh-name matching
const OUTFIT_KW = ['body','robe','cloth','torso','shirt','dress','outfit','coat','jacket'];
const CAPE_KW   = ['cape','cloak','back','mantle','scarf'];
const HAIR_KW   = ['hair','braid','ponytail','strand'];
const SKIN_KW   = ['skin','face','head','hand','arm','leg','neck'];
const ACCENT_KW = ['belt','trim','clasp','badge','buckle','collar','accent'];

function matchesKw(name: string, kws: string[]): boolean {
  const n = name.toLowerCase();
  return kws.some(k => n.includes(k));
}

function applyColorToMat(mat: THREE.Material, color: string) {
  const m = mat as THREE.MeshStandardMaterial;
  if (m.color) { m.color.set(color); m.needsUpdate = true; }
}

function tintMesh(mesh: THREE.Mesh, color: string) {
  if (Array.isArray(mesh.material)) mesh.material.forEach(m => applyColorToMat(m, color));
  else applyColorToMat(mesh.material as THREE.Material, color);
}

export function SkyKidCharacter({
  config,
  name,
  isMe,
  terrainFn,
  posRef,
  movingRef,
  facingRef,
  staticPos,
  moving = false,
  facingAngle = 0,
}: SkyKidCharacterProps) {
  const rootRef = useRef<THREE.Group>(null!);
  const movRef  = useRef(moving);
  const angRef  = useRef(facingAngle);
  movRef.current = moving;
  angRef.current = facingAngle;

  // ── Load GLB ─────────────────────────────────────────────────────
  const { scene } = useGLTF('/models/skykid.glb');

  // ── Clone (deep-clone materials for per-instance tinting) ────────
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(m => m.clone());
        } else if (mesh.material) {
          mesh.material = (mesh.material as THREE.Material).clone();
        }
        mesh.castShadow    = true;
        mesh.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  // ── Dirty-flag tinting ───────────────────────────────────────────
  // Start dirty so the first frame always applies colours.
  const tintDirty  = useRef(true);
  const prevConfig = useRef<SkyKidConfig>({ ...DEFAULT_SKYKID_CONFIG });

  // Watch each colour value individually — object reference changes
  // every render but we only want to re-tint when a value actually
  // changes.
  useEffect(() => {
    const p = prevConfig.current;
    if (
      p.outfitColor !== config.outfitColor ||
      p.capeColor   !== config.capeColor   ||
      p.hairColor   !== config.hairColor   ||
      p.accentColor !== config.accentColor ||
      p.skinTone    !== config.skinTone
    ) {
      tintDirty.current  = true;
      prevConfig.current = { ...config };
    }
  });

  // Also mark dirty whenever the cloned scene is replaced (GLB reload)
  useEffect(() => { tintDirty.current = true; }, [cloned]);

  // ── Bone refs ────────────────────────────────────────────────────
  const bones = useRef<{
    root?:  THREE.Bone; spine?: THREE.Bone;
    lArm?:  THREE.Bone; rArm?:  THREE.Bone;
    lLeg?:  THREE.Bone; rLeg?:  THREE.Bone;
    head?:  THREE.Bone; lFoot?: THREE.Bone; rFoot?: THREE.Bone;
  }>({});

  useEffect(() => {
    const b = bones.current;
    cloned.traverse(obj => {
      if (!(obj instanceof THREE.Bone)) return;
      const n = obj.name.toLowerCase();
      if      (n.includes('hips') || n.includes('root') || n.includes('pelvis'))                                                           b.root  = obj;
      else if (n.includes('spine') || n.includes('chest'))                                                                                 b.spine = obj;
      else if ((n.includes('left')  || n.includes('_l')) && n.includes('arm') && !n.includes('fore') && !n.includes('lower'))             b.lArm  = obj;
      else if ((n.includes('right') || n.includes('_r')) && n.includes('arm') && !n.includes('fore') && !n.includes('lower'))             b.rArm  = obj;
      else if ((n.includes('left')  || n.includes('_l')) && (n.includes('leg') || n.includes('thigh') || n.includes('upleg')))            b.lLeg  = obj;
      else if ((n.includes('right') || n.includes('_r')) && (n.includes('leg') || n.includes('thigh') || n.includes('upleg')))            b.rLeg  = obj;
      else if (n.includes('head'))                                                                                                         b.head  = obj;
      else if ((n.includes('left')  || n.includes('_l')) && n.includes('foot'))                                                           b.lFoot = obj;
      else if ((n.includes('right') || n.includes('_r')) && n.includes('foot'))                                                           b.rFoot = obj;
    });
  }, [cloned]);

  // ── Per-frame: tint + position + animation ───────────────────────
  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t = clock.elapsedTime;

    // ── Apply tints if dirty (after GLB loaded / config changed) ──
    if (tintDirty.current) {
      cloned.traverse(obj => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const mesh = obj as THREE.Mesh;
        const n    = mesh.name;
        if      (matchesKw(n, CAPE_KW))   tintMesh(mesh, config.capeColor);
        else if (matchesKw(n, HAIR_KW))   tintMesh(mesh, config.hairColor);
        else if (matchesKw(n, ACCENT_KW)) tintMesh(mesh, config.accentColor);
        else if (matchesKw(n, SKIN_KW))   tintMesh(mesh, config.skinTone);
        else if (matchesKw(n, OUTFIT_KW)) tintMesh(mesh, config.outfitColor);
      });
      tintDirty.current = false;
    }

    // ── Position ──────────────────────────────────────────────────
    if (posRef && terrainFn) {
      const p = posRef.current;
      rootRef.current.position.set(p.x, terrainFn(p.x, p.z), p.z);
    } else if (staticPos) {
      rootRef.current.position.set(staticPos[0], staticPos[1], staticPos[2]);
    }

    // ── Scale ─────────────────────────────────────────────────────
    rootRef.current.scale.setScalar(config.height ?? 1.0);

    // ── Facing ────────────────────────────────────────────────────
    const targetAng = posRef ? (facingRef?.current ?? 0) : angRef.current;
    const cur = rootRef.current.rotation.y;
    rootRef.current.rotation.y = cur + (targetAng - cur) * 0.15;

    // ── Procedural animation ──────────────────────────────────────
    const isMoving = movingRef ? movingRef.current : movRef.current;
    const b = bones.current;

    if (isMoving) {
      const freq  = 2.8;
      const swing = 0.38;
      const legSw = 0.50;
      if (b.root)  b.root.position.y  = Math.abs(Math.sin(t * freq)) * 0.04;
      if (b.spine) b.spine.rotation.z = Math.sin(t * freq) * 0.06;
      if (b.lArm)  b.lArm.rotation.x  =  Math.sin(t * freq) * swing;
      if (b.rArm)  b.rArm.rotation.x  = -Math.sin(t * freq) * swing;
      if (b.lLeg)  b.lLeg.rotation.x  = -Math.sin(t * freq) * legSw;
      if (b.rLeg)  b.rLeg.rotation.x  =  Math.sin(t * freq) * legSw;
      if (b.lFoot) b.lFoot.rotation.x =  Math.sin(t * freq + 0.4) * 0.2;
      if (b.rFoot) b.rFoot.rotation.x = -Math.sin(t * freq + 0.4) * 0.2;
      if (b.head)  b.head.rotation.x  = -0.04;
    } else {
      const s = 0.06;
      if (b.spine) b.spine.rotation.x =  Math.sin(t * 0.8) * s;
      if (b.spine) b.spine.rotation.z =  Math.sin(t * 0.55) * 0.022;
      if (b.lArm)  b.lArm.rotation.z  = -0.12 + Math.sin(t * 0.9 + 0.5) * 0.04;
      if (b.rArm)  b.rArm.rotation.z  =  0.12 - Math.sin(t * 0.9 + 0.5) * 0.04;
      if (b.head)  b.head.rotation.y  =  Math.sin(t * 0.45) * 0.06;
      if (b.head)  b.head.rotation.x  =  Math.sin(t * 0.6)  * 0.03;
      if (b.lLeg)  b.lLeg.rotation.x  += (0 - b.lLeg.rotation.x)  * 0.12;
      if (b.rLeg)  b.rLeg.rotation.x  += (0 - b.rLeg.rotation.x)  * 0.12;
      if (b.lFoot) b.lFoot.rotation.x += (0 - b.lFoot.rotation.x) * 0.12;
      if (b.rFoot) b.rFoot.rotation.x += (0 - b.rFoot.rotation.x) * 0.12;
      if (b.root)  b.root.position.y  += (0 - b.root.position.y)  * 0.10;
    }
  });

  return (
    <group ref={rootRef}>
      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.36, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Sky kid mesh */}
      <primitive object={cloned} />

      {/* Name label */}
      {name !== '' && (
        <Billboard position={[0, 2.2, 0]}>
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
          <ringGeometry args={[0.40, 0.52, 32]} />
          <meshBasicMaterial color={config.outfitColor} transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload('/models/skykid.glb');
