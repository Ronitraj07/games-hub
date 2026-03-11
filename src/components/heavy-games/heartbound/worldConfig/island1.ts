// ============================================================
// Island 1 — Meadow Haven world configuration
// ============================================================
import type { IslandConfig } from '../../../../types/heartbound.types';

export const ISLAND_1: IslandConfig = {
  id: 1,
  name: 'Meadow Haven',
  theme: 'meadow',
  size: { x: 1000, z: 1000 },
  spawnPoint: { x: 0, z: 0 },
  ambientTrack: 'meadow_ambience.mp3',
  fogNear: 80,
  fogFar: 200,
  hasInterior: false,
  unlockCondition: null,
  districts: [
    {
      id: 'meadow_core',
      name: 'Meadow Core',
      bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
      activities: [
        { id: 'bond_tree',     type: 'couple',  name: 'Bond Tree',       position: { x: 0,    z: -30 }, bondXpReward: 20, requiresPartner: true,  cooldownMinutes: 1440 },
        { id: 'campfire',      type: 'couple',  name: 'Campfire Circle', position: { x: 20,   z: 20  }, bondXpReward: 10, requiresPartner: false, cooldownMinutes: 60   },
        { id: 'pond_explore',  type: 'explore', name: 'Reflective Pond', position: { x: 0,    z: 0   }, bondXpReward: 5,  requiresPartner: false, cooldownMinutes: 0    },
      ],
    },
    {
      id: 'market_village',
      name: 'Market Village',
      bounds: { minX: -300, maxX: -100, minZ: 100, maxZ: 300 },
      activities: [
        { id: 'notice_board',  type: 'quest',   name: 'Daily Notice Board', position: { x: -180, z: 180 }, bondXpReward: 15, requiresPartner: false, cooldownMinutes: 1440 },
        { id: 'market_shop',   type: 'minigame',name: 'Market Stalls',      position: { x: -200, z: 200 }, bondXpReward: 5,  requiresPartner: false, cooldownMinutes: 30   },
      ],
    },
    {
      id: 'flower_fields',
      name: 'Flower Fields',
      bounds: { minX: 100, maxX: 350, minZ: 100, maxZ: 350 },
      activities: [
        { id: 'flower_gather', type: 'gather',  name: 'Pick Flowers',    position: { x: 200, z: 200 }, bondXpReward: 5, itemRewards: ['meadow_flower','wild_daisy'], requiresPartner: false, cooldownMinutes: 30 },
        { id: 'beehive',       type: 'gather',  name: 'Beehive',         position: { x: 300, z: 250 }, bondXpReward: 8, itemRewards: ['honeycomb'], requiresPartner: false, cooldownMinutes: 120 },
      ],
    },
    {
      id: 'ancient_ruins',
      name: 'Ancient Ruins',
      bounds: { minX: 100, maxX: 350, minZ: -350, maxZ: -100 },
      activities: [
        { id: 'lore_fragment', type: 'explore', name: 'Lore Fragment',   position: { x: 200, z: -200 }, bondXpReward: 10, requiresPartner: false, cooldownMinutes: 0 },
        { id: 'hidden_chest',  type: 'explore', name: 'Hidden Chest',    position: { x: 300, z: -280 }, bondXpReward: 25, itemRewards: ['ancient_relic'], requiresPartner: false, cooldownMinutes: 4320 },
      ],
    },
    {
      id: 'cliffside_path',
      name: 'Cliffside Path',
      bounds: { minX: -350, maxX: -100, minZ: -350, maxZ: -100 },
      activities: [
        { id: 'viewpoint',     type: 'explore', name: 'Cliffside Viewpoint', position: { x: -250, z: -250 }, bondXpReward: 15, requiresPartner: false, cooldownMinutes: 0 },
        { id: 'rope_bridge',   type: 'couple',  name: 'Rope Bridge Cross',   position: { x: -180, z: -180 }, bondXpReward: 20, requiresPartner: true,  cooldownMinutes: 0 },
      ],
    },
    {
      id: 'lakeside_retreat',
      name: 'Lakeside Retreat',
      bounds: { minX: -150, maxX: 150, minZ: -500, maxZ: -300 },
      activities: [
        { id: 'fishing_dock',  type: 'fish',    name: 'Fishing Dock',    position: { x: 0,   z: -400 }, bondXpReward: 10, itemRewards: ['river_bass','golden_carp'], requiresPartner: false, cooldownMinutes: 15 },
        { id: 'picnic_area',   type: 'couple',  name: 'Picnic Blanket',  position: { x: -80, z: -380 }, bondXpReward: 20, requiresPartner: true,  cooldownMinutes: 120 },
      ],
    },
  ],
  npcs: [
    {
      id: 'luna',
      name: 'Luna',
      modelPath: '/models/npcs/luna.glb',
      position: { x: 30, z: -20 },
      patrolPath: [{ x: 30, z: -20 }, { x: 50, z: -10 }, { x: 40, z: 10 }, { x: 30, z: -20 }],
      xpReward: 15,
      islandId: 1,
      role: 'quest',
      dialogues: [
        { id: 'luna_1', text: 'Welcome to Meadow Haven, dear travellers. This island holds many secrets — but only those who explore together will find them.', emotion: 'mysterious' },
        { id: 'luna_2', text: 'The Bond Tree at the heart of the meadow grows stronger with every memory you make. Have you visited it yet?', emotion: 'happy' },
        { id: 'luna_3', text: 'I can sense a deep connection between you two. Cherish it — it is rarer than you know.', emotion: 'neutral' },
      ],
    },
    {
      id: 'petal',
      name: 'Petal',
      modelPath: '/models/npcs/petal.glb',
      position: { x: 220, z: 210 },
      patrolPath: [{ x: 220, z: 210 }, { x: 260, z: 230 }, { x: 240, z: 260 }, { x: 220, z: 210 }],
      xpReward: 10,
      islandId: 1,
      role: 'merchant',
      dialogues: [
        { id: 'petal_1', text: 'Oh! You found the Flower Fields! I come here every morning — the Wild Daisies are at their best just after sunrise.', emotion: 'excited' },
        { id: 'petal_2', text: 'If you bring me 10 Meadow Flowers, I can weave you a crown. It is a tradition here for couples in bloom.', emotion: 'happy', triggers: [{ type: 'start_quest', value: 'flower_crown_quest' }] },
      ],
    },
    {
      id: 'chef_bram',
      name: 'Chef Bram',
      modelPath: '/models/npcs/chef.glb',
      position: { x: -180, z: 195 },
      xpReward: 10,
      islandId: 1,
      role: 'merchant',
      dialogues: [
        { id: 'bram_1', text: "Welcome to my stall! Today's special is Honey Wildberry Tart — made with fresh honeycomb from the fields.", emotion: 'happy' },
        { id: 'bram_2', text: 'A couple who cooks together, stays together! Once you unlock the cooking system, come show me what you can make.', emotion: 'excited' },
      ],
    },
    {
      id: 'glimmer',
      name: 'Glimmer',
      modelPath: '/models/npcs/merchant.glb',
      position: { x: -210, z: 220 },
      xpReward: 10,
      islandId: 1,
      role: 'merchant',
      dialogues: [
        { id: 'glimmer_1', text: 'Crystals, seeds, furniture blueprints — I trade in things of beauty and wonder. What takes your fancy?', emotion: 'neutral' },
        { id: 'glimmer_2', text: 'That relic you found in the Ancient Ruins? I could tell you its story… for a small trade.', emotion: 'mysterious' },
      ],
    },
    {
      id: 'melody',
      name: 'Melody',
      modelPath: '/models/npcs/musician.glb',
      position: { x: 10, z: 25 },
      patrolPath: [{ x: 10, z: 25 }, { x: -10, z: 30 }, { x: 0, z: 45 }, { x: 10, z: 25 }],
      xpReward: 8,
      islandId: 1,
      role: 'ambient',
      dialogues: [
        { id: 'melody_1', text: 'Can you hear it? The meadow has its own song. Sit by the campfire tonight and you might hear it too.', emotion: 'happy' },
        { id: 'melody_2', text: 'I have been composing a piece for two voices. Maybe someday the two of you could help me finish it.', emotion: 'excited' },
      ],
    },
    {
      id: 'elder_oak',
      name: 'Elder Oak',
      modelPath: '/models/npcs/elder.glb',
      position: { x: 5, z: -28 },
      xpReward: 20,
      islandId: 1,
      role: 'quest',
      dialogues: [
        { id: 'oak_1', text: 'This Bond Tree has stood for a thousand years. Every couple that has tended it has left a piece of their story within its roots.', emotion: 'neutral' },
        { id: 'oak_2', text: 'Place your hands on the bark together. You will feel it — the warmth of every bond that came before yours.', emotion: 'mysterious', triggers: [{ type: 'bond_xp', value: 20 }] },
      ],
    },
    {
      id: 'fisher_tom',
      name: 'Tom',
      modelPath: '/models/npcs/fisher.glb',
      position: { x: 5, z: -395 },
      xpReward: 8,
      islandId: 1,
      role: 'ambient',
      dialogues: [
        { id: 'tom_1', text: 'Patience is the secret to fishing — and to love, some say! Cast your line and wait. The lake rewards the calm.', emotion: 'happy' },
        { id: 'tom_2', text: 'On a clear night you can see the lights of the other islands from this dock. Magical, is it not?', emotion: 'neutral' },
      ],
    },
    {
      id: 'inn_keeper',
      name: 'Rosie',
      modelPath: '/models/npcs/innkeeper.glb',
      position: { x: -160, z: 170 },
      xpReward: 8,
      islandId: 1,
      role: 'ambient',
      dialogues: [
        { id: 'rosie_1', text: 'The inn is always open for weary explorers. Rest here and your energy will be restored by morning.', emotion: 'happy' },
        { id: 'rosie_2', text: 'I have heard rumours of other islands to the south and east. Adventurous souls have been known to sail there on the ferry.', emotion: 'neutral' },
      ],
    },
  ],
};
