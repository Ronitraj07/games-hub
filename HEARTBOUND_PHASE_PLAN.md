# Heartbound Adventures — Phase Build Plan
_Last updated: March 2026_

## Status

| Phase | Name | Status |
|---|---|---|
| 0 | Pre-Build Setup | ✅ Done (code pushed) |
| 1 | Avatar Creator (RPM) | 🔜 Next |
| 2 | Character Controller | ⬜ Pending |
| 3 | Realistic NPC System | ⬜ Pending |
| 4 | Island 1 Expansion (1000×1000) | ⬜ Pending |
| 5 | HD+ Visual Pipeline | ⬜ Pending |
| 6 | Day/Night + Weather | ⬜ Pending |
| 7A | Gathering & Inventory | ⬜ Pending |
| 7B | Bond System & Couple Mechanics | ⬜ Pending |
| 7C | Home Building (Island 12) | ⬜ Pending |
| 7D | Mini-Games (fishing, stargazing, cooking, photo) | ⬜ Pending |
| 7E | Daily Challenges & Memory Book | ⬜ Pending |
| 8A–8J | Islands 2–11 | ⬜ Pending |
| 9 | Travel System (ferry, bridges, world map) | ⬜ Pending |
| 10 | Audio System | ⬜ Pending |
| 11 | Quality Preset System | ⬜ Pending |
| 12 | Polish, Achievements, Launch | ⬜ Pending |

## What Was Done in Phase 0

### Repo changes (auto-pushed)
- `package.json` — added: `@react-three/postprocessing`, `postprocessing`, `zustand`, `framer-motion`, `three-stdlib`
- `supabase/migrations/006_heartbound.sql` — 6 new tables: `couple_progress`, `rpg_inventory`, `couple_home`, `memory_book`, `daily_challenges`, `npc_interactions`, `achievements`; also `avatar_url` + `avatar_updated_at` on `profiles`
- `src/types/heartbound.types.ts` — all TypeScript types: Island, NPC, Activity, Item, Bond, Player state, Weather, Chunk, Quality presets
- `src/stores/heartboundStore.ts` — global Zustand store (player, world, quality, UI, progress slices), persists avatar URL + quality setting to localStorage
- `src/components/heavy-games/heartbound/worldConfig/island1.ts` — full Island 1 config: 6 districts, 8 NPCs, all activities
- `src/components/heavy-games/heartbound/worldConfig/islandRegistry.ts` — registry for all 12 islands (stubs for 2–12)
- `src/components/heavy-games/heartbound/itemDatabase.ts` — item database with starter items
- `src/hooks/firebase/useHeartboundPresence.ts` — upgraded real-time presence hook with animation state + island tracking
- `src/hooks/supabase/useHeartboundData.ts` — Supabase CRUD: avatar, couple progress, inventory, home, memory book
- `public/models/npcs/`, `public/animations/`, `public/audio/`, `public/hdri/` — folder structure created

## What YOU Need to Do for Phase 0

See the Phase 0 manual tasks guide below.
