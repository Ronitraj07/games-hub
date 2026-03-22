// Easy words - common, simple to draw
export const EASY_WORDS = [
  'Sun', 'Moon', 'Star', 'Cloud', 'Rain', 'Snow', 'Tree', 'Flower',
  'Apple', 'Banana', 'Car', 'House', 'Dog', 'Cat', 'Bird', 'Fish',
  'Heart', 'Smile', 'Eye', 'Hand', 'Foot', 'Hat', 'Shoe', 'Cup',
  'Book', 'Pen', 'Lamp', 'Door', 'Bell', 'Clock', 'Chair', 'Table',
  'Boat', 'Train', 'Plane', 'Bike', 'Ball', 'Kite', 'Swing', 'Slide',
];

// Normal words - classic Pictionary words
export const NORMAL_WORDS = [
  'Sunset', 'Rainbow', 'Castle', 'Dragon', 'Mermaid', 'Volcano', 'Spaceship', 'Dinosaur',
  'Lighthouse', 'Butterfly', 'Snowman', 'Penguin', 'Guitar', 'Pizza', 'Balloon', 'Treasure',
  'Wizard', 'Robot', 'Jungle', 'Waterfall', 'Campfire', 'Telescope', 'Cactus', 'Crown',
  'Candle', 'Compass', 'Dolphin', 'Umbrella', 'Lantern', 'Heart', 'Kiss', 'Flower', 'Star', 'Moon',
  'Mountain', 'Desert', 'Forest', 'Ocean', 'Bridge', 'Garden', 'Stadium', 'Hospital',
  'Library', 'Museum', 'Theater', 'Restaurant', 'Supermarket', 'Airport', 'Train Station', 'Amusement Park',
];

// Hard words - challenging to draw, abstract or complex
export const HARD_WORDS = [
  'Inception', 'Nostalgia', 'Paradox', 'Symmetry', 'Perspective', 'Reflection', 'Gravity', 'Relativity',
  'Metamorphosis', 'Labyrinth', 'Mirage', 'Constellation', 'Archaeology', 'Evolution', 'Symphony', 'Revolution',
  'Synchronicity', 'Equilibrium', 'Crescendo', 'Silhouette', 'Kaleidoscope', 'Ephemeral', 'Ambiguous', 'Momentum',
  'Illusion', 'Transience', 'Fusion', 'Prism', 'Nexus', 'Catalyst', 'Quantum', 'Algorithm',
  'Metaphor', 'Contradiction', 'Intuition', 'Manifestation', 'Transcendence', 'Enigma', 'Synergy', 'Authenticity',
];

export function getWordPool(difficulty: 'easy' | 'normal' | 'hard'): string[] {
  switch (difficulty) {
    case 'easy':
      return EASY_WORDS;
    case 'normal':
      return NORMAL_WORDS;
    case 'hard':
      return HARD_WORDS;
    default:
      return NORMAL_WORDS;
  }
}

export function selectRandomWord(pool: string[], excludeWords: string[] = []): string {
  const available = pool.filter(w => !excludeWords.includes(w));
  return available[Math.floor(Math.random() * available.length)];
}
