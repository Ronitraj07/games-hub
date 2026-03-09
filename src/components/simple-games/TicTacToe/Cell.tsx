import React from 'react';
import { CellProps } from './types';

export const Cell: React.FC<CellProps> = ({ value, onClick, disabled, winning }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28
        border-2 border-gray-300 dark:border-gray-600
        rounded-lg
        flex items-center justify-center
        text-4xl sm:text-5xl md:text-6xl font-bold
        transition-all duration-200
        hover:bg-gray-50 dark:hover:bg-gray-800
        disabled:cursor-not-allowed
        ${winning ? 'bg-green-100 dark:bg-green-900 border-green-500' : ''}
        ${value === 'X' ? 'text-blue-600 dark:text-blue-400' : ''}
        ${value === 'O' ? 'text-red-600 dark:text-red-400' : ''}
        ${!value && !disabled ? 'hover:scale-105' : ''}
      `}
    >
      {value}
    </button>
  );
};