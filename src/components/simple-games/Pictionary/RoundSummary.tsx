import React from 'react';
import type { RoundResult } from './types';
import { Trophy, Clock, Target } from 'lucide-react';

interface RoundSummaryProps {
  round: RoundResult;
  player1Name: string;
  player2Name: string;
  player1SeriesScore: number;
  player2SeriesScore: number;
  isLastRound: boolean;
  onContinue: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  round,
  player1Name,
  player2Name,
  player1SeriesScore,
  player2SeriesScore,
  isLastRound,
  onContinue,
}) => {
  const isDrawer1 = round.drawer === player1Name;
  const drawerName = isDrawer1 ? player1Name : player2Name;
  const guesserName = isDrawer1 ? player2Name : player1Name;

  return (
    <div className="glass-card p-8 space-y-6 text-center">
      {/* Emoji header */}
      <div className="text-6xl">
        {round.result === 'correct' ? '🎉' : '⏰'}
      </div>

      {/* Result text */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {round.result === 'correct' ? 'Correct!' : "Time's Up!"}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          The word was: <strong className="text-pink-600 dark:text-pink-400">{round.word}</strong>
        </p>
      </div>

      {/* Round scores */}
      <div className="space-y-3 py-4 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{drawerName} (drew)</span>
            <Target size={16} className="text-orange-500" />
          </div>
          <span className="font-bold text-xl text-orange-600 dark:text-orange-400">+{round.drawerScore} pts</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{guesserName} (guessed)</span>
            {round.result === 'correct' && <Clock size={16} className="text-green-500" />}
          </div>
          <span className="font-bold text-xl text-green-600 dark:text-green-400">+{round.guesserScore} pts</span>
        </div>
      </div>

      {/* Series scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Series Score</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{player1SeriesScore}</p>
          <p className="text-xs text-gray-500 mt-1">{player1Name}</p>
        </div>
        <div className="p-3 bg-pink-500/10 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Series Score</p>
          <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{player2SeriesScore}</p>
          <p className="text-xs text-gray-500 mt-1">{player2Name}</p>
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-3 rounded-xl transition hover:shadow-lg"
      >
        {isLastRound ? 'View Results' : 'Next Round'}
      </button>
    </div>
  );
};
