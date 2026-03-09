import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users } from 'lucide-react';
import type { GameCard as GameCardType } from '@/types/shared.types';

interface GameCardProps {
  game: GameCardType;
}

const GAME_GRADIENTS: Record<string, string> = {
  tictactoe: 'from-blue-400 to-blue-600',
  wordscramble: 'from-purple-400 to-purple-600',
  memorymatch: 'from-cyan-400 to-cyan-600',
  trivia: 'from-indigo-400 to-indigo-600',
  connect4: 'from-red-400 to-yellow-500',
  rps: 'from-green-400 to-green-600',
  pictionary: 'from-pink-400 to-pink-600',
  mathduel: 'from-orange-400 to-orange-600',
};

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const navigate = useNavigate();
  const gradient = GAME_GRADIENTS[game.id] || 'from-gray-400 to-gray-600';

  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      onClick={() => navigate(game.route)}
    >
      {/* Thumbnail Section */}
      <div className={`relative aspect-video bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.5),transparent_50%)]" />
        </div>
        
        {/* Emoji Icon */}
        <div className="relative text-7xl transform group-hover:scale-110 transition-transform duration-300">
          {game.thumbnail}
        </div>

        {/* Quick Play Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <button className="px-6 py-3 bg-white text-gray-900 rounded-full font-bold flex items-center gap-2 shadow-lg hover:bg-gray-100 transition-colors">
              <Play className="w-5 h-5 fill-current" />
              Quick Play
            </button>
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-full shadow-md">
            Quick Game
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {game.title}
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {game.description}
        </p>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="font-medium">{game.players} Players</span>
          </div>
          
          <div className="text-purple-600 dark:text-purple-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            Play →
          </div>
        </div>
      </div>
    </div>
  );
};