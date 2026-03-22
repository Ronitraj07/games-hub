import React from 'react';

interface GameBoardProps {
  type: 'connect4' | 'tictactoe' | 'memorymatch';
  children: React.ReactNode;
}

/**
 * CONNECT4 BOARD VISUAL
 * 7×6 translucent grid with glass aesthetic
 */
export const Connect4Board: React.FC<{
  rows: (string | null)[][];
  onColumnClick: (col: number) => void;
}> = ({ rows, onColumnClick }) => {
  return (
    <div className="glass-lg p-6 rounded-3xl w-full max-w-2xl mx-auto">
      {/* Board Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          🔵 Connect 4 🔴
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Click columns to drop your piece</p>
      </div>

      {/* Game Board Grid */}
      <div className="grid gap-2 p-4 bg-gradient-to-b from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-300/30 dark:border-blue-400/20">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((col) => (
            <button
              key={`header-${col}`}
              onClick={() => onColumnClick(col)}
              className="text-2xl text-center text-pink-500 dark:text-pink-400 font-bold cursor-pointer hover:text-pink-600 transition hover:scale-110 active:scale-95"
            >
              ⬇️
            </button>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="grid grid-cols-7 gap-2">
            {row.map((cell, colIdx) => (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                className="aspect-square rounded-full glass-card flex items-center justify-center text-2xl font-bold cursor-pointer hover:scale-105 transition"
                style={{
                  animation: `slideInUp 0.4s ease-out ${(rowIdx + colIdx) * 0.05}s both`,
                }}
              >
                {cell === 'p1' && '🔴'}
                {cell === 'p2' && '🔵'}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Score Board */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="glass-sm p-4 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Player 1</p>
          <p className="text-3xl font-bold text-red-500">●</p>
        </div>
        <div className="glass-sm p-4 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Player 2</p>
          <p className="text-3xl font-bold text-blue-500">●</p>
        </div>
      </div>
    </div>
  );
};

/**
 * TICTACTOE BOARD VISUAL
 * 3×3 elegant glass grid
 */
export const TicTacToeBoard: React.FC<{
  board: (string | null)[];
  onCellClick: (idx: number) => void;
}> = ({ board, onCellClick }) => {
  return (
    <div className="glass-lg p-8 rounded-3xl w-full max-w-md mx-auto">
      {/* Board Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">
          Tic Tac Toe
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Make three in a row</p>
      </div>

      {/* Game Board Grid */}
      <div className="grid grid-cols-3 gap-3 p-6 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-rose-500/10 rounded-2xl border border-pink-300/30 dark:border-pink-400/20">
        {board.map((cell, idx) => (
          <button
            key={`cell-${idx}`}
            onClick={() => onCellClick(idx)}
            className="aspect-square glass-card rounded-2xl flex items-center justify-center text-4xl font-bold cursor-pointer relative overflow-hidden group hover:scale-105 active:scale-95 transition"
            style={{
              animation: `slideInDown 0.4s ease-out ${idx * 0.08}s both`,
            }}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition duration-300 rounded-2xl" />

            {/* Cell content */}
            <span className="relative z-10">
              {cell === 'X' && '✕'}
              {cell === 'O' && '○'}
            </span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-6 px-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✕</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Your Move</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">○</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Opponent</span>
        </div>
      </div>
    </div>
  );
};

/**
 * MEMORY MATCH BOARD VISUAL
 * Grid of flipping cards with glass effect
 */
export const MemoryBoard: React.FC<{
  cards: { revealed: boolean; emoji: string; matched: boolean }[];
  onCardClick: (idx: number) => void;
}> = ({ cards, onCardClick }) => {
  const gridCols = cards.length === 16 ? 'grid-cols-4' : 'grid-cols-6';

  return (
    <div className="glass-lg p-8 rounded-3xl w-full max-w-2xl mx-auto">
      {/* Board Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Memory Match
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Find matching pairs</p>
      </div>

      {/* Game Board Grid */}
      <div className={`grid ${gridCols} gap-3 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-300/30 dark:border-purple-400/20`}>
        {cards.map((card, idx) => (
          <button
            key={`card-${idx}`}
            onClick={() => onCardClick(idx)}
            className={`aspect-square glass-card rounded-2xl flex items-center justify-center text-4xl font-bold cursor-pointer hover:scale-108 active:scale-92 transition ${
              card.matched ? 'ring-2 ring-green-400' : ''
            }`}
            style={{
              animation: `slideInUp 0.4s ease-out ${idx * 0.05}s both`,
            }}
          >
            {(card.revealed || card.matched) ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Generic Board Container for any game
 */
export const GameBoard: React.FC<GameBoardProps> = ({ type, children }) => {
  const bgGradient = {
    connect4: 'from-blue-500/10 to-cyan-500/10',
    tictactoe: 'from-pink-500/10 to-rose-500/10',
    memorymatch: 'from-purple-500/10 to-indigo-500/10',
  };

  return (
    <div
      className={`glass-lg p-8 rounded-3xl w-full max-w-2xl mx-auto bg-gradient-to-br ${bgGradient[type]}`}
      style={{
        animation: 'slideInUp 0.5s ease-out',
      }}
    >
      {children}
    </div>
  );
};
