import React from 'react';
import { Trophy, Medal, Crown, Repeat2 } from 'lucide-react';

interface SeriesFinalProps {
  player1Name: string;
  player1Score: number;
  player2Name: string;
  player2Score: number;
  onPlayAgain: () => void;
  onBack: () => void;
}

export const SeriesFinal: React.FC<SeriesFinalProps> = ({
  player1Name,
  player1Score,
  player2Name,
  player2Score,
  onPlayAgain,
  onBack,
}) => {
  const winner = player1Score > player2Score ? player1Name : player2Score > player1Score ? player2Name : null;
  const isDraw = player1Score === player2Score;

  return (
    <div className="glass-card p-8 space-y-6 text-center">
      {/* Header emoji */}
      <div className="text-7xl">
        {isDraw ? '🤝' : '👑'}
      </div>

      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isDraw ? "It's a Draw!" : `${winner} Wins!`}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Series complete</p>
      </div>

      {/* Final scores */}
      <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-700">
        <div
          className={`p-6 rounded-2xl transition ${
            player1Score > player2Score
              ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400'
              : isDraw
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400'
                : 'glass'
          }`}
        >
          {player1Score > player2Score && (
            <div className="flex justify-center mb-2">
              <Crown size={24} className="text-yellow-500" />
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{player1Name}</p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{player1Score}</p>
          <p className="text-xs text-gray-500 mt-2">points</p>
        </div>

        <div
          className={`p-6 rounded-2xl transition ${
            player2Score > player1Score
              ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-400'
              : isDraw
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400'
                : 'glass'
          }`}
        >
          {player2Score > player1Score && (
            <div className="flex justify-center mb-2">
              <Crown size={24} className="text-yellow-500" />
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{player2Name}</p>
          <p className="text-4xl font-bold text-pink-600 dark:text-pink-400">{player2Score}</p>
          <p className="text-xs text-gray-500 mt-2">points</p>
        </div>
      </div>

      {/* Achievement badge */}
      {!isDraw && (
        <div className="glass p-4 rounded-xl flex items-center justify-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {player1Score - player2Score > 50 || player2Score - player1Score > 50
              ? 'Dominant Victory!'
              : 'Skillful Win!'}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onPlayAgain}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold px-6 py-3 rounded-xl transition hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Repeat2 size={18} /> Play Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 glass-btn text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl transition"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
};
