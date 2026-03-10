import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { getPlayerRole, getPlayerEmoji } from '@/lib/auth-config';
import { LogOut, Trophy, Target, Swords, Clock, Shield, Mail, User, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SIMPLE_GAMES = [
  'Tic Tac Toe', 'Word Scramble', 'Memory Match',
  'Connect 4', 'Trivia Quiz', 'Rock Paper Scissors',
  'Pictionary', 'Math Duel',
];

export const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { stats, loading } = usePlayerStats();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); navigate('/login'); }
    catch { setSigningOut(false); }
  };

  if (!user) return null;

  const role    = getPlayerRole(user.email || '');
  const emoji   = getPlayerEmoji(user.email || '');
  const winRate = stats.totalGames > 0
    ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
    : '0.0';

  // Partner info
  const partnerMap: Record<string, { name: string; emoji: string }> = {
    'sinharonitraj@gmail.com':     { name: 'Radhika', emoji: '👩‍🎤' },
    'radhikadidwania567@gmail.com':{ name: 'Ronit',   emoji: '👨‍💻' },
    'shizzandsparkles@gmail.com':  { name: 'Both!',   emoji: '👑' },
  };
  const partner = partnerMap[user.email || ''];

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="glass-card p-8 text-center">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                className="w-24 h-24 rounded-3xl object-cover shadow-xl ring-4 ring-pink-400/50"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-xl ring-4 ring-pink-400/50">
                <span className="text-5xl">{emoji}</span>
              </div>
            )}
            {/* Role badge */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
              {role}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {user.displayName || user.email?.split('@')[0]}
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
            <Mail size={14} />
            <span>{user.email}</span>
          </div>

          {/* Partner info */}
          {partner && (
            <div className="inline-flex items-center gap-2 mt-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 px-4 py-2 rounded-full">
              <span className="text-lg">{partner.emoji}</span>
              <span className="text-sm text-pink-600 dark:text-pink-300 font-medium">
                Playing with {partner.name}
              </span>
              <span className="text-pink-400">❤️</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Trophy,   color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Total Games', value: stats.totalGames },
              { icon: Swords,   color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-900/20',   label: 'Wins',        value: stats.wins },
              { icon: Target,   color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Win Rate',  value: `${winRate}%` },
              { icon: Clock,    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   label: 'Favourite',   value: stats.favoriteGame || '—' },
            ].map(({ icon: Icon, color, bg, label, value }) => (
              <div key={label} className="glass-card p-5 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Account Info */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-pink-500" /> Account Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/20 dark:border-white/10">
              <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.displayName || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20 dark:border-white/10">
              <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20 dark:border-white/10">
              <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{role}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sign-in method</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.photoURL ? '🔵 Google' : '📧 Email'}
              </span>
            </div>
          </div>
        </div>

        {/* Games available */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gamepad2 size={18} className="text-purple-500" /> Available Games
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {SIMPLE_GAMES.map(game => (
              <div key={game} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white/30 dark:bg-white/5 rounded-xl px-3 py-2">
                <span className="text-green-500">✓</span> {game}
              </div>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="glass-card p-5 flex items-center gap-4">
          <Shield size={24} className="text-pink-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Private &amp; Secure</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This app is restricted to 3 authorised accounts only.</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {signingOut
            ? <span className="inline-block w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
            : <><LogOut size={18} /> Sign Out</>}
        </button>

      </div>
    </div>
  );
};
