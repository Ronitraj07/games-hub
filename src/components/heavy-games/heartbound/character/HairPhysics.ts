/**
 * HairPhysics
 * Spring-chain simulation for flowing, wild, and windswept hair styles.
 * Returns positions relative to the head attachment point.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const HAIR_NODES   = 5;
const HAIR_SEG     = 0.12;
const HAIR_GRAVITY = 0.008;
const HAIR_DAMPING = 0.82;
const HAIR_WIND    = 0.005;

type Vec3 = [number, number, number];

export function useHairPhysics(enabled: boolean): Vec3[] {
  const rest: Vec3[] = Array.from(
    { length: HAIR_NODES },
    (_, i) => [0, -i * HAIR_SEG, -i * HAIR_SEG * 0.5] as Vec3
  );

  const cur  = useRef<Vec3[]>(rest.map(p => [...p] as Vec3));
  const prev = useRef<Vec3[]>(rest.map(p => [...p] as Vec3));

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t   = clock.elapsedTime;
    const c   = cur.current;
    const p   = prev.current;
    const sav: Vec3[] = c.map(x => [...x] as Vec3);

    c[0] = [0, 0, 0]; // anchor

    for (let i = 1; i < HAIR_NODES; i++) {
      const vx = (c[i][0] - p[i][0]) * HAIR_DAMPING;
      const vy = (c[i][1] - p[i][1]) * HAIR_DAMPING;
      const vz = (c[i][2] - p[i][2]) * HAIR_DAMPING;
      const w  = Math.sin(t * 2.1 + i * 1.3) * HAIR_WIND;
      c[i] = [
        c[i][0] + vx + w,
        c[i][1] + vy - HAIR_GRAVITY,
        c[i][2] + vz,
      ];
    }

    // Length constraint
    for (let iter = 0; iter < 3; iter++) {
      for (let i = 1; i < HAIR_NODES; i++) {
        const dx = c[i][0] - c[i-1][0];
        const dy = c[i][1] - c[i-1][1];
        const dz = c[i][2] - c[i-1][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.0001;
        const diff = (dist - HAIR_SEG) / dist * 0.5;
        c[i][0] -= dx * diff;
        c[i][1] -= dy * diff;
        c[i][2] -= dz * diff;
        if (i > 1) {
          c[i-1][0] += dx * diff;
          c[i-1][1] += dy * diff;
          c[i-1][2] += dz * diff;
        }
      }
    }

    prev.current = sav;
  });

  if (!enabled) return rest;
  return cur.current;
}
