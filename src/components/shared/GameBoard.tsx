import React, { useCallback } from 'react';

export interface GameBoardCell {
  id: string;
  row: number;
  col: number;
  content?: React.ReactNode;
  type?: 'normal' | 'multiplier2x' | 'multiplier3x' | 'multiplierWord2x' | 'multiplierWord3x';
  isHighlighted?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}

export interface GameBoardProps {
  rows: number;
  cols: number;
  cells: GameBoardCell[][];
  cellSize?: number;
  showGridLines?: boolean;
  className?: string;
}

const getCellTypeColor = (type?: string): string => {
  switch (type) {
    case 'multiplier2x':
      return 'bg-blue-200 dark:bg-blue-900/40 border-blue-400/50';
    case 'multiplier3x':
      return 'bg-red-200 dark:bg-red-900/40 border-red-400/50';
    case 'multiplierWord2x':
      return 'bg-cyan-200 dark:bg-cyan-900/40 border-cyan-400/50';
    case 'multiplierWord3x':
      return 'bg-purple-300 dark:bg-purple-900/40 border-purple-400/50';
    default:
      return 'bg-white/60 dark:bg-gray-800/60 border-gray-300/30 dark:border-gray-600/30';
  }
};

const getCellTypeLabel = (type?: string): string => {
  switch (type) {
    case 'multiplier2x':
      return '2x';
    case 'multiplier3x':
      return '3x';
    case 'multiplierWord2x':
      return 'W2';
    case 'multiplierWord3x':
      return 'W3';
    default:
      return '';
  }
};

export const GameBoard: React.FC<GameBoardProps> = ({
  rows,
  cols,
  cells,
  cellSize = 40,
  showGridLines = true,
  className = '',
}) => {
  const handleCellClick = useCallback((cell: GameBoardCell) => {
    if (cell.isClickable && cell.onClick) {
      cell.onClick();
    }
  }, []);

  return (
    <div
      className={`inline-block rounded-xl overflow-hidden shadow-xl ${className}`}
      style={{
        border: '2px solid rgba(100, 100, 100, 0.3)',
      }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: showGridLines ? '1px' : '0px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: showGridLines ? '1px' : '0px',
        }}>
        {cells.map((row) =>
          row.map((cell) => (
            <div
              key={cell.id}
              onClick={() => handleCellClick(cell)}
              className={`flex items-center justify-center text-center transition-all duration-200 relative group border border-gray-400/40 dark:border-gray-600/40 ${getCellTypeColor(
                cell.type
              )} ${
                cell.isHighlighted
                  ? 'ring-2 ring-pink-500 shadow-lg shadow-pink-500/50 scale-110 z-10'
                  : 'hover:ring-2 hover:ring-pink-300 hover:shadow-md'
              } ${cell.isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
              style={{
                width: cellSize,
                height: cellSize,
                fontSize: cellSize > 40 ? '14px' : '12px',
                fontWeight: 'bold',
                userSelect: 'none',
              }}>
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded pointer-events-none" />

              {/* Multiplier label */}
              {cell.type && !cell.content && (
                <span className="text-xs opacity-60 font-semibold relative z-10">
                  {getCellTypeLabel(cell.type)}
                </span>
              )}

              {/* Cell content */}
              {cell.content && (
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  {cell.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
