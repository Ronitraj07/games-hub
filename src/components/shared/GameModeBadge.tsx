import React from 'react';
import type { AIDifficulty, GameMode } from './GameLobby';

interface GameModeBadgeProps {
  mode: GameMode;
  difficulty?: AIDifficulty;
  className?: string;
}

const MODE_CONFIG = {
  solo: {
    icon: '🎮',
    label: 'Solo',
    style: 'text-gray-600 dark:text-gray-400',
  },
  'vs-ai': {
    icon: '🤖',
    label: 'vs AI',
    style: 'text-indigo-600 dark:text-indigo-400',
  },
  'vs-partner': {
    icon: '👥',
    label: 'vs Partner',
    style: 'text-pink-600 dark:text-pink-400',
  },
} satisfies Record<GameMode, { icon: string; label: string; style: string }>;

const DIFFICULTY_DOT: Record<AIDifficulty, string> = {
  easy:   'bg-green-400',
  medium: 'bg-yellow-400',
  hard:   'bg-red-400',
};

export const GameModeBadge: React.FC<GameModeBadgeProps> = ({
  mode,
  difficulty,
  className = '',
}) => {
  const cfg = MODE_CONFIG[mode];

  return (
    <span
      className={`inline-flex items-center gap-1.5 glass px-3 py-1 rounded-full text-xs font-semibold ${cfg.style} ${className}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
      {mode === 'vs-ai' && difficulty && (
        <>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span
            className={`w-2 h-2 rounded-full inline-block ${DIFFICULTY_DOT[difficulty]}`}
            title={difficulty}
          />
          <span className="capitalize">{difficulty}</span>
        </>
      )}
    </span>
  );
};
