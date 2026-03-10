import type { CellValue, BoardState } from '@/components/simple-games/TicTacToe/types';

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

export const checkWinner = (board: BoardState): CellValue => {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
};

const minimax = (
  board: BoardState,
  isMaximising: boolean,
  alpha: number,
  beta: number,
  depth: number
): number => {
  const winner = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (board.every(c => c !== null)) return 0;
  if (depth >= 6) return 0; // depth limit for perf

  if (isMaximising) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = 'O';
      best = Math.max(best, minimax(board, false, alpha, beta, depth + 1));
      board[i] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = 'X';
      best = Math.min(best, minimax(board, true, alpha, beta, depth + 1));
      board[i] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
};

const empty = (board: BoardState) => board.map((c, i) => c === null ? i : -1).filter(i => i >= 0);

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export const getAIMove = (board: BoardState, difficulty: AIDifficulty): number => {
  const available = empty(board);
  if (available.length === 0) return -1;

  // Easy: 80% random
  if (difficulty === 'easy') {
    if (Math.random() < 0.8) return available[Math.floor(Math.random() * available.length)];
  }

  // Medium: 50% random, 50% minimax
  if (difficulty === 'medium') {
    if (Math.random() < 0.5) return available[Math.floor(Math.random() * available.length)];
  }

  // Hard (and minimax fallthrough): always best move
  let bestScore = -Infinity;
  let bestMove  = available[0];
  const clone = [...board] as BoardState;

  for (const i of available) {
    clone[i] = 'O';
    const score = minimax(clone, false, -Infinity, Infinity, 0);
    clone[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove  = i;
    }
  }
  return bestMove;
};
