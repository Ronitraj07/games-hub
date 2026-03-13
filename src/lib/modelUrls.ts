// All 3D model URLs served from Supabase Storage
const BASE = 'https://npkyivpfwrbqhmraicqr.supabase.co/storage/v1/object/public/models'

export const PLAYER_VRMS: Record<string, string> = {
  'sinharonitraj@gmail.com':     `${BASE}/characters/sparkles.vrm`,
  'radhikadidwania567@gmail.com': `${BASE}/characters/shizzy.vrm`,
  'shizzandsparkles@gmail.com':  `${BASE}/characters/sparkles.vrm`,
}

export const MODELS = {
  // ── NPCs ────────────────────────────────────────────────
  npc_male:      `${BASE}/characters/npc_male.glb`,
  npc_female:    `${BASE}/characters/npc_female.glb`,
  npc_elder:     `${BASE}/characters/npc_elder.glb`,
  npc_guard:     `${BASE}/characters/npc_guard.glb`,
  npc_monk:      `${BASE}/characters/npc_monk.glb`,
  npc_performer: `${BASE}/characters/npc_performer.glb`,
  npc_ferry:     `${BASE}/characters/npc_ferry.glb`,

  // ── Animals ─────────────────────────────────────────────
  bear:        `${BASE}/animals/animal_bear.glb`,
  deer:        `${BASE}/animals/animal_deer.glb`,
  fox:         `${BASE}/animals/animal_fox.glb`,
  rabbit:      `${BASE}/animals/animal_rabbit.glb`,
  horse:       `${BASE}/animals/animal_horse.glb`,
  cat:         `${BASE}/animals/animal_cat.glb`,
  dog:         `${BASE}/animals/animal_dog.glb`,
  corgi:       `${BASE}/animals/animal_corgi.glb`,
  sheep:       `${BASE}/animals/animal_sheep.glb`,
  cow:         `${BASE}/animals/animal_cow.glb`,
  chicken:     `${BASE}/animals/animal_chicken.glb`,
  duck:        `${BASE}/animals/animal_duck.glb`,
  frog:        `${BASE}/animals/animal_frog.glb`,
  lizard:      `${BASE}/animals/animal_lizard.glb`,
  shark:       `${BASE}/animals/animal_shark.glb`,
  beagle:      `${BASE}/animals/animal_beagle.glb`,
  butterfly:   `${BASE}/animals/animal_butterfly.glb`,
  fish:        `${BASE}/animals/animal_fish.glb`,
  turtle:      `${BASE}/animals/animal_turtle.glb`,
  dragon:      `${BASE}/animals/animal_dragon.glb`,

  // ── Birds ───────────────────────────────────────────────
  bird_dove:    `${BASE}/birds/bird_dove.glb`,
  bird_snow:    `${BASE}/birds/bird_snow.glb`,
  bird_eagle:   `${BASE}/birds/bird_eagle.glb`,
  bird_owl:     `${BASE}/birds/bird_owl.glb`,
  bird_crow:    `${BASE}/birds/bird_crow.glb`,
  bird_parrot:  `${BASE}/birds/bird_parrot.glb`,
  bird_seagull: `${BASE}/birds/bird_seagull.glb`,

  // ── Fantasy ─────────────────────────────────────────────
  fairy:  `${BASE}/fantasy/fairy.glb`,
  spirit: `${BASE}/fantasy/spirit.glb`,
  golem:  `${BASE}/fantasy/golem.glb`,
} as const

export type ModelKey = keyof typeof MODELS
