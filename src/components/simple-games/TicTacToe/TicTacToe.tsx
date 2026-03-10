import React from 'react';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Board } from './Board';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TicTacToeGameState {
  board: (string | null)[];
  currentPlayer: string;
  players: { player1: string; player2: string | null };
  winner: string | null;
  winningCells: number[] | null;
  status: 'waiting' | 'active' | 'finished';
  isDraw: boolean;
}

const calculateWinner = (board: (string | null)[]): { winner: string | null; cells: number[] | null } => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a]!, cells: [a, b, c] };
  }
  return { winner: null, cells: null };
};

export const TicTacToe: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const userKey = user?.email ?? null;

  // Build a safe session ID — never use raw email in path
  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `tictactoe-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialState: TicTacToeGameState = {
    board: Array(9).fill(null),
    currentPlayer: userKey ?? '',
    players: { player1: userKey ?? '', player2: null },
    winner: null,
    winningCells: null,
    status: 'waiting',
    isDraw: false,
  };

  const { gameState, updateGameState, loading } = useRealtimeGame<TicTacToeGameState>(
    safeSession, 'tictactoe', initialState
  );

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.status !== 'active' || gameState.currentPlayer !== userKey) return;
    if (gameState.board[index]) return;
    const newBoard = [...gameState.board];
    newBoard[index] = userKey ?? '';
    const { winner, cells } = calculateWinner(newBoard);
    const isDraw = !winner && newBoard.every(c => c !== null);
    const nextPlayer = gameState.currentPlayer === gameState.players.player1
      ? gameState.players.player2
      : gameState.players.player1;
    updateGameState({
      ...gameState,
      board: newBoard,
      winner: winner || null,
      winningCells: cells,
      isDraw,
      status: winner || isDraw ? 'finished' : 'active',
      currentPlayer: winner || isDraw ? gameState.currentPlayer : nextPlayer || '',
    });
  };

  const startGame = () => updateGameState({
    ...initialState,
    players: { player1: userKey ?? '', player2: 'opponent' },
    status: 'active',
  });

  const resetGame = () => updateGameState(initialState);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  );

  const isMyTurn = gameState?.currentPlayer === userKey;
  const mySymbol = gameState?.players.player1 === userKey ? '❌' : '⭕';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition">
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">❌ Tic Tac Toe ⭕</h1>
          <button onClick={resetGame} className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400">
            <RotateCcw size={20} />
          </button>
        </div>

        {(!gameState || gameState.status === 'waiting') && (
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">❌⭕</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tic Tac Toe</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Challenge your partner to a classic game!</p>
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
                <p className={`font-semibold text-lg ${
                  isMyTurn ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isMyTurn ? `Your turn — you are ${mySymbol}` : "Opponent's turn..."}
                </p>
              )}
              {gameState.status === 'finished' && (
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {gameState.isDraw ? "🤝 It's a Draw!" : gameState.winner === userKey ? '🏆 You Win!' : '💔 You Lost!'}
                </p>
              )}
            </div>

            <Board
              board={gameState.board}
              onCellClick={handleCellClick}
              disabled={!isMyTurn || gameState.status !== 'active'}
              winningCells={gameState.winningCells || []}
            />

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
