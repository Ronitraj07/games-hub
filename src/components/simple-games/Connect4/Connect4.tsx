import React, { useState } from 'react';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Connect4GameState {
  board: (string | null)[][];
  currentPlayer: string;
  players: { player1: string; player2: string | null };
  winner: string | null;
  winningCells: number[][] | null;
  status: 'waiting' | 'active' | 'finished';
  isDraw: boolean;
}

const ROWS = 6, COLS = 7;
const createEmptyBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

const checkWinner = (board: (string | null)[][], row: number, col: number, player: string) => {
  for (let c = 0; c <= COLS - 4; c++) if ([0,1,2,3].every(i => board[row][c+i] === player)) return [[row,c],[row,c+1],[row,c+2],[row,c+3]];
  for (let r = 0; r <= ROWS - 4; r++) if ([0,1,2,3].every(i => board[r+i][col] === player)) return [[r,col],[r+1,col],[r+2,col],[r+3,col]];
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c <= COLS - 4; c++) if ([0,1,2,3].every(i => board[r+i] && board[r+i][c+i] === player)) return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 3; c < COLS; c++) if ([0,1,2,3].every(i => board[r+i] && board[r+i][c-i] === player)) return [[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]];
  return null;
};

export const Connect4: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const userKey = user?.email ?? null;

  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `connect4-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialState: Connect4GameState = {
    board: createEmptyBoard(),
    currentPlayer: userKey ?? '',
    players: { player1: userKey ?? '', player2: null },
    winner: null, winningCells: null, status: 'waiting', isDraw: false,
  };

  const { gameState, updateGameState, loading } = useRealtimeGame<Connect4GameState>(
    safeSession, 'connect4', initialState
  );

  const handleColumnClick = (col: number) => {
    if (!gameState || gameState.status !== 'active' || gameState.currentPlayer !== userKey) return;
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) { if (!gameState.board[r]?.[col]) { row = r; break; } }
    if (row === -1) return;
    const newBoard = gameState.board.map((r: (string | null)[]) => [...r]);
    newBoard[row][col] = userKey ?? '';
    const cells = checkWinner(newBoard, row, col, userKey ?? '');
    const full  = newBoard[0].every((c: string | null) => c !== null);
    if (cells) {
      updateGameState({ ...gameState, board: newBoard, winner: userKey ?? '', winningCells: cells, status: 'finished' });
    } else if (full) {
      updateGameState({ ...gameState, board: newBoard, isDraw: true, status: 'finished' });
    } else {
      const next = gameState.currentPlayer === gameState.players.player1
        ? gameState.players.player2
        : gameState.players.player1;
      updateGameState({ ...gameState, board: newBoard, currentPlayer: next ?? '' });
    }
  };

  const startGame = () => updateGameState({
    ...initialState,
    players: { player1: userKey ?? '', player2: 'opponent' },
    status: 'active',
  });
  const resetGame = () => updateGameState(initialState);
  const isWinning = (r: number, c: number) =>
    gameState?.winningCells?.some(([wr, wc]: number[]) => wr === r && wc === c) || false;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;

  const isP1 = gameState?.players.player1 === userKey;
  const myColor  = isP1 ? 'from-pink-500 to-rose-500' : 'from-yellow-400 to-orange-500';
  const oppColor = isP1 ? 'from-yellow-400 to-orange-500' : 'from-pink-500 to-rose-500';
  const isMyTurn = gameState?.currentPlayer === userKey;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">🔴 Connect 4 🔵</h1>
          <button onClick={resetGame} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"><RotateCcw size={20} /></button>
        </div>

        {(!gameState || gameState.status === 'waiting') && (
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">🔴🔵</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect 4</h2>
            <button onClick={startGame} disabled={!userKey}
              className="bg-gradient-to-r from-pink-500 to-purple-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition hover:scale-105">
              Start Game
            </button>
          </div>
        )}

        {gameState && gameState.status !== 'waiting' && (
          <div className="space-y-4">
            <div className="glass-card p-4 text-center">
              {gameState.status === 'active' && (
                <p className={`font-semibold text-lg ${isMyTurn ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500'}`}>
                  {isMyTurn ? 'Your turn!' : "Opponent's turn..."}
                </p>
              )}
              {gameState.status === 'finished' && (
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {gameState.isDraw ? "🤝 Draw!" : gameState.winner === userKey ? '🏆 You Win!' : '💔 You Lost!'}
                </p>
              )}
            </div>

            <div className="glass-card p-4">
              <div className="grid mb-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px' }}>
                {Array(COLS).fill(null).map((_, c) => (
                  <div key={c} className="flex justify-center">
                    <div className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      hoveredCol === c && isMyTurn && gameState.status === 'active'
                        ? `bg-gradient-to-b ${myColor} opacity-80` : 'opacity-0'
                    }`} />
                  </div>
                ))}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px' }}>
                {Array.isArray(gameState.board) && gameState.board.map((rowArr: (string|null)[], r: number) =>
                  Array.isArray(rowArr) && rowArr.map((cell: string|null, c: number) => (
                    <button key={`${r}-${c}`}
                      onClick={() => handleColumnClick(c)}
                      onMouseEnter={() => setHoveredCol(c)}
                      onMouseLeave={() => setHoveredCol(null)}
                      disabled={gameState.status !== 'active' || !isMyTurn}
                      className="aspect-square rounded-full transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed"
                      style={{
                        background: cell
                          ? isWinning(r, c)
                            ? 'linear-gradient(135deg,#fbbf24,#f59e0b)'
                            : cell === gameState.players.player1
                            ? 'linear-gradient(135deg,#ec4899,#f43f5e)'
                            : 'linear-gradient(135deg,#facc15,#f97316)'
                          : 'rgba(255,255,255,0.3)',
                        boxShadow: cell
                          ? isWinning(r,c)
                            ? '0 0 16px rgba(251,191,36,0.8),inset 0 2px 4px rgba(255,255,255,0.3)'
                            : 'inset 0 2px 4px rgba(0,0,0,0.1)'
                          : 'inset 0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-3 flex justify-around">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${myColor}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">You</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${oppColor}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">Opponent</span>
              </div>
            </div>

            {gameState.status === 'finished' && (
              <button onClick={resetGame}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02]">
                Play Again 💕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
