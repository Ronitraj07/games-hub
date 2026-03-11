import React from 'react';
import { CellValue } from './types';

interface CellProps {
  value: CellValue;
  onClick: () => void;
  disabled: boolean;
  winning: boolean;
}

export const Cell: React.FC<CellProps> = ({ value, onClick, disabled, winning }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`aspect-square w-full flex items-center justify-center text-4xl font-bold rounded-xl transition-all duration-150
      ${
        winning
          ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white scale-105 shadow-lg'
          : value
          ? 'glass cursor-default'
          : 'glass hover:bg-pink-50/20 active:scale-95 cursor-pointer'
      }
      disabled:cursor-default
    `}
  >
    {value === 'X' ? '❌' : value === 'O' ? '⭕' : ''}
  </button>
);
