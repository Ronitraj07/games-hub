/**
 * useProceduralAnim
 * Drives all character animation states procedurally.
 * No GLB / keyframe data — everything is sine/cosine curves.
 *
 * Supported AnimStates:
 *   idle | walk | run | sit | wave | bow | celebrate | emote_heart
 *   emote_dance | emote_spin | emote_cry | emote_think
 *   combat_attack | combat_block | combat_dodge | combat_hit
 *   fish | garden | cook | sleep
 */
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AnimState =
  | 'idle' | 'walk' | 'run' | 'sit' | 'wave' | 'bow' | 'celebrate'
  | 'emote_heart' | 'emote_dance' | 'emote_spin' | 'emote_cry' | 'emote_think'
  | 'combat_attack' | 'combat_block' | 'combat_dodge' | 'combat_hit'
  | 'fish' | 'garden' | 'cook' | 'sleep';

interface ProceduralAnimProps {
  rootRef:  React.MutableRefObject<THREE.Group>;
  bodyRef:  React.MutableRefObject<THREE.Group>;
  lArmRef:  React.MutableRefObject<THREE.Group>;
  rArmRef:  React.MutableRefObject<THREE.Group>;
  lLegRef:  React.MutableRefObject<THREE.Group>;
  rLegRef:  React.MutableRefObject<THREE.Group>;
  headRef:  React.MutableRefObject<THREE.Group>;
  movingRef?: React.MutableRefObject<boolean>;
  facingRef?: React.MutableRefObject<number>;
  posRef?:   React.MutableRefObject<THREE.Vector3>;
  terrainFn?: (x: number, z: number) => number;
  animState: AnimState;
}

import React from 'react';

export function useProceduralAnim({
  bodyRef, lArmRef, rArmRef, lLegRef, rLegRef, headRef,
  movingRef, animState,
}: ProceduralAnimProps) {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const isMoving = movingRef?.current ?? false;

    // Reset all rotations
    const zero = new THREE.Euler(0, 0, 0);
    if (bodyRef.current)  bodyRef.current.rotation.copy(zero);
    if (lArmRef.current)  lArmRef.current.rotation.copy(zero);
    if (rArmRef.current)  rArmRef.current.rotation.copy(zero);
    if (lLegRef.current)  lLegRef.current.rotation.copy(zero);
    if (rLegRef.current)  rLegRef.current.rotation.copy(zero);
    if (headRef.current)  headRef.current.rotation.copy(zero);

    const state = isMoving ? 'walk' : animState;

    switch (state) {
      case 'idle': {
        const breathe = Math.sin(t * 1.6) * 0.012;
        if (bodyRef.current) bodyRef.current.rotation.x = breathe;
        if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.5) * 0.08;
        break;
      }
      case 'walk': {
        const sw = Math.sin(t * 9) * 0.55;
        if (lArmRef.current) lArmRef.current.rotation.x =  sw;
        if (rArmRef.current) rArmRef.current.rotation.x = -sw;
        if (lLegRef.current) lLegRef.current.rotation.x = -sw * 0.85;
        if (rLegRef.current) rLegRef.current.rotation.x =  sw * 0.85;
        if (bodyRef.current) bodyRef.current.rotation.y = Math.sin(t * 9) * 0.04;
        break;
      }
      case 'run': {
        const sw = Math.sin(t * 14) * 0.9;
        if (lArmRef.current) lArmRef.current.rotation.x =  sw * 1.2;
        if (rArmRef.current) rArmRef.current.rotation.x = -sw * 1.2;
        if (lLegRef.current) lLegRef.current.rotation.x = -sw;
        if (rLegRef.current) rLegRef.current.rotation.x =  sw;
        if (bodyRef.current) { bodyRef.current.rotation.x = 0.18; bodyRef.current.rotation.y = Math.sin(t * 14) * 0.06; }
        break;
      }
      case 'sit': {
        if (lLegRef.current) lLegRef.current.rotation.x = -1.3;
        if (rLegRef.current) rLegRef.current.rotation.x = -1.3;
        if (bodyRef.current) bodyRef.current.rotation.x = 0.15;
        break;
      }
      case 'wave': {
        if (rArmRef.current) rArmRef.current.rotation.x = -1.2 + Math.sin(t * 5) * 0.3;
        if (rArmRef.current) rArmRef.current.rotation.z = -0.4;
        if (headRef.current) headRef.current.rotation.y = 0.2;
        break;
      }
      case 'bow': {
        const bow = Math.min(t * 1.5, 0.85);
        if (bodyRef.current) bodyRef.current.rotation.x = bow;
        if (headRef.current) headRef.current.rotation.x = bow * 0.5;
        break;
      }
      case 'celebrate': {
        const j = Math.abs(Math.sin(t * 6)) * 0.3;
        if (lArmRef.current) lArmRef.current.rotation.x = -1.4 + j;
        if (rArmRef.current) rArmRef.current.rotation.x = -1.4 + j;
        if (bodyRef.current) bodyRef.current.rotation.y = Math.sin(t * 3) * 0.3;
        break;
      }
      case 'emote_dance': {
        const d = Math.sin(t * 4);
        if (bodyRef.current) { bodyRef.current.rotation.y = d * 0.4; bodyRef.current.rotation.x = Math.abs(d) * 0.15; }
        if (lArmRef.current) lArmRef.current.rotation.x = d * 0.9;
        if (rArmRef.current) rArmRef.current.rotation.x = -d * 0.9;
        if (lLegRef.current) lLegRef.current.rotation.x = -d * 0.5;
        if (rLegRef.current) rLegRef.current.rotation.x =  d * 0.5;
        break;
      }
      case 'emote_spin': {
        if (bodyRef.current) bodyRef.current.rotation.y = t * 4;
        if (lArmRef.current) lArmRef.current.rotation.z = -0.8;
        if (rArmRef.current) rArmRef.current.rotation.z =  0.8;
        break;
      }
      case 'emote_heart': {
        const pulse = 1 + Math.sin(t * 4) * 0.1;
        if (bodyRef.current) bodyRef.current.scale.setScalar(pulse);
        if (lArmRef.current) lArmRef.current.rotation.x = -0.6;
        if (rArmRef.current) rArmRef.current.rotation.x = -0.6;
        break;
      }
      case 'emote_cry': {
        if (headRef.current) headRef.current.rotation.x = 0.35;
        if (bodyRef.current) bodyRef.current.rotation.x = Math.sin(t * 3) * 0.05;
        break;
      }
      case 'emote_think': {
        if (rArmRef.current) { rArmRef.current.rotation.x = -0.7; rArmRef.current.rotation.z = 0.2; }
        if (headRef.current)  headRef.current.rotation.y = 0.25;
        break;
      }
      case 'combat_attack': {
        const atk = Math.sin(t * 8);
        if (rArmRef.current) rArmRef.current.rotation.x = atk * 1.4;
        if (bodyRef.current) bodyRef.current.rotation.y = atk * 0.25;
        break;
      }
      case 'combat_block': {
        if (lArmRef.current) { lArmRef.current.rotation.x = -0.9; lArmRef.current.rotation.z =  0.5; }
        if (rArmRef.current) { rArmRef.current.rotation.x = -0.7; rArmRef.current.rotation.z = -0.3; }
        if (bodyRef.current) bodyRef.current.rotation.x = 0.1;
        break;
      }
      case 'combat_dodge': {
        if (bodyRef.current) { bodyRef.current.rotation.z = Math.sin(t * 6) * 0.4; bodyRef.current.rotation.x = 0.2; }
        break;
      }
      case 'combat_hit': {
        if (bodyRef.current) bodyRef.current.rotation.z = Math.sin(t * 12) * 0.25;
        break;
      }
      case 'fish': {
        if (rArmRef.current) rArmRef.current.rotation.x = -0.6 + Math.sin(t * 0.8) * 0.15;
        if (bodyRef.current) bodyRef.current.rotation.x = 0.08;
        break;
      }
      case 'garden': {
        const g = Math.sin(t * 1.5);
        if (lArmRef.current) lArmRef.current.rotation.x = -0.5 + g * 0.3;
        if (rArmRef.current) rArmRef.current.rotation.x = -0.3 + g * 0.2;
        if (bodyRef.current) bodyRef.current.rotation.x = 0.25 + g * 0.05;
        break;
      }
      case 'cook': {
        const c = Math.sin(t * 3);
        if (rArmRef.current) rArmRef.current.rotation.x = c * 0.4;
        if (lArmRef.current) lArmRef.current.rotation.x = -0.4;
        break;
      }
      case 'sleep': {
        if (bodyRef.current) bodyRef.current.rotation.x = 0.9;
        if (lLegRef.current) lLegRef.current.rotation.x = -0.4;
        if (rLegRef.current) rLegRef.current.rotation.x = -0.4;
        if (headRef.current) headRef.current.rotation.z = 0.3;
        break;
      }
    }
  });
}
