import React, { useEffect, useState } from 'react';
import { Board } from './Board';
import { TicTacToeProps, TicTacToeGameState, Player, BoardState } from './types';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Celebration } from '@/components/shared/Celebration';
import { playClick, playWin, playLoss, playDraw } from '@/utils/sounds';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const checkWinner = (board: BoardState): { winner: Player | 'draw' | null; winningCells: number[] } => {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, winningCells: combo };
    }
  }
  
  if (board.every(cell => cell !== null)) {
    return { winner: 'draw', winningCells: [] };
  }
  
  return { winner: null, winningCells: [] };
};

export const TicTacToe: React.FC<TicTacToeProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userPlayer, setUserPlayer] = useState<Player | null>(null);
  
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
    if (user && !userPlayer) {
      setUserPlayer('X');
    }
  }, [user, userPlayer]);

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

        if (winner === 'draw') {
          playDraw();
        } else if (winner === userPlayer) {
          playWin();
          setShowCelebration(true);
        } else {
          playLoss();
        }
      }
    }
  }, [gameState?.board, userPlayer]);

  const handleCellClick = (index: number) => {
    if (!gameState || gameState.winner || gameState.board[index]) return;

    playClick();

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentTurn;
    
    updateGameState({
      ...gameState,
      board: newBoard,
      currentTurn: gameState.currentTurn === 'X' ? 'O' : 'X'
    });
  };

  const handleReset = () => {
    playClick();
    setWinningCells([]);
    setShowCelebration(false);
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

  const isWinner = gameState.winner && gameState.winner === userPlayer;
  const isDraw = gameState.winner === 'draw';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {isWinner && (
        <Celebration
          show={showCelebration}
          type="win"
          message="Victory! 🎉"
          onComplete={() => setShowCelebration(false)}
        />
      )}

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Tic Tac Toe</h1>
        <p className="text-gray-600 dark:text-gray-400">Classic game for two players</p>
      </div>

      <div className="mb-6 text-center">
        {gameState.winner ? (
          <div className="space-y-2">
            {isDraw ? (
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">It's a Draw! 🤝</p>
            ) : isWinner ? (
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                You Win! 🎉
              </p>
            ) : (
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                You Lose! 😢
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Current Turn: <span className={gameState.currentTurn === 'X' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                {gameState.currentTurn}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You are: <span className="font-bold">{userPlayer}</span>
            </p>
          </div>
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
        className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        New Game
      </button>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Playing as: {user?.email}</p>
        <p className="mt-1 text-xs">Session: {sessionId || 'default'}</p>
      </div>
    </div>
  );
};