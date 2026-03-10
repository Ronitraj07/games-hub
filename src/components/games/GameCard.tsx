import React from 'react';
import { Clock, Users, Zap } from 'lucide-react';

interface GameCardProps {
  name: string;
  description: string;
  icon: string;
  difficulty: string;
  players: '1' | '2' | '1-2' | '2-4';
  estimatedTime: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400',
  Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  Hard:   'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
};

export const GameCard: React.FC<GameCardProps> = ({ name, description, icon, difficulty, players, estimatedTime }) => (
  <div className="glass-card p-5 h-full flex flex-col group cursor-pointer">
    {/* Icon */}
    <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
      {icon}
    </div>

    {/* Content */}
    <div className="flex-1">
      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{name}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{description}</p>
    </div>

    {/* Footer tags */}
    <div className="flex items-center gap-2 flex-wrap mt-auto">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium}`}>
        <Zap size={10} className="inline mr-1" />{difficulty}
      </span>
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center gap-1">
        <Users size={10} />{players}P
      </span>
      <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
        <Clock size={10} />{estimatedTime}
      </span>
    </div>
  </div>
);
