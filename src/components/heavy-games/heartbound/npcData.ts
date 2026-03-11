/**
 * npcData.ts
 * ----------
 * NPC definitions for Meadow Haven.
 * Each NPC has a world-tile position, emoji sprite, name,
 * and an array of dialogue lines cycled on each interaction.
 * Bond XP reward is granted once per session per NPC.
 */

export interface NPC {
  id:       string;
  tx:       number;   // tile X on RAW_MAP
  ty:       number;   // tile Y
  emoji:    string;   // drawn on canvas
  name:     string;
  color:    string;   // speech bubble accent
  xpReward: number;   // bond XP on first talk
  lines:    string[]; // cycled one at a time
}

export const NPCS: NPC[] = [
  {
    id: 'deer',
    tx: 11, ty: 4,
    emoji: '🦌',
    name: 'Sunny the Deer',
    color: '#fbbf24',
    xpReward: 8,
    lines: [
      'The meadow smells extra sweet today 🌿',
      'I heard the pond glows at night... have you seen it?',
      'Two hearts exploring together — that\'s the rarest thing in this world.',
      'Pick some flowers for each other. It means more than you know 🌸',
      'I\'ve lived here forever. You two are the first couple I\'ve met!',
    ],
  },
  {
    id: 'fairy',
    tx: 12, ty: 13,
    emoji: '🧚',
    name: 'Luna the Fairy',
    color: '#a78bfa',
    xpReward: 10,
    lines: [
      'Psst — the Crystal Caves hide a secret only true soulmates can unlock ✨',
      'Every flower you collect together adds a thread to your bond.',
      'I sprinkle bond dust on couples who explore hand-in-hand 💜',
      'Rumour has it Cloud Citadel is beautiful at dawn... Bond Level 60 gets you there!',
      'You two feel special. The island is happy you\'re here 🌸',
    ],
  },
  {
    id: 'bunny',
    tx: 4,  ty: 8,
    emoji: '🐇',
    name: 'Pebble the Bunny',
    color: '#f9a8d4',
    xpReward: 5,
    lines: [
      'Boing! Oh hi! I was just counting dandelions 🌼',
      'Have you tried standing by the pond at sunset? It\'s magical.',
      'My best friend lives on Starlight Shore. Maybe you\'ll meet them someday!',
      'I love it when couples visit. The meadow gets warmer somehow 🥕',
    ],
  },
  {
    id: 'owl',
    tx: 19, ty: 8,
    emoji: '🦉',
    name: 'Sage the Owl',
    color: '#6ee7b7',
    xpReward: 6,
    lines: [
      'Hoooo goes there? Ah — adventurers. Welcome.',
      'The ancient scrolls say: "A bond forged in play never breaks."',
      'Each island holds a piece of a story. You are writing a new chapter.',
      'Wisdom tip: explore slowly. The best things here are easy to miss.',
      'You\'ve collected some flowers? Good. They bloom brighter near loved ones 🌿',
    ],
  },
];

// Tile-based proximity threshold (in pixels from NPC centre)
export const NPC_INTERACT_RANGE = 56; // ~1.4 tiles
