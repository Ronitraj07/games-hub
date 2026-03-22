import React from 'react';
import type { SeriesFormat } from './types';

interface SeriesTrackerProps {
  seriesFormat: SeriesFormat;
  currentRound: number;
  player1Name: string;
  player1Score: number;
  player2Name: string;
  player2Score: number;
  difficulty: string;
}

export const SeriesTracker: React.FC<SeriesTrackerProps> = ({
  seriesFormat,
  currentRound,
  player1Name,
  player1Score,
  player2Name,
  player2Score,
  difficulty,
}) => {
  const totalRounds = {
    'best-of-1': 1,
    'best-of-3': 3,
    'best-of-5': 5,
  }[seriesFormat];

  const roundIndicators = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Series info */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {seriesFormat.replace('best-of-', 'Best of ')} · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">Round {currentRound} of {totalRounds}</span>
      </div>

      {/* Score display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{player1Name}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{player1Score}</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{player2Name}</p>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{player2Score}</p>
        </div>
      </div>

      {/* Round indicators */}
      <div className="flex justify-center gap-2">
        {roundIndicators.map((round) => (
          <div
            key={round}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
              round < currentRound
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                : round === currentRound
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white ring-2 ring-offset-1 ring-offset-transparent'
                  : 'glass text-gray-600 dark:text-gray-400'
            }`}
          >
            {round}
          </div>
        ))}
      </div>
    </div>
  );
};
