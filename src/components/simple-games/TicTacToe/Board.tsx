import React from 'react';
import { Cell } from './Cell';
import { BoardProps } from './types';

export const Board: React.FC<BoardProps> = ({ board, onCellClick, disabled, winningCells = [] }) => {
  const safeBoard = Array.isArray(board) ? board : Array(9).fill(null);

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 glass-card w-full max-w-[min(100%,340px)]" role="grid" aria-label="Tic Tac Toe game board">
        {safeBoard.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => onCellClick(index)}
            disabled={disabled || cell !== null}
            winning={winningCells.includes(index)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};
