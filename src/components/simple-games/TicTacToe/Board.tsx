import React from 'react';
import { Cell } from './Cell';
import { BoardProps } from './types';

export const Board: React.FC<BoardProps> = ({ board, onCellClick, disabled, winningCells = [] }) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      {board.map((cell, index) => (
        <Cell
          key={index}
          value={cell}
          onClick={() => onCellClick(index)}
          disabled={disabled || cell !== null}
          winning={winningCells.includes(index)}
        />
      ))}
    </div>
  );
};