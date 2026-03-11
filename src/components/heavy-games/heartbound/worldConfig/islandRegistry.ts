// ============================================================
// Island Registry — master list, expands as phases complete
// ============================================================
import type { IslandId, IslandConfig } from '../../../../types/heartbound.types';
import { ISLAND_1 } from './island1';

// Add islands here as they are built (phases 8A–8J)
export const ISLAND_REGISTRY: Partial<Record<IslandId, IslandConfig>> = {
  1: ISLAND_1,
  // 2: ISLAND_2,   // Phase 8A
  // 3: ISLAND_3,   // Phase 8B
  // 4: ISLAND_4,   // Phase 8C
  // 5: ISLAND_5,   // Phase 8D
  // 6: ISLAND_6,   // Phase 8E
  // 7: ISLAND_7,   // Phase 8F
  // 8: ISLAND_8,   // Phase 8G
  // 9: ISLAND_9,   // Phase 8H
  // 10: ISLAND_10, // Phase 8I
  // 11: ISLAND_11, // Phase 8J
  // 12: ISLAND_12, // Phase 7C
};

export function getIsland(id: IslandId): IslandConfig | null {
  return ISLAND_REGISTRY[id] ?? null;
}

export const ALWAYS_AVAILABLE_ISLANDS: IslandId[] = [1];
