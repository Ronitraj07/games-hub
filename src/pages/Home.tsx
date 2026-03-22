import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { useRivalryStats } from '@/hooks/supabase/useRivalryStats';
import { GameCard } from '@/components/games/GameCard';
import { Trophy, Clock, Target, Swords, Sparkles, Flame, Zap } from 'lucide-react';

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
    id: 'trivia',
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
    id: 'rps',
    name: 'Rock Paper Scissors',
    description: 'Best of 5 rounds',
    icon: '🧧',
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
    icon: '🎤',
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
  {
    id: 'truthordare',
    name: 'Truth or Dare',
    description: 'Secrets, dares & After Dark 🔞',
    icon: '🔥',
    gradient:  'from-rose-500 to-red-600',
    glowColor: 'shadow-rose-400/60 dark:shadow-red-600/40',
    route: '/games/truthordare',
    difficulty: 'Easy',
    players: '2' as const,
    estimatedTime: '10+ min',
  },
];

const STAT_CARDS = [
  { icon: Trophy,  color: 'text-yellow-500', label: 'Total Games', key: 'totalGames'   as const },
  { icon: Target,  color: 'text-pink-500',   label: 'Win Rate',    key: 'winRate'      as const },
  { icon: Swords,  color: 'text-purple-500', label: 'Wins',        key: 'wins'         as const },
  { icon: Clock,   color: 'text-rose-400',   label: 'Favourite',   key: 'favoriteGame' as const },
];

const timeAgo = (date: Date): string => {
  const diffMs   = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7)  return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

export const Home: React.FC = () => {
  const { user }                             = useAuth();
  const { stats, loading: statsLoading }     = usePlayerStats();
  const { lastPlayed, currentStreak,
          me, partner, loading: rivalLoading } = useRivalryStats();

  const totalGames = stats.totalGames;
  const winRate    = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : '0.0';

  const statValues: Record<string, string | number> = {
    totalGames,
    winRate:      `${winRate}%`,
    wins:         stats.wins,
    favoriteGame: stats.favoriteGame || ‘—‘,
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

        {/* Rivalry banner */}
        {!rivalLoading && partner && (me.wins + me.losses + me.draws) > 0 && (
          <div className="glass-card p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="text-center min-w-[80px]">
              <p className="text-2xl font-black text-green-500">{me.wins}</p>
              <p className="text-xs text-gray-500">{me.name} wins</p>
            </div>
            <div className="flex-1 min-w-[160px] text-center">
              <p className="text-xs font-semibold text-gray-400 mb-2">⚔️ Head-to-Head</p>
              {(me.wins + partner.wins) > 0 && (
                <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800 mb-2">
                  <div className="bg-blue-400 h-full transition-all" style={{ width: `${(me.wins / (me.wins + partner.wins)) * 100}%` }} />
                  <div className="bg-pink-400 h-full transition-all" style={{ width: `${(partner.wins / (me.wins + partner.wins)) * 100}%` }} />
                </div>
              )}
              {currentStreak && currentStreak.count > 1 && (
                <div className="inline-flex items-center gap-1 text-xs text-orange-500 font-semibold bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                  <Flame size={11} /> {currentStreak.name} is on a {currentStreak.count}-win streak!
                </div>
              )}
              {me.draws > 0 && <p className="text-xs text-gray-400 mt-1">{me.draws} draw{me.draws !== 1 ? 's' : ''}</p>}
            </div>
            <div className="text-center min-w-[80px]">
              <p className="text-2xl font-black text-pink-500">{partner.wins}</p>
              <p className="text-xs text-gray-500">{partner.name} wins</p>
            </div>
          </div>
        )}

        {/* Simple Games grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
            🎮 <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Quick Games</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SIMPLE_GAMES.map((game) => {
              const lp = lastPlayed[game.id];
              return (
                <Link key={game.id} to={game.route} className="block group">
                  <div className="relative">
                    <GameCard {...game} />
                    {lp && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        <Zap size={9} className="text-yellow-400" />
                        {timeAgo(lp)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
