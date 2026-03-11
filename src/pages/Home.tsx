import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { useRivalryStats } from '@/hooks/supabase/useRivalryStats';
import { GameCard } from '@/components/games/GameCard';
import { Trophy, Clock, Target, Swords, Sparkles, Flame, Zap, Heart, Search, ArrowRight, Star } from 'lucide-react';

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

const RPG_GAMES = [
  {
    id: 'heartbound',
    name: 'Heartbound Adventures',
    tagline: 'Cozy Co-op Romantic RPG',
    desc: 'Explore 8 magical islands, build your dream home & grow your Bond from 1 to 100.',
    icon: '🌸',
    pills: ['🗺️ 8 Islands', '🏡 Home Building', '💕 Bond Level'],
    gradient: 'from-pink-500 via-rose-500 to-purple-500',
    glow: 'shadow-pink-500/40',
    border: 'border-pink-500/30',
    route: '/rpg/heartbound',
    badge: '🌿 Playable Now',
    badgeColor: 'bg-green-500/20 text-green-300 border border-green-500/30',
  },
  {
    id: 'mystery',
    name: 'Mystery Partners',
    tagline: 'Co-op Noir Detective Adventure',
    desc: 'Crack 10+ thrilling cases in 1940s noir streets — interrogate suspects & analyse evidence together.',
    icon: '🔍',
    pills: ['🕵️ 10+ Cases', '🔎 Evidence Board', '🎭 Split Roles'],
    gradient: 'from-indigo-600 via-purple-600 to-violet-700',
    glow: 'shadow-indigo-500/40',
    border: 'border-indigo-500/30',
    route: '/rpg/mystery',
    badge: '🔒 Beta Q4 2026',
    badgeColor: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20',
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
    favoriteGame: stats.favoriteGame || '—',
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

      {/* ═══════════════════════════════════════════════════════════
           RPG ADVENTURES SECTION — cinematic dark portal
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-purple-950/60 to-gray-950 py-20 px-4">

        {/* Star particles — pure CSS */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width:  `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top:    `${Math.random() * 100}%`,
                left:   `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.2,
                animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-purple-300 font-semibold mb-4 backdrop-blur">
              <Star size={12} className="text-yellow-400" fill="currentColor" />
              Exclusive RPG Experiences
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
              ⚔️{' '}
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                RPG Adventures
              </span>
            </h2>
            <p className="text-purple-300/80 text-lg max-w-xl mx-auto">
              Two worlds. One couple. Infinite memories.
            </p>
          </div>

          {/* RPG Game cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {RPG_GAMES.map(game => (
              <Link
                key={game.id}
                to={game.route}
                className={`group relative overflow-hidden rounded-3xl border ${game.border} bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${game.glow} flex flex-col`}
              >
                {/* Top gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${game.gradient}`} />

                <div className="p-7 flex-1 flex flex-col">
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                      {game.icon}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full backdrop-blur ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  </div>

                  {/* Title + tagline */}
                  <h3 className="text-2xl font-bold text-white mb-1">{game.name}</h3>
                  <p className={`text-sm font-medium mb-3 bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent`}>
                    {game.tagline}
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5">{game.desc}</p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {game.pills.map(p => (
                      <span key={p} className="text-xs bg-white/10 text-gray-300 border border-white/10 px-3 py-1 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className={`mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r ${game.gradient} text-white font-semibold text-sm transition-all group-hover:opacity-90`}>
                    {game.id === 'heartbound' ? <Heart size={16} fill="currentColor" /> : <Search size={16} />}
                    Enter World
                    <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* See all link */}
          <div className="text-center">
            <Link
              to="/rpg"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors text-sm border border-purple-500/30 hover:border-purple-400/50 px-6 py-2.5 rounded-full backdrop-blur bg-white/5 hover:bg-white/10"
            >
              <Sparkles size={14} />
              Explore All RPG Games
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
