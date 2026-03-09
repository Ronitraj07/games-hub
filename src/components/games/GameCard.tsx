import React from 'react';
import { Clock, Users, TrendingUp } from 'lucide-react';

interface GameCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  difficulty: string;
  players: '1' | '2' | '1-2';
  estimatedTime: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  name,
  description,
  icon,
  difficulty,
  players,
  estimatedTime
}) => {
  const difficultyColor = {
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }[difficulty] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 p-6 cursor-pointer hover:scale-105">
      <div className="text-5xl mb-4 text-center">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{name}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{players} Player{players === '1' ? '' : 's'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{estimatedTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyColor}`}>
            {difficulty}
          </span>
        </div>
      </div>
    </div>
  );
};
