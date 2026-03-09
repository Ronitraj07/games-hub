import React from 'react';
import { GameCard } from '@/components/shared/GameCard';
import { useAuth } from '@/contexts/AuthContext';
import type { GameCard as GameCardType } from '@/types/shared.types';

const GAMES: GameCardType[] = [
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    description: 'Classic 3x3 grid game',
    category: 'simple',
    players: '2',
    thumbnail: '❌⭕',
    route: '/games/tictactoe',
  },
  // More games to be added
];

export const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.displayName}! 🎮
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a game to play together
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
};