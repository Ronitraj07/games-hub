/**
 * CapePhysics
 * Simple verlet integration chain for cape simulation.
 * Returns an array of [x, y, z] positions for each chain node.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const CHAIN_LEN   = 6;   // number of nodes
const SEGMENT_LEN = 0.18; // rest length between nodes
const GRAVITY     = 0.012;
const DAMPING     = 0.88;
const WIND_FREQ   = 0.4;
const WIND_AMP    = 0.008;

type Vec3 = [number, number, number];

export function useCapePhysics(enabled: boolean): Vec3[] {
  const positions = useRef<Vec3[]>(
    Array.from({ length: CHAIN_LEN }, (_, i) => [0, -i * SEGMENT_LEN, 0] as Vec3)
  );
  const prev = useRef<Vec3[]>(
    Array.from({ length: CHAIN_LEN }, (_, i) => [0, -i * SEGMENT_LEN, 0] as Vec3)
  );

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.elapsedTime;
    const cur  = positions.current;
    const prv  = prev.current;

    // Save current as previous
    const saved: Vec3[] = cur.map(p => [...p] as Vec3);

    // Anchor node 0 stays fixed at origin
    cur[0] = [0, 0, 0];

    // Verlet integrate nodes 1+
    for (let i = 1; i < CHAIN_LEN; i++) {
      const vel: Vec3 = [
        (cur[i][0] - prv[i][0]) * DAMPING,
        (cur[i][1] - prv[i][1]) * DAMPING,
        (cur[i][2] - prv[i][2]) * DAMPING,
      ];
      const wind = Math.sin(t * WIND_FREQ * Math.PI * 2 + i * 0.8) * WIND_AMP;
      cur[i] = [
        cur[i][0] + vel[0] + wind,
        cur[i][1] + vel[1] - GRAVITY,
        cur[i][2] + vel[2],
      ];
    }

    // Constraint: enforce segment length
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 1; i < CHAIN_LEN; i++) {
        const dx = cur[i][0] - cur[i-1][0];
        const dy = cur[i][1] - cur[i-1][1];
        const dz = cur[i][2] - cur[i-1][2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.0001;
        const diff = (dist - SEGMENT_LEN) / dist;
        cur[i][0] -= dx * diff * 0.5;
        cur[i][1] -= dy * diff * 0.5;
        cur[i][2] -= dz * diff * 0.5;
        if (i > 1) {
          cur[i-1][0] += dx * diff * 0.5;
          cur[i-1][1] += dy * diff * 0.5;
          cur[i-1][2] += dz * diff * 0.5;
        }
      }
    }

    prev.current = saved;
  });

  if (!enabled) {
    return Array.from({ length: CHAIN_LEN }, (_, i) => [0, -i * SEGMENT_LEN, 0] as Vec3);
  }
  return positions.current;
}
