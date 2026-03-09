import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { useGameHistory } from '@/hooks/supabase/useGameHistory';
import { GameCard } from '@/components/games/GameCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Trophy, Clock, Target, Swords } from 'lucide-react';

const SIMPLE_GAMES = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    description: 'Classic 3x3 grid game',
    icon: '❌⭕',
    route: '/games/tictactoe',
    difficulty: 'Easy',
    players: '2' as const,
    estimatedTime: '2-5 min'
  },
  {
    id: 'wordscramble',
    name: 'Word Scramble',
    description: 'Unscramble words against time',
    icon: '🔤',
    route: '/games/wordscramble',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '5-10 min'
  },
  {
    id: 'memorymatch',
    name: 'Memory Match',
    description: 'Find matching pairs',
    icon: '🃏',
    route: '/games/memorymatch',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '5-10 min'
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    description: 'Connect four in a row',
    icon: '🔴🔵',
    route: '/games/connect4',
    difficulty: 'Medium',
    players: '2' as const,
    estimatedTime: '5-10 min'
  },
  {
    id: 'triviaquiz',
    name: 'Trivia Quiz',
    description: 'Test your knowledge',
    icon: '❓',
    route: '/games/triviaquiz',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '10-15 min'
  },
  {
    id: 'rockpaperscissors',
    name: 'Rock Paper Scissors',
    description: 'Best of 5 rounds',
    icon: '✊✋✌️',
    route: '/games/rockpaperscissors',
    difficulty: 'Easy',
    players: '2' as const,
    estimatedTime: '2-5 min'
  },
  {
    id: 'pictionary',
    name: 'Pictionary',
    description: 'Draw and guess',
    icon: '🎨',
    route: '/games/pictionary',
    difficulty: 'Hard',
    players: '2' as const,
    estimatedTime: '10-15 min'
  },
  {
    id: 'mathduel',
    name: 'Math Duel',
    description: 'Quick math challenges',
    icon: '🧮',
    route: '/games/mathduel',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '5-10 min'
  }
];

const HEAVY_GAMES = [
  {
    id: 'battlearena',
    name: 'Battle Arena',
    description: 'Turn-based combat RPG',
    icon: '⚔️',
    route: '/games/rpg',
    difficulty: 'Hard',
    players: '1' as const,
    estimatedTime: '30+ min'
  },
  {
    id: 'dungeoncrawlers',
    name: 'Dungeon Crawlers',
    description: 'Explore dungeons and fight monsters',
    icon: '🏯',
    route: '/games/rpg',
    difficulty: 'Hard',
    players: '1' as const,
    estimatedTime: '30+ min'
  }
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePlayerStats();
  const { history, loading: historyLoading } = useGameHistory();
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const filteredGames = SIMPLE_GAMES.filter(game => 
    filter === 'all' || game.difficulty.toLowerCase() === filter
  );

  const totalGames = stats.totalGames;
  const winRate = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.displayName}! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Choose a game to play with your partner</p>
        </div>

        {!statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalGames}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{winRate}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Swords className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Wins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.wins}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Favorite</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.favoriteGame}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Simple Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {filteredGames.map((game) => (
              <Link key={game.id} to={game.route}>
                <GameCard {...game} />
              </Link>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">RPG Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HEAVY_GAMES.map((game) => (
              <Link key={game.id} to={game.route}>
                <GameCard {...game} />
              </Link>
            ))}
          </div>
        </div>

        {!historyLoading && history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Recent Games</h2>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {history.slice(0, 5).map((game) => (
                  <div key={game.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{game.game_type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          vs {game.player_2_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          game.winner_email === user?.email
                            ? 'text-green-600 dark:text-green-400'
                            : game.winner_email === null
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {game.winner_email === user?.email ? 'Won' : game.winner_email === null ? 'Draw' : 'Lost'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(game.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};