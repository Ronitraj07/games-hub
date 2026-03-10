// Connect 4 AI — minimax with alpha-beta pruning
export type C4Difficulty = 'easy' | 'medium' | 'hard';

const ROWS = 6, COLS = 7;
type Board = (string | null)[][];

const getLowest = (board: Board, col: number): number => {
  for (let r = ROWS - 1; r >= 0; r--) if (!board[r][col]) return r;
  return -1;
};

const checkWin = (board: Board, row: number, col: number, player: string): boolean => {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let i = 1; i < 4; i++) {
      const r = row + dr*i, c = col + dc*i;
      if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break;
      count++;
    }
    for (let i = 1; i < 4; i++) {
      const r = row - dr*i, c = col - dc*i;
      if (r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==player) break;
      count++;
    }
    if (count >= 4) return true;
  }
  return false;
};

const isFull = (board: Board) => board[0].every(c => c !== null);

const scoreWindow = (window: (string|null)[], ai: string, human: string): number => {
  const aiCount  = window.filter(c => c === ai).length;
  const humCount = window.filter(c => c === human).length;
  const empty    = window.filter(c => c === null).length;
  if (aiCount === 4) return 100;
  if (humCount === 4) return -100;
  if (aiCount === 3 && empty === 1) return 5;
  if (humCount === 3 && empty === 1) return -4;
  if (aiCount === 2 && empty === 2) return 2;
  return 0;
};

const heuristic = (board: Board, ai: string, human: string): number => {
  let score = 0;
  // Centre column preference
  const centre = board.map(r => r[Math.floor(COLS/2)]).filter(c => c === ai).length;
  score += centre * 3;
  // Horizontal
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS-4; c++)
      score += scoreWindow([board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]], ai, human);
  // Vertical
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS-4; r++)
      score += scoreWindow([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]], ai, human);
  // Diagonals
  for (let r = 0; r <= ROWS-4; r++) for (let c = 0; c <= COLS-4; c++)
    score += scoreWindow([board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]], ai, human);
  for (let r = 3; r < ROWS; r++) for (let c = 0; c <= COLS-4; c++)
    score += scoreWindow([board[r][c],board[r-1][c+1],board[r-2][c+2],board[r-3][c+3]], ai, human);
  return score;
};

const minimax = (
  board: Board, depth: number, alpha: number, beta: number,
  maximising: boolean, ai: string, human: string
): number => {
  // Terminal check
  const validCols = Array.from({length: COLS}, (_,i) => i).filter(c => getLowest(board, c) !== -1);
  for (const col of validCols) {
    const row = getLowest(board, col);
    const clone = board.map(r => [...r]);
    clone[row][col] = maximising ? ai : human;
    if (checkWin(clone, row, col, maximising ? ai : human))
      return maximising ? 100 + depth : -100 - depth;
  }
  if (depth === 0 || isFull(board) || validCols.length === 0) return heuristic(board, ai, human);

  if (maximising) {
    let best = -Infinity;
    for (const col of validCols) {
      const row = getLowest(board, col);
      const clone = board.map(r => [...r]);
      clone[row][col] = ai;
      best = Math.max(best, minimax(clone, depth-1, alpha, beta, false, ai, human));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const col of validCols) {
      const row = getLowest(board, col);
      const clone = board.map(r => [...r]);
      clone[row][col] = human;
      best = Math.min(best, minimax(clone, depth-1, alpha, beta, true, ai, human));
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
};

export const getConnect4AIMove = (
  board: Board, aiPlayer: string, humanPlayer: string, difficulty: C4Difficulty
): number => {
  const valid = Array.from({length: COLS}, (_,i) => i).filter(c => getLowest(board, c) !== -1);
  if (valid.length === 0) return -1;

  if (difficulty === 'easy') {
    // 80% random, 20% smart
    if (Math.random() < 0.8) return valid[Math.floor(Math.random() * valid.length)];
  }
  if (difficulty === 'medium') {
    // Block immediate wins, else random
    for (const col of valid) {
      const row = getLowest(board, col);
      const clone = board.map(r => [...r]);
      clone[row][col] = humanPlayer;
      if (checkWin(clone, row, col, humanPlayer)) return col; // block
    }
    // Try to win
    for (const col of valid) {
      const row = getLowest(board, col);
      const clone = board.map(r => [...r]);
      clone[row][col] = aiPlayer;
      if (checkWin(clone, row, col, aiPlayer)) return col;
    }
    return valid[Math.floor(Math.random() * valid.length)];
  }

  // Hard: full minimax depth-4
  let bestScore = -Infinity, bestCol = valid[Math.floor(valid.length / 2)];
  for (const col of valid) {
    const row = getLowest(board, col);
    const clone = board.map(r => [...r]);
    clone[row][col] = aiPlayer;
    const score = minimax(clone, 4, -Infinity, Infinity, false, aiPlayer, humanPlayer);
    if (score > bestScore) { bestScore = score; bestCol = col; }
  }
  return bestCol;
};
