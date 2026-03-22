import { LETTER_VALUES, VALID_WORDS, ScrabbleTile } from './types';

/**
 * Calculate score for a word placed on the board
 * Handles multiplier squares (only apply to newly placed tiles)
 */
export const calculateWordScore = (
  word: string,
  positions: Array<{ x: number; y: number; isNew: boolean }>,
  multiplierMap: Array<Array<string>>,
): number => {
  let score = 0;
  let wordMultiplier = 1;

  for (let i = 0; i < word.length; i++) {
    const letter = word[i].toUpperCase();
    const letterValue = LETTER_VALUES[letter] || 0;
    const { x, y, isNew } = positions[i];

    let letterScore = letterValue;

    if (isNew) {
      const multiplier = multiplierMap[y]?.[x] || '1x';
      if (multiplier === '2xLetter') letterScore *= 2;
      if (multiplier === '3xLetter') letterScore *= 3;
      if (multiplier === '2xWord') wordMultiplier *= 2;
      if (multiplier === '3xWord') wordMultiplier *= 3;
    }

    score += letterScore;
  }

  return score * wordMultiplier;
};

/**
 * Validate if a word is in the Scrabble dictionary
 */
export const isValidWord = (word: string): boolean => {
  return VALID_WORDS.has(word.toUpperCase());
};

/**
 * Extract all words from a board move (including cross-words)
 */
export const extractWordsFormed = (
  tiles: Array<{ x: number; y: number; letter: string }>,
  board: ScrabbleTile[][],
): string[] => {
  const words: string[] = [];

  // Check horizontal words
  if (tiles.length > 0) {
    const minX = Math.min(...tiles.map(t => t.x));
    const maxX = Math.max(...tiles.map(t => t.x));

    let word = '';
    for (let x = minX - 1; x <= maxX + 1; x++) {
      const tile = board[tiles[0].y][x];
      if (tile && !tile.isEmpty) {
        word += tile.letter;
      }
    }
    if (word.length > 1) words.push(word);
  }

  return words;
};

/**
 * Check if move is legal (forms valid words, connects to existing tiles)
 */
export const isLegalMove = (
  tiles: Array<{ x: number; y: number; letter: string }>,
  board: ScrabbleTile[][],
  isFirstMove: boolean,
): boolean => {
  // First move must use center square (7, 7)
  if (isFirstMove) {
    const hasCenter = tiles.some(t => t.x === 7 && t.y === 7);
    if (!hasCenter) return false;
  }

  // All tiles must be in same row or column
  const rows = new Set(tiles.map(t => t.y));
  const cols = new Set(tiles.map(t => t.x));
  const sameRow = rows.size === 1;
  const sameCol = cols.size === 1;
  if (!sameRow && !sameCol) return false;

  // Check for gaps
  if (sameRow) {
    const xs = tiles.map(t => t.x).sort((a, b) => a - b);
    for (let i = xs[0]; i <= xs[xs.length - 1]; i++) {
      const hasTile = tiles.some(t => t.x === i) || !board[tiles[0].y]?.[i]?.isEmpty;
      if (!hasTile) return false;
    }
  }

  // All words formed must be valid
  const wordsFormed = extractWordsFormed(tiles, board);
  return wordsFormed.every(word => isValidWord(word));
};

/**
 * Draw tiles from bag
 */
export const drawTiles = (bag: string[], count: number): { tiles: string[]; remaining: string[] } => {
  const tiles = bag.splice(0, count);
  return { tiles, remaining: bag };
};

/**
 * Get initial letter bag (standard Scrabble distribution)
 */
export const getInitialLetterBag = (): string[] => {
  const distribution: Record<string, number> = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1,
    K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6,
    U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
  };

  const bag: string[] = [];
  Object.entries(distribution).forEach(([letter, count]) => {
    for (let i = 0; i < count; i++) {
      bag.push(letter);
    }
  });

  return bag.sort(() => Math.random() - 0.5); // Shuffle
};

/**
 * Basic AI move generator (simplified for MVP)
 */
export const generateAIMove = (
  rack: string[],
  board: ScrabbleTile[][],
  isFirstMove: boolean,
): Array<{ x: number; y: number; letter: string }> | null => {
  if (isFirstMove) {
    // AI plays a simple word in the center
    const word = 'LOVE';
    const moves = [];
    for (let i = 0; i < word.length; i++) {
      moves.push({
        x: 7 - Math.floor(word.length / 2) + i,
        y: 7,
        letter: word[i],
      });
    }
    return moves;
  }

  // Random simple move (in production, would be more sophisticated)
  return null;
};

/**
 * Create empty 15x15 board
 */
export const createEmptyBoard = (): ScrabbleTile[][] => {
  return Array(15).fill(null).map(() =>
    Array(15).fill(null).map(() => ({
      letter: null,
      playerId: null,
      isEmpty: true,
    }))
  );
};

// Scrabble board premium square positions (standard Scrabble board)
export const SCRABBLE_PREMIUM_SQUARES = {
  // Triple word scores
  tripleWord: [[0, 0], [0, 7], [0, 14], [7, 0], [7, 14], [14, 0], [14, 7], [14, 14]],
  // Double word scores
  doubleWord: [[1, 1], [1, 13], [2, 2], [2, 12], [3, 3], [3, 11], [4, 4], [4, 10], [10, 4], [10, 10], [11, 3], [11, 11], [12, 2], [12, 12], [13, 1], [13, 13]],
  // Triple letter scores
  tripleLetter: [[1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13], [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9]],
  // Double letter scores
  doubleLetter: [[0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14], [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11], [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14], [12, 6], [12, 8], [14, 3], [14, 11]],
};

export function getPremiumType(row: number, col: number): string | undefined {
  if (row === 7 && col === 7) return 'multiplierWord3x'; // Center
  
  for (const [r, c] of SCRABBLE_PREMIUM_SQUARES.tripleWord) {
    if (row === r && col === c) return 'multiplierWord3x';
  }
  for (const [r, c] of SCRABBLE_PREMIUM_SQUARES.doubleWord) {
    if (row === r && col === c) return 'multiplierWord2x';
  }
  for (const [r, c] of SCRABBLE_PREMIUM_SQUARES.tripleLetter) {
    if (row === r && col === c) return 'multiplier3x';
  }
  for (const [r, c] of SCRABBLE_PREMIUM_SQUARES.doubleLetter) {
    if (row === r && col === c) return 'multiplier2x';
  }
  return undefined;
}
