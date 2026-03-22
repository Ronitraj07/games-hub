export type Difficulty = 'easy' | 'normal' | 'hard';
export type SeriesFormat = 'best-of-1' | 'best-of-3' | 'best-of-5';
export type SeriesPhase = 'lobby' | 'difficulty-select' | 'series-active' | 'series-complete' | 'round-summary';

export interface RoundResult {
  roundNumber: number;
  drawer: string;
  guesser: string;
  word: string;
  result: 'correct' | 'timeout' | null;
  drawerScore: number;
  guesserScore: number;
  timeRemaining: number;
}

export interface PictionarySeriesState {
  // Series meta
  seriesFormat: SeriesFormat;
  difficulty: Difficulty;
  seriesPhase: SeriesPhase;

  // Players
  player1Email: string;
  player2Email: string;

  // Series progress
  currentRound: number;
  totalRounds: number;
  player1SeriesScore: number;
  player2SeriesScore: number;
  roundResults: RoundResult[];

  // Current round
  word: string;
  drawerEmail: string;
  guesserEmail: string;
  canvasData: string;
  guess: string;
  phase: 'waiting' | 'drawing' | 'guessing' | 'result';
  result: 'correct' | 'timeout' | null;

  // Firebase sync
  drawerReady: boolean;
  guesserReady: boolean;
  status: 'waiting' | 'active' | 'finished';
  recorded?: boolean;
}
