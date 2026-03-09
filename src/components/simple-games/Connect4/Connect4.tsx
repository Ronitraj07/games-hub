import React, { useState } from 'react';
import { useRealtimeGame } from '@/hooks/firebase/useRealtimeGame';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Circle, RotateCcw } from 'lucide-react';

interface Connect4GameState {
  board: (string | null)[][];
  currentPlayer: string;
  players: { player1: string; player2: string | null; };
  winner: string | null;
  winningCells: number[][] | null;
  status: 'waiting' | 'active' | 'finished';
  isDraw: boolean;
}

interface Connect4Props {
  sessionId?: string;
}

const ROWS = 6;
const COLS = 7;

const createEmptyBoard = (): (string | null)[][] => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
};

const checkWinner = (board: (string | null)[][], row: number, col: number, player: string): number[][] | null => {
  for (let c = 0; c <= COLS - 4; c++) {
    if (board[row][c] === player && board[row][c + 1] === player && board[row][c + 2] === player && board[row][c + 3] === player) {
      return [[row, c], [row, c + 1], [row, c + 2], [row, c + 3]];
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    if (board[r][col] === player && board[r + 1][col] === player && board[r + 2][col] === player && board[r + 3][col] === player) {
      return [[r, col], [r + 1, col], [r + 2, col], [r + 3, col]];
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === player && board[r + 1][c + 1] === player && board[r + 2][c + 2] === player && board[r + 3][c + 3] === player) {
        return [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]];
      }
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      if (board[r][c] === player && board[r + 1][c - 1] === player && board[r + 2][c - 2] === player && board[r + 3][c - 3] === player) {
        return [[r, c], [r + 1, c - 1], [r + 2, c - 2], [r + 3, c - 3]];
      }
    }
  }
  return null;
};

const isBoardFull = (board: (string | null)[][]): boolean => board[0].every(cell => cell !== null);

export const Connect4: React.FC<Connect4Props> = ({ sessionId }) => {
  const { user } = useAuth();
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const initialState: Connect4GameState = {
    board: createEmptyBoard(),
    currentPlayer: user?.email || '',
    players: { player1: user?.email || '', player2: null },
    winner: null,
    winningCells: null,
    status: 'waiting',
    isDraw: false
  };

  const { gameState, updateGameState, loading, error } = useRealtimeGame<Connect4GameState>(sessionId || 'connect4-game', 'connect4', initialState);

  const handleColumnClick = (col: number) => {
    if (!gameState || gameState.status !== 'active' || gameState.currentPlayer !== user?.email) return;

    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (gameState.board[r][col] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) return;

    const newBoard = gameState.board.map(r => [...r]);
    newBoard[row][col] = user?.email || '';

    const winningCells = checkWinner(newBoard, row, col, user?.email || '');
    const boardFull = isBoardFull(newBoard);

    if (winningCells) {
      updateGameState({ ...gameState, board: newBoard, winner: user?.email || '', winningCells, status: 'finished' });
    } else if (boardFull) {
      updateGameState({ ...gameState, board: newBoard, isDraw: true, status: 'finished' });
    } else {
      const nextPlayer = gameState.currentPlayer === gameState.players.player1 ? gameState.players.player2 : gameState.players.player1;
      updateGameState({ ...gameState, board: newBoard, currentPlayer: nextPlayer || '' });
    }
  };

  const startGame = () => updateGameState({ ...initialState, players: { player1: user?.email || '', player2: 'opponent@example.com' }, status: 'active' });
  const resetGame = () => updateGameState(initialState);
  const isWinningCell = (row: number, col: number): boolean => gameState?.winningCells?.some(([r, c]) => r === row && c === col) || false;

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><div className="text-red-600 dark:text-red-400 text-center"><p className="text-xl font-bold">Error loading game</p><p className="text-sm mt-2">{error}</p></div></div>;
  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayer === user?.email;
  const myColor = gameState.players.player1 === user?.email ? 'bg-red-500' : 'bg-yellow-500';
  const opponentColor = gameState.players.player1 === user?.email ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4"><Circle className="w-8 h-8 text-white" /></div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Connect 4</h1>
          <p className="text-gray-600 dark:text-gray-400">Connect four discs in a row to win!</p>
        </div>

        {gameState.status === 'waiting' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-400">How to Play:</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Take turns dropping discs into columns</li>
                <li>• Discs fall to the lowest available space</li>
                <li>• Connect 4 discs horizontally, vertically, or diagonally to win</li>
                <li>• Red vs Yellow - may the best strategist win!</li>
              </ul>
            </div>
            <button onClick={startGame} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors">Start Game</button>
          </div>
        )}

        {gameState.status === 'active' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{isMyTurn ? "Your Turn!" : "Opponent's Turn..."}</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full ${myColor}`} /><span className="text-sm text-gray-700 dark:text-gray-300">You</span></div>
                <div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full ${opponentColor}`} /><span className="text-sm text-gray-700 dark:text-gray-300">Opponent</span></div>
              </div>
            </div>

            <div className="inline-block bg-blue-700 p-4 rounded-xl shadow-2xl">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {gameState.board.map((row, rowIdx) => row.map((cell, colIdx) => {
                  const isWinning = isWinningCell(rowIdx, colIdx);
                  return <button key={`${rowIdx}-${colIdx}`} onClick={() => handleColumnClick(colIdx)} onMouseEnter={() => setHoveredCol(colIdx)} onMouseLeave={() => setHoveredCol(null)} disabled={!isMyTurn || rowIdx !== ROWS - 1} className={`w-12 h-12 md:w-16 md:h-16 rounded-full transition-all ${cell === null ? 'bg-white dark:bg-gray-800' : cell === gameState.players.player1 ? 'bg-red-500' : 'bg-yellow-500'} ${isWinning ? 'ring-4 ring-green-400 animate-pulse' : ''} ${hoveredCol === colIdx && cell === null && isMyTurn && rowIdx === ROWS - 1 ? 'scale-110 cursor-pointer' : ''}`} />;
                }))}
              </div>
            </div>
          </div>
        )}

        {gameState.status === 'finished' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4">{gameState.isDraw ? '🤝' : gameState.winner === user?.email ? '🏆' : '😢'}</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{gameState.isDraw ? "It's a Draw!" : gameState.winner === user?.email ? 'You Won!' : 'You Lost!'}</h2>
            <button onClick={resetGame} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" />Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
};