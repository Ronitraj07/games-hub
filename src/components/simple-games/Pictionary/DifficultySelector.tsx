import React from 'react';
import type { Difficulty, SeriesFormat } from './types';
import { Star, Zap, Flame } from 'lucide-react';

interface DifficultySelectorProps {
  seriesFormat: SeriesFormat;
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ seriesFormat, onSelect }) => {
  const roundCount = {
    'best-of-1': 1,
    'best-of-3': 3,
    'best-of-5': 5,
  }[seriesFormat];

  const difficulties: Array<{ id: Difficulty; label: string; desc: string; icon: React.ReactNode; color: string }> = [
    {
      id: 'easy',
      label: 'Easy',
      desc: 'Simple, recognizable objects and animals',
      icon: <Star size={20} />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'normal',
      label: 'Normal',
      desc: 'Classic Pictionary words - balanced challenge',
      icon: <Zap size={20} />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'hard',
      label: 'Hard',
      desc: 'Abstract concepts and complex ideas - expert level',
      icon: <Flame size={20} />,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Choose Difficulty</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {roundCount} round{roundCount !== 1 ? 's' : ''} of artistic skill
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {difficulties.map(({ id, label, desc, icon, color }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`glass-card p-6 text-center hover:scale-105 transition duration-300 cursor-pointer group`}
          >
            <div className={`bg-gradient-to-br ${color} p-4 rounded-2xl w-fit mx-auto mb-4 text-white group-hover:shadow-lg transition`}>
              {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{label}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>

      <div className="glass-card p-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        💡 Tip: Both players earn points when the guesser is correct. Role rotation keeps the game fair!
      </div>
    </div>
  );
};
