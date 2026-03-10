import React from 'react';
import { useRealtimeGame, sanitizeFirebasePath } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Board } from './Board';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CellValue, BoardState } from './types';

interface TicTacToeGameState {
  board: BoardState;
  currentPlayer: 'X' | 'O';
  players: { player1: string; player2: string | null };
  winner: 'X' | 'O' | null;
  winningCells: number[] | null;
  status: 'waiting' | 'active' | 'finished';
  isDraw: boolean;
}

/** Always returns a safe 9-element board — Firebase omits all-null arrays */
const safeBoard = (board: BoardState | null | undefined): BoardState => {
  const b = Array.isArray(board) ? board : [];
  // Pad to 9, replacing any undefined slot (Firebase-omitted null) with null
  return Array.from({ length: 9 }, (_, i) =>
    i < b.length && b[i] !== undefined ? b[i] : null
  ) as BoardState;
};

const calculateWinner = (
  board: BoardState
): { winner: CellValue; cells: number[] | null } => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], cells: [a, b, c] };
    }
  }
  return { winner: null, cells: null };
};

export const TicTacToe: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const { user } = useAuth();
  const userKey = user?.email ?? null;

  const safeSession = sessionId
    ? sanitizeFirebasePath(sessionId)
    : `tictactoe-${userKey ? sanitizeFirebasePath(userKey) : 'guest'}`;

  const initialState: TicTacToeGameState = {
    board: Array(9).fill(null) as BoardState,
    currentPlayer: 'X',
    players: { player1: userKey ?? '', player2: null },
    winner: null,
    winningCells: null,
    status: 'waiting',
    isDraw: false,
  };

  const { gameState, updateGameState, loading } = useRealtimeGame<TicTacToeGameState>(
    safeSession, 'tictactoe', initialState
  );

  const mySymbol: CellValue = gameState?.players?.player1 === userKey ? 'X' : 'O';
  const isMyTurn = gameState?.currentPlayer === mySymbol;

  // Always use a safe board — never trust raw Firebase board directly
  const currentBoard = safeBoard(gameState?.board);

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.status !== 'active' || !isMyTurn) return;
    if (index < 0 || index > 8) return;

    const board = safeBoard(gameState.board);
    if (board[index]) return; // cell already taken

    const newBoard: BoardState = [...board] as BoardState;
    newBoard[index] = mySymbol;

    const { winner, cells } = calculateWinner(newBoard);
    const isDraw = !winner && newBoard.every(c => c !== null);
    const nextPlayer: 'X' | 'O' = gameState.currentPlayer === 'X' ? 'O' : 'X';

    updateGameState({
      ...gameState,
      board: newBoard,
      winner,
      winningCells: cells,
      isDraw,
      status: winner || isDraw ? 'finished' : 'active',
      currentPlayer: winner || isDraw ? gameState.currentPlayer : nextPlayer,
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition"
          >
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Tic Tac Toe
          </h1>
          <button
            onClick={resetGame}
            className="glass-btn p-2 rounded-xl text-gray-600 dark:text-gray-400"
            title="Reset game"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Waiting / Start screen */}
        {(!gameState || gameState.status === 'waiting') && (
          <div className="glass-card p-8 text-center">
            <div className="text-6xl mb-4">❌⭕</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tic Tac Toe</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Challenge your partner to a classic game!
            </p>
            <button
              onClick={startGame}
              disabled={!userKey}
              className="bg-gradient-to-r from-pink-500 to-purple-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Active / Finished game */}
        {gameState && gameState.status !== 'waiting' && (
          <div className="space-y-4">

            {/* Status banner */}
            <div className="glass-card p-4 text-center">
              {gameState.status === 'active' && (
                <p className={`font-semibold text-lg ${
                  isMyTurn
                    ? 'text-pink-600 dark:text-pink-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {isMyTurn
                    ? `Your turn — you are ${mySymbol}`
                    : "Opponent's turn..."}
                </p>
              )}
              {gameState.status === 'finished' && (
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {gameState.isDraw
                    ? '🤝 Draw!'
                    : gameState.winner === mySymbol
                      ? '🏆 You Win!'
                      : '💔 You Lost!'}
                </p>
              )}
            </div>

            {/* Board — always pass the safe 9-element board */}
            <Board
              board={currentBoard}
              onCellClick={handleCellClick}
              disabled={!isMyTurn || gameState.status !== 'active'}
              winningCells={gameState.winningCells || []}
            />

            {/* Play again */}
            {gameState.status === 'finished' && (
              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl transition hover:scale-[1.02]"
              >
                Play Again 💕
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
