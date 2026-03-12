// ─────────────────────────────────────────────────────────────────────────────
// systems/gameStore.ts  —  Central Zustand store for all game state
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AvatarConfig, QualityTier } from '../character/types';
import { DEFAULT_AVATAR } from '../character/constants';

// ── Dialogue state ────────────────────────────────────────────────────────────
export interface ActiveDialogue {
  npcId:   string;
  lineIdx: number;
}

// ── Couple interaction state ──────────────────────────────────────────────────
export type PiggybackRole = 'carrier' | 'rider' | null;

// ── Full store interface ──────────────────────────────────────────────────────
interface GameState {
  // ── UI ──
  menuOpen:        boolean;
  activeDialogue:  ActiveDialogue | null;
  isFullscreen:    boolean;
  showEmoteWheel:  boolean;
  showInventory:   boolean;
  showMemoryBook:  boolean;
  showWorldMap:    boolean;

  // ── Quality ──
  quality:         QualityTier;

  // ── Avatar ──
  avatarConfig:    AvatarConfig;
  avatarSaved:     boolean;

  // ── Bond / couple ──
  bondXP:          number;
  bondLevel:       number;
  isHoldingHands:  boolean;
  activeInteraction: string | null;
  piggybackRole:   PiggybackRole;
  partnerEmail:    string | null;

  // ── World ──
  currentIsland:   number;
  unlockedIslands: number[];
  visitedChunks:   string[];
  collectedItems:  Record<string, number>;
  flowerCount:     number;

  // ── Achievements ──
  unlockedAchievements: string[];

  // ── Tutorial ──
  tutorialComplete: boolean;

  // ── Actions ──
  setMenuOpen:           (v: boolean) => void;
  setActiveDialogue:     (d: ActiveDialogue | null) => void;
  setIsFullscreen:       (v: boolean) => void;
  setShowEmoteWheel:     (v: boolean) => void;
  setQuality:            (q: QualityTier) => void;
  setAvatarConfig:       (cfg: AvatarConfig) => void;
  setAvatarSaved:        (v: boolean) => void;
  addBondXP:             (amount: number) => void;
  setBondXP:             (xp: number) => void;
  setIsHoldingHands:     (v: boolean) => void;
  setActiveInteraction:  (id: string | null) => void;
  setPiggybackRole:      (r: PiggybackRole) => void;
  setPartnerEmail:       (e: string | null) => void;
  setCurrentIsland:      (n: number) => void;
  unlockIsland:          (n: number) => void;
  markChunkVisited:      (key: string) => void;
  collectItem:           (itemId: string, qty?: number) => void;
  incrementFlowers:      () => void;
  unlockAchievement:     (id: string) => void;
  setTutorialComplete:   (v: boolean) => void;
  isBlocked:             () => boolean;  // true when menu/dialogue open
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // ── Initial UI state ──
      menuOpen:          false,
      activeDialogue:    null,
      isFullscreen:      false,
      showEmoteWheel:    false,
      showInventory:     false,
      showMemoryBook:    false,
      showWorldMap:      false,

      // ── Quality (default high, auto-detect in QualityManager) ──
      quality: 'high',

      // ── Avatar ──
      avatarConfig:  { ...DEFAULT_AVATAR },
      avatarSaved:   false,

      // ── Bond ──
      bondXP:           0,
      bondLevel:        1,
      isHoldingHands:   false,
      activeInteraction:null,
      piggybackRole:    null,
      partnerEmail:     null,

      // ── World ──
      currentIsland:    1,
      unlockedIslands:  [1],
      visitedChunks:    [],
      collectedItems:   {},
      flowerCount:      0,

      // ── Achievements ──
      unlockedAchievements: [],

      // ── Tutorial ──
      tutorialComplete: false,

      // ── Actions ──
      setMenuOpen:          (v) => set({ menuOpen: v }),
      setActiveDialogue:    (d) => set({ activeDialogue: d }),
      setIsFullscreen:      (v) => set({ isFullscreen: v }),
      setShowEmoteWheel:    (v) => set({ showEmoteWheel: v }),
      setQuality:           (q) => set({ quality: q }),
      setAvatarConfig:      (cfg) => set({ avatarConfig: cfg }),
      setAvatarSaved:       (v)  => set({ avatarSaved: v }),

      addBondXP: (amount) => {
        const cur   = get().bondXP;
        const next  = cur + amount;
        const level = Math.floor(next / 100) + 1;
        set({ bondXP: next, bondLevel: level });
      },
      setBondXP: (xp) => {
        set({ bondXP: xp, bondLevel: Math.floor(xp / 100) + 1 });
      },

      setIsHoldingHands:    (v)  => set({ isHoldingHands: v }),
      setActiveInteraction: (id) => set({ activeInteraction: id }),
      setPiggybackRole:     (r)  => set({ piggybackRole: r }),
      setPartnerEmail:      (e)  => set({ partnerEmail: e }),
      setCurrentIsland:     (n)  => set({ currentIsland: n }),

      unlockIsland: (n) => {
        const cur = get().unlockedIslands;
        if (!cur.includes(n)) set({ unlockedIslands: [...cur, n] });
      },

      markChunkVisited: (key) => {
        const cur = get().visitedChunks;
        if (!cur.includes(key)) set({ visitedChunks: [...cur, key] });
      },

      collectItem: (itemId, qty = 1) =>
        set((s) => ({
          collectedItems: {
            ...s.collectedItems,
            [itemId]: (s.collectedItems[itemId] ?? 0) + qty,
          },
        })),

      incrementFlowers: () =>
        set((s) => ({ flowerCount: s.flowerCount + 1 })),

      unlockAchievement: (id) => {
        const cur = get().unlockedAchievements;
        if (!cur.includes(id)) set({ unlockedAchievements: [...cur, id] });
      },

      setTutorialComplete: (v) => set({ tutorialComplete: v }),

      isBlocked: () => {
        const s = get();
        return s.menuOpen || s.activeDialogue !== null || s.showEmoteWheel;
      },
    }),
    {
      name: 'heartbound-game-state',
      // Only persist these keys across sessions
      partialize: (s) => ({
        quality:              s.quality,
        avatarConfig:         s.avatarConfig,
        avatarSaved:          s.avatarSaved,
        bondXP:               s.bondXP,
        bondLevel:            s.bondLevel,
        unlockedIslands:      s.unlockedIslands,
        visitedChunks:        s.visitedChunks,
        collectedItems:       s.collectedItems,
        flowerCount:          s.flowerCount,
        unlockedAchievements: s.unlockedAchievements,
        tutorialComplete:     s.tutorialComplete,
        partnerEmail:         s.partnerEmail,
      }),
    },
  ),
);
