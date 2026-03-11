// ============================================================
// Heartbound Adventures — Global Zustand Store
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  IslandId, AnimationState, WeatherState,
  QualityPreset, QualitySettings, QUALITY_PRESETS as QP,
  CoupleProgress, InventoryItem, PlacedItem, MemoryEntry,
} from '../types/heartbound.types';
import { QUALITY_PRESETS } from '../types/heartbound.types';

// ── Player slice ─────────────────────────────────────────────
interface PlayerSlice {
  avatarUrl: string | null;
  playerName: string;
  currentIsland: IslandId;
  animState: AnimationState;
  setAvatarUrl: (url: string) => void;
  setPlayerName: (name: string) => void;
  setCurrentIsland: (id: IslandId) => void;
  setAnimState: (s: AnimationState) => void;
}

// ── World slice ──────────────────────────────────────────────
interface WorldSlice {
  weather: WeatherState;
  timeOfDay: number;          // 0–24 (in-game hours)
  isNight: boolean;
  setWeather: (w: WeatherState) => void;
  setTimeOfDay: (t: number) => void;
}

// ── Quality slice ────────────────────────────────────────────
interface QualitySlice {
  quality: QualityPreset;
  qualitySettings: QualitySettings;
  setQuality: (q: QualityPreset) => void;
}

// ── UI slice ─────────────────────────────────────────────────
interface UISlice {
  menuOpen: boolean;
  inventoryOpen: boolean;
  mapOpen: boolean;
  dialogueOpen: boolean;
  buildModeActive: boolean;
  setMenuOpen: (v: boolean) => void;
  setInventoryOpen: (v: boolean) => void;
  setMapOpen: (v: boolean) => void;
  setDialogueOpen: (v: boolean) => void;
  setBuildMode: (v: boolean) => void;
}

// ── Progress slice ───────────────────────────────────────────
interface ProgressSlice {
  coupleProgress: CoupleProgress | null;
  inventory: InventoryItem[];
  homeFurniture: PlacedItem[];
  memoryBook: MemoryEntry[];
  setCoupleProgress: (p: CoupleProgress) => void;
  addInventoryItem: (item: InventoryItem) => void;
  setHomeFurniture: (items: PlacedItem[]) => void;
  addMemoryEntry: (entry: MemoryEntry) => void;
}

type HeartboundStore =
  PlayerSlice & WorldSlice & QualitySlice & UISlice & ProgressSlice;

export const useHeartboundStore = create<HeartboundStore>()(
  persist(
    (set, get) => ({
      // ── Player ─────────────────────────────────────────────
      avatarUrl:     null,
      playerName:    '',
      currentIsland: 1,
      animState:     'idle',
      setAvatarUrl:     (url)  => set({ avatarUrl: url }),
      setPlayerName:    (name) => set({ playerName: name }),
      setCurrentIsland: (id)   => set({ currentIsland: id }),
      setAnimState:     (s)    => set({ animState: s }),

      // ── World ──────────────────────────────────────────────
      weather:    'sunny',
      timeOfDay:  10,
      isNight:    false,
      setWeather:   (w) => set({ weather: w }),
      setTimeOfDay: (t) => set({ timeOfDay: t, isNight: t < 6 || t > 20 }),

      // ── Quality ────────────────────────────────────────────
      quality:         'high',
      qualitySettings: QUALITY_PRESETS['high'],
      setQuality: (q) => set({ quality: q, qualitySettings: QUALITY_PRESETS[q] }),

      // ── UI ─────────────────────────────────────────────────
      menuOpen:        false,
      inventoryOpen:   false,
      mapOpen:         false,
      dialogueOpen:    false,
      buildModeActive: false,
      setMenuOpen:      (v) => set({ menuOpen: v }),
      setInventoryOpen: (v) => set({ inventoryOpen: v }),
      setMapOpen:       (v) => set({ mapOpen: v }),
      setDialogueOpen:  (v) => set({ dialogueOpen: v }),
      setBuildMode:     (v) => set({ buildModeActive: v }),

      // ── Progress ───────────────────────────────────────────
      coupleProgress: null,
      inventory:      [],
      homeFurniture:  [],
      memoryBook:     [],
      setCoupleProgress: (p)    => set({ coupleProgress: p }),
      addInventoryItem:  (item) => set((s) => ({
        inventory: s.inventory.some(i => i.id === item.id)
          ? s.inventory.map(i => i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i)
          : [...s.inventory, item]
      })),
      setHomeFurniture:  (items) => set({ homeFurniture: items }),
      addMemoryEntry:    (entry) => set((s) => ({
        memoryBook: [entry, ...s.memoryBook].slice(0, 200)
      })),
    }),
    {
      name: 'heartbound-store',
      partialize: (s) => ({
        avatarUrl:   s.avatarUrl,
        playerName:  s.playerName,
        quality:     s.quality,
        qualitySettings: s.qualitySettings,
      }),
    }
  )
);
