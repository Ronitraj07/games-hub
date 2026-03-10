import React from 'react';

interface CellProps {
  value: string | null;
  onClick: () => void;
  disabled: boolean;
  winning: boolean;
}

export const Cell: React.FC<CellProps> = ({ value, onClick, disabled, winning }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`aspect-square rounded-2xl text-3xl font-bold transition-all duration-200 flex items-center justify-center
      ${ winning
        ? 'bg-gradient-to-br from-pink-400 to-purple-500 text-white scale-105 shadow-lg shadow-pink-200/60 dark:shadow-pink-900/40'
        : value
        ? 'glass text-gray-900 dark:text-white'
        : 'glass hover:bg-white/60 dark:hover:bg-white/10 hover:scale-105 cursor-pointer'
      } disabled:cursor-not-allowed`}
  >
    {value === 'X' || value?.includes('@') ? (
      <span className={winning ? 'text-white' : 'bg-gradient-to-br from-pink-500 to-rose-500 bg-clip-text text-transparent'}>✕</span>
    ) : value ? (
      <span className={winning ? 'text-white' : 'bg-gradient-to-br from-purple-500 to-indigo-500 bg-clip-text text-transparent'}>○</span>
    ) : null}
  </button>
);
