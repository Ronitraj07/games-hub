import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { useGameHistory } from '@/hooks/supabase/useGameHistory';
import { GameCard } from '@/components/games/GameCard';
import { Trophy, Clock, Target, Swords, Sparkles } from 'lucide-react';

const SIMPLE_GAMES = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    description: 'Classic 3×3 grid battle',
    icon: '💗',
    gradient:  'from-rose-400 to-pink-500',
    glowColor: 'shadow-rose-300/60 dark:shadow-rose-500/40',
    route: '/games/tictactoe',
    difficulty: 'Easy',
    players: '2' as const,
    estimatedTime: '2-5 min',
  },
  {
    id: 'wordscramble',
    name: 'Word Scramble',
    description: 'Unscramble words vs the clock',
    icon: '🔮',
    gradient:  'from-violet-400 to-purple-600',
    glowColor: 'shadow-violet-300/60 dark:shadow-violet-500/40',
    route: '/games/wordscramble',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '5-10 min',
  },
  {
    id: 'memorymatch',
    name: 'Memory Match',
    description: 'Find matching pairs together',
    icon: '🌸',
    gradient:  'from-pink-400 to-fuchsia-500',
    glowColor: 'shadow-pink-300/60 dark:shadow-pink-500/40',
    route: '/games/memorymatch',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '5-10 min',
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    description: 'Connect four in a row',
    icon: '💎',
    gradient:  'from-sky-400 to-blue-600',
    glowColor: 'shadow-sky-300/60 dark:shadow-sky-500/40',
    route: '/games/connect4',
    difficulty: 'Medium',
    players: '2' as const,
    estimatedTime: '5-10 min',
  },
  {
    id: 'triviaquiz',
    name: 'Trivia Quiz',
    description: 'Test your love knowledge',
    icon: '✨',
    gradient:  'from-amber-400 to-rose-500',
    glowColor: 'shadow-amber-300/60 dark:shadow-amber-500/40',
    route: '/games/triviaquiz',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '10-15 min',
  },
  {
    id: 'rockpaperscissors',
    name: 'Rock Paper Scissors',
    description: 'Best of 5 rounds',
    icon: '🫧',
    gradient:  'from-teal-400 to-cyan-500',
    glowColor: 'shadow-teal-300/60 dark:shadow-teal-500/40',
    route: '/games/rockpaperscissors',
    difficulty: 'Easy',
    players: '2' as const,
    estimatedTime: '2-5 min',
  },
  {
    id: 'pictionary',
    name: 'Pictionary',
    description: 'Draw and guess the word',
    icon: '🎴',
    gradient:  'from-orange-400 to-rose-500',
    glowColor: 'shadow-orange-300/60 dark:shadow-orange-500/40',
    route: '/games/pictionary',
    difficulty: 'Hard',
    players: '2' as const,
    estimatedTime: '10-15 min',
  },
  {
    id: 'mathduel',
    name: 'Math Duel',
    description: 'Quick-fire math challenges',
    icon: '⚡',
    gradient:  'from-lime-400 to-emerald-500',
    glowColor: 'shadow-lime-300/60 dark:shadow-emerald-500/40',
    route: '/games/mathduel',
    difficulty: 'Medium',
    players: '1-2' as const,
    estimatedTime: '5-10 min',
  },
];

const STAT_CARDS = [
  { icon: Trophy,  color: 'text-yellow-500', label: 'Total Games', key: 'totalGames'   as const },
  { icon: Target,  color: 'text-pink-500',   label: 'Win Rate',    key: 'winRate'      as const },
  { icon: Swords,  color: 'text-purple-500', label: 'Wins',        key: 'wins'         as const },
  { icon: Clock,   color: 'text-rose-400',   label: 'Favourite',   key: 'favoriteGame' as const },
];

export const Home: React.FC = () => {
  const { user }                              = useAuth();
  const { stats, loading: statsLoading }     = usePlayerStats();
  const { history, loading: historyLoading } = useGameHistory();
  const [filter, setFilter]                  = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const filteredGames = SIMPLE_GAMES.filter(g => filter === 'all' || g.difficulty.toLowerCase() === filter);
  const totalGames    = stats.totalGames;
  const winRate       = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : '0.0';

  const statValues: Record<string, string | number> = {
    totalGames,
    winRate:      `${winRate}%`,
    wins:         stats.wins,
    favoriteGame: stats.favoriteGame || '—',
  };

  const filterColors: Record<string, string> = {
    all:    'from-pink-500 to-purple-500',
    easy:   'from-green-400 to-emerald-500',
    medium: 'from-yellow-400 to-orange-500',
    hard:   'from-red-400 to-pink-500',
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero greeting */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 glass px-5 py-2 rounded-full text-sm text-pink-600 dark:text-pink-300 font-medium mb-4">
            <Sparkles size={14} className="animate-pulse" />
            Your couple gaming space
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 bg-clip-text text-transparent mb-3">
            Welcome, {user?.displayName?.split(' ')[0] || 'Player'} 💕
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Choose a game to play with your partner</p>
        </div>

        {/* Stats */}
        {!statsLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {STAT_CARDS.map(({ icon: Icon, color, label, key }) => (
              <div key={key} className="glass-card p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 glass rounded-xl">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{statValues[key]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
            <button key={level} onClick={() => setFilter(level)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                filter === level
                  ? `bg-gradient-to-r ${filterColors[level]} text-white shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30 scale-105`
                  : 'glass-btn text-gray-600 dark:text-gray-300 hover:scale-105'
              }`}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Game grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            🎮 <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Games</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredGames.map((game) => (
              <Link key={game.id} to={game.route} className="block group">
                <GameCard {...game} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent history */}
        {!historyLoading && history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
              🕐 <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Recent Games</span>
            </h2>
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-white/30 dark:divide-white/10">
                {history.slice(0, 5).map((game) => (
                  <div key={game.id} className="p-4 hover:bg-white/30 dark:hover:bg-white/5 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{game.game_type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">vs {game.player_2_email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                          game.winner_email === user?.email
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : game.winner_email === null
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {game.winner_email === user?.email ? '🏆 Won' : game.winner_email === null ? '🤝 Draw' : '💔 Lost'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{new Date(game.created_at).toLocaleDateString()}</p>
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
