import React, { useEffect, useState } from 'react';
import { Board } from './Board';
import { TicTacToeProps, TicTacToeGameState, Player, BoardState } from './types';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/hooks/shared/useAuth';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
];

const checkWinner = (board: BoardState): { winner: Player | 'draw' | null; winningCells: number[] } => {
  // Check for winner
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, winningCells: combo };
    }
  }
  
  // Check for draw
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', winningCells: [] };
  }
  
  return { winner: null, winningCells: [] };
};

export const TicTacToe: React.FC<TicTacToeProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [winningCells, setWinningCells] = useState<number[]>([]);
  
  const initialState: TicTacToeGameState = {
    board: Array(9).fill(null),
    currentTurn: 'X',
    winner: null,
    status: 'active'
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<TicTacToeGameState>(
    sessionId || 'tictactoe-game',
    'tictactoe',
    initialState
  );

  useEffect(() => {
    if (gameState) {
      const { winner, winningCells: cells } = checkWinner(gameState.board);
      if (winner && gameState.winner !== winner) {
        setWinningCells(cells);
        updateGameState({
          ...gameState,
          winner,
          status: 'finished'
        });
      }
    }
  }, [gameState?.board]);

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.winner || gameState.board[index]) return;

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentTurn;
    
    updateGameState({
      ...gameState,
      board: newBoard,
      currentTurn: gameState.currentTurn === 'X' ? 'O' : 'X'
    });
  };

  const handleReset = () => {
    setWinningCells([]);
    updateGameState(initialState);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="text-xl font-bold">Error loading game</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 dark:bg-gray-950">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Tic Tac Toe</h1>
        <p className="text-gray-600 dark:text-gray-400">Classic game for two players</p>
      </div>

      <div className="mb-6 text-center">
        {gameState.winner ? (
          <div className="space-y-2">
            {gameState.winner === 'draw' ? (
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">It's a Draw! 🤝</p>
            ) : (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Player {gameState.winner} Wins! 🎉
              </p>
            )}
          </div>
        ) : (
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Current Turn: <span className={gameState.currentTurn === 'X' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
              {gameState.currentTurn}
            </span>
          </p>
        )}
      </div>

      <Board
        board={gameState.board}
        onCellClick={handleCellClick}
        disabled={gameState.status === 'finished'}
        winningCells={winningCells}
      />

      <button
        onClick={handleReset}
        className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
      >
        New Game
      </button>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Playing as: {user?.email}</p>
      </div>
    </div>
  );
};