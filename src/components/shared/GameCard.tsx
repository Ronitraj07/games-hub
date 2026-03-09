import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameCard as GameCardType } from '@/types/shared.types';

interface GameCardProps {
  game: GameCardType;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const navigate = useNavigate();

  const categoryColors = {
    simple: 'bg-blue-500',
    heavy: 'bg-purple-500',
  };

  return (
    <div
      onClick={() => navigate(game.route)}
      className="group cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg hover:scale-105"
    >
      <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
        <div className="text-6xl">{game.thumbnail}</div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {game.title}
          </h3>
          <span
            className={`px-2 py-1 text-xs font-medium text-white rounded ${categoryColors[game.category]}`}
          >
            {game.category === 'simple' ? 'Quick' : 'RPG'}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {game.description}
        </p>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
          <span>👥 {game.players} Players</span>
        </div>
      </div>
    </div>
  );
};