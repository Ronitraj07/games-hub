import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/shared/useAuth';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { useGameHistory } from '@/hooks/supabase/useGameHistory';
import { GameCard } from '@/components/shared/GameCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { 
  Gamepad2, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  Heart,
  Sparkles,
  Crown,
  Zap,
  ArrowRight
} from 'lucide-react';
import type { GameCard as GameCardType } from '@/types/shared.types';

const GAMES: GameCardType[] = [
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    description: 'Classic 3x3 strategy game. Get three in a row!',
    category: 'simple',
    players: '2',
    thumbnail: '❌',
    route: '/games/tictactoe',
  },
  {
    id: 'wordscramble',
    title: 'Word Scramble',
    description: 'Unscramble romantic words against the clock',
    category: 'simple',
    players: '1-2',
    thumbnail: '🔤',
    route: '/games/wordscramble',
  },
  {
    id: 'memorymatch',
    title: 'Memory Match',
    description: 'Find matching pairs of cute emojis',
    category: 'simple',
    players: '1-2',
    thumbnail: '🧠',
    route: '/games/memorymatch',
  },
  {
    id: 'trivia',
    title: 'Trivia Quiz',
    description: 'Create custom quizzes for each other!',
    category: 'simple',
    players: '2',
    thumbnail: '❓',
    route: '/games/trivia',
  },
  {
    id: 'connect4',
    title: 'Connect 4',
    description: 'Drop discs and connect four in a row',
    category: 'simple',
    players: '2',
    thumbnail: '🔴',
    route: '/games/connect4',
  },
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    description: 'Best of 5 rounds showdown',
    category: 'simple',
    players: '2',
    thumbnail: '✊',
    route: '/games/rps',
  },
  {
    id: 'pictionary',
    title: 'Pictionary',
    description: 'Draw and guess with your partner',
    category: 'simple',
    players: '2',
    thumbnail: '🎨',
    route: '/games/pictionary',
  },
  {
    id: 'mathduel',
    title: 'Math Duel',
    description: 'Speed math competition. Fastest wins!',
    category: 'simple',
    players: '2',
    thumbnail: '➗',
    route: '/games/mathduel',
  },
];

const PARTNER_NAMES = {
  'sinharonitraj@gmail.com': 'Sparkles',
  'radhikadidwania567@gmail.com': 'Shizz'
};

const getPartnerEmail = (currentEmail: string): string => {
  return currentEmail === 'sinharonitraj@gmail.com' 
    ? 'radhikadidwania567@gmail.com' 
    : 'sinharonitraj@gmail.com';
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = usePlayerStats(user?.email || '');
  const { history, loading: historyLoading } = useGameHistory(user?.email || '', 5);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const yourName = PARTNER_NAMES[user?.email as keyof typeof PARTNER_NAMES] || 'Player';
  const partnerName = PARTNER_NAMES[getPartnerEmail(user?.email || '') as keyof typeof PARTNER_NAMES] || 'Partner';

  const totalGames = (stats?.wins || 0) + (stats?.losses || 0) + (stats?.draws || 0);
  const winRate = totalGames > 0 ? ((stats?.wins || 0) / totalGames * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Gamepad2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {greeting}, {yourName}! 💕
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ready to play with {partnerName}?
              </p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : totalGames}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Games Played</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : stats?.wins || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Wins</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : `${winRate}%`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : stats?.favorite_game || 'None'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Favorite Game</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Games Grid - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Simple Games
              </h2>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                8 Games
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GAMES.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {/* Coming Soon Section - Now Clickable! */}
            <div 
              onClick={() => navigate('/rpg')}
              className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-dashed border-purple-300 dark:border-purple-700 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1 group-hover:animate-bounce" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    RPG Adventures Coming Soon! 🎮✨
                    <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-2 transition-transform" />
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Two amazing adventures are in development:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌸</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Heartbound Adventures</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Explore magical islands together in this cozy romantic RPG
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Mystery Partners</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Solve thrilling detective cases as a couple
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    Click to learn more
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Recent Games
                </h3>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : history && history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((game, idx) => {
                    const isWin = game.winner === user?.email;
                    const isDraw = game.winner === null;
                    
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                            isWin 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : isDraw 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {GAMES.find(g => g.id === game.game_type)?.thumbnail || '🎮'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                              {GAMES.find(g => g.id === game.game_type)?.title || 'Game'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(game.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          {isWin ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                              Win
                            </span>
                          ) : isDraw ? (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded">
                              Draw
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded">
                              Loss
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No games played yet
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                    Start playing to see your history!
                  </p>
                </div>
              )}

              {history && history.length > 0 && (
                <button
                  onClick={() => navigate('/lobby')}
                  className="w-full mt-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-sm font-semibold"
                >
                  View All History →
                </button>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-bold">Pro Tips</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>💡</span>
                  <span>Try <strong>TriviaQuiz</strong> - create custom questions for each other!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎯</span>
                  <span><strong>WordScramble</strong> has time bonuses - solve faster for more points!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🧠</span>
                  <span><strong>MemoryMatch</strong> has 3 themes to choose from</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🎨</span>
                  <span><strong>Pictionary</strong> is perfect for laughs and creativity</span>
                </li>
              </ul>
            </div>

            {/* Love Meter */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5" />
                <h3 className="text-lg font-bold">Bond Level</h3>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold mb-2">❤️ Level {Math.min(Math.floor((stats?.wins || 0) / 5) + 1, 100)}</p>
                <p className="text-sm opacity-90">
                  Play more games to strengthen your bond!
                </p>
                <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((stats?.wins || 0) % 5) * 20, 100)}%` }}
                  />
                </div>
                <p className="text-xs mt-2 opacity-75">
                  {5 - ((stats?.wins || 0) % 5)} wins to next level
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};