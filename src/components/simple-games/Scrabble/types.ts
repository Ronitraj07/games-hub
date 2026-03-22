// Scrabble letter values (standard)
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

// 15x15 board multiplier map
export const MULTIPLIER_MAP: Array<Array<'1x' | '2xLetter' | '3xLetter' | '2xWord' | '3xWord'>> = [
  ['3xWord', '2xLetter', '1x', '2xLetter', '1x', '1x', '1x', '3xWord', '1x', '1x', '1x', '2xLetter', '1x', '2xLetter', '3xWord'],
  ['2xLetter', '2xWord', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '2xWord', '2xLetter'],
  ['1x', '1x', '2xWord', '1x', '1x', '1x', '2xLetter', '1x', '2xLetter', '1x', '1x', '1x', '2xWord', '1x', '1x'],
  ['2xLetter', '1x', '1x', '2xWord', '1x', '1x', '1x', '2xLetter', '1x', '1x', '1x', '2xWord', '1x', '1x', '2xLetter'],
  ['1x', '1x', '1x', '1x', '2xWord', '1x', '1x', '1x', '1x', '1x', '2xWord', '1x', '1x', '1x', '1x'],
  ['1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x'],
  ['1x', '1x', '2xLetter', '1x', '1x', '1x', '2xLetter', '1x', '2xLetter', '1x', '1x', '1x', '2xLetter', '1x', '1x'],
  ['3xWord', '1x', '1x', '2xLetter', '1x', '1x', '1x', '2xWord', '1x', '1x', '1x', '2xLetter', '1x', '1x', '3xWord'],
  ['1x', '1x', '2xLetter', '1x', '1x', '1x', '2xLetter', '1x', '2xLetter', '1x', '1x', '1x', '2xLetter', '1x', '1x'],
  ['1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x'],
  ['1x', '1x', '1x', '1x', '2xWord', '1x', '1x', '1x', '1x', '1x', '2xWord', '1x', '1x', '1x', '1x'],
  ['2xLetter', '1x', '1x', '2xWord', '1x', '1x', '1x', '2xLetter', '1x', '1x', '1x', '2xWord', '1x', '1x', '2xLetter'],
  ['1x', '1x', '2xWord', '1x', '1x', '1x', '2xLetter', '1x', '2xLetter', '1x', '1x', '1x', '2xWord', '1x', '1x'],
  ['2xLetter', '2xWord', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '3xLetter', '1x', '1x', '1x', '2xWord', '2xLetter'],
  ['3xWord', '2xLetter', '1x', '2xLetter', '1x', '1x', '1x', '3xWord', '1x', '1x', '1x', '2xLetter', '1x', '2xLetter', '3xWord'],
];

export interface ScrabbleTile {
  letter: string | null;
  playerId: string | null;
  isEmpty: boolean;
}

export interface ScrabbleRack {
  tiles: string[];
  playerId: string;
}

export interface ScrabbleMove {
  playerId: string;
  tiles: Array<{ x: number; y: number; letter: string }>;
  wordsFormed: string[];
  scoreEarned: number;
  timestamp: number;
}

export interface ScrabbleGameState {
  board: ScrabbleTile[][];
  multiplierMap: Array<Array<'1x' | '2xLetter' | '3xLetter' | '2xWord' | '3xWord'>>;

  player1Email: string;
  player2Email: string | null;
  player1Score: number;
  player2Score: number;
  player1Rack: string[];
  player2Rack: string[];
  letterBag: string[];

  currentTurnEmail: string;
  turnTimer: number;
  phase: 'waiting' | 'active' | 'gameOver';
  status: 'lobby' | 'playing' | 'finished';

  moveHistory: ScrabbleMove[];
  lastMove: ScrabbleMove | null;

  seriesId?: string;
  seriesRound?: number;

  mode: 'vs-partner' | 'vs-ai' | 'solo';
  recorded?: boolean;
}

// Sample word list (simplified - in production use comprehensive Scrabble dictionary)
export const VALID_WORDS = new Set<string>([
  'LOVE', 'HEART', 'KISS', 'CARE', 'PLAY', 'GAME', 'BEST', 'GOOD', 'NICE', 'GREAT',
  'WORD', 'WORDS', 'LETTER', 'SCORE', 'BOARD', 'TILE', 'TILES', 'WIN', 'WINS',
  'QI', 'XI', 'XU', 'QUIZ', 'ZEAL', 'ZERO', 'ZONE', 'MAZE', 'JAZZ', 'FIZZ',
  // Extended list... in production would be 170k+ words
]);
