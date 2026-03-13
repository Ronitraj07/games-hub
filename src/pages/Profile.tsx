import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/shared/usePlayerStats';
import { getPlayerRole, getPlayerEmoji, getPartnerEmail, getPartnerName, getPartnerEmoji } from '@/lib/auth-config';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LogOut, Trophy, Target, Swords, Clock, Shield, Mail, User, Gamepad2, BarChart2, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAvatarStore } from '../stores/avatarStore';
import { ACCESSORIES } from '../types/accessories';

type GameType = string;

interface ByGame {
  game_type: GameType;
  wins: number;
  losses: number;
  draws: number;
}

const ALL_GAMES: { id: GameType; label: string; emoji: string }[] = [
  { id: 'tictactoe',    label: 'Tic Tac Toe',        emoji: '💗' },
  { id: 'wordscramble', label: 'Word Scramble',       emoji: '🔮' },
  { id: 'memorymatch',  label: 'Memory Match',        emoji: '🌸' },
  { id: 'connect4',     label: 'Connect 4',           emoji: '💎' },
  { id: 'trivia',       label: 'Trivia Quiz',         emoji: '✨' },
  { id: 'rps',          label: 'Rock Paper Scissors', emoji: '🫧' },
  { id: 'pictionary',   label: 'Pictionary',          emoji: '🎴' },
  { id: 'mathduel',     label: 'Math Duel',           emoji: '⚡' },
  { id: 'truthordare',  label: 'Truth or Dare',       emoji: '🔥' },
];

export const Profile: React.FC = () => {
  const { user, signOut }                 = useAuth();
  const { stats, loading }                = usePlayerStats();
  const navigate                          = useNavigate();
  const [signingOut, setSigningOut]       = useState(false);
  const [byGame, setByGame]               = useState<ByGame[]>([]);
  const [byGameLoading, setByGameLoading] = useState(true);

  // New avatar store — VRM-based
  const { equippedAccessories, unlockedAccessories, bondLevel, vrmUrl } = useAvatarStore();

  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); navigate('/login'); }
    catch { setSigningOut(false); }
  };

  useEffect(() => {
    if (!user?.email || !isSupabaseConfigured()) { setByGameLoading(false); return; }
    const fetchByGame = async () => {
      setByGameLoading(true);
      const { data } = await supabase
        .from('game_results')
        .select('game_type, result')
        .eq('player_email', user.email);
      if (!data) { setByGameLoading(false); return; }
      const map: Record<string, ByGame> = {};
      for (const row of data as any[]) {
        if (!map[row.game_type]) map[row.game_type] = { game_type: row.game_type, wins: 0, losses: 0, draws: 0 };
        if (row.result === 'win')  map[row.game_type].wins++;
        if (row.result === 'loss') map[row.game_type].losses++;
        if (row.result === 'draw') map[row.game_type].draws++;
      }
      setByGame(Object.values(map));
      setByGameLoading(false);
    };
    fetchByGame();
  }, [user?.email]);

  if (!user) return null;

  const role         = getPlayerRole(user.email || '');
  const emoji        = getPlayerEmoji(user.email || '');
  const partnerEmail = getPartnerEmail(user.email || '');
  const partnerName  = getPartnerName(user.email || '');
  const partnerEmoji = getPartnerEmoji(user.email || '');
  const winRate      = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : '0.0';
  const getGameByGame = (id: string) => byGame.find(b => b.game_type === id);
  const maxWins = Math.max(1, ...byGame.map(b => b.wins + b.losses + b.draws));

  // Accessory display helpers
  const equippedConfigs = ACCESSORIES.filter(a => equippedAccessories.includes(a.id));
  const inGameName = user.email === 'sinharonitraj@gmail.com' ? 'Sparkles' : 'Shizzy';

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="glass-card p-8 text-center">
          <div className="relative inline-block mb-4">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Avatar'}
                className="w-24 h-24 rounded-3xl object-cover shadow-xl ring-4 ring-pink-400/50" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-xl ring-4 ring-pink-400/50">
                <span className="text-5xl">{emoji}</span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
              {role}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {user.displayName || user.email?.split('@')[0]}
          </h1>
          <p className="text-pink-500 font-semibold text-sm mb-1">✨ {inGameName} ✨</p>
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-2">
            <Mail size={14} /><span>{user.email}</span>
          </div>
          {partnerName && partnerEmoji && (
            <div className="inline-flex items-center gap-2 mt-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 px-4 py-2 rounded-full">
              <span className="text-lg">{partnerEmoji}</span>
              <span className="text-sm text-pink-600 dark:text-pink-300 font-medium">Playing with {partnerName}</span>
              <span className="text-pink-400">❤️</span>
            </div>
          )}
          {partnerEmail && <p className="text-xs text-gray-400 mt-1">{partnerEmail}</p>}
        </div>

        {/* Stats Grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Total Games', value: stats.totalGames },
              { icon: Swords, color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-900/20',     label: 'Wins',        value: stats.wins },
              { icon: Target, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Win Rate',    value: `${winRate}%` },
              { icon: Clock,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',     label: 'Favourite',   value: stats.favoriteGame || '—' },
            ].map(({ icon: Icon, color, bg, label, value }) => (
              <div key={label} className="glass-card p-5 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Avatar Section */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette size={18} className="text-purple-500" /> My Avatar
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Character</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">🎭 VRM — {inGameName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Bond Level</p>
                <p className="text-sm font-bold text-pink-500">❤️ Level {bondLevel}</p>
              </div>
            </div>
            {/* Equipped accessories */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Equipped Accessories ({equippedConfigs.length})</p>
              <div className="flex flex-wrap gap-2">
                {equippedConfigs.length > 0 ? equippedConfigs.map(a => (
                  <span key={a.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    {a.emoji} {a.label}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400">None equipped</span>
                )}
              </div>
            </div>
            {/* Unlocked count */}
            <p className="text-xs text-gray-400">
              {unlockedAccessories.length} / {ACCESSORIES.length} accessories unlocked
            </p>
          </div>
        </div>

        {/* Per-game breakdown */}
        {!byGameLoading && (
          <div className="glass-card p-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 size={18} className="text-purple-500" /> Game Breakdown
            </h2>
            <div className="space-y-3">
              {ALL_GAMES.map(g => {
                const data = getGameByGame(g.id);
                const total = data ? data.wins + data.losses + data.draws : 0;
                const wPct  = total > 0 ? (data!.wins / maxWins) * 100 : 0;
                const lPct  = total > 0 ? (data!.losses / maxWins) * 100 : 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <span>{g.emoji}</span>{g.label}
                      </span>
                      {total > 0 ? (
                        <span className="text-xs text-gray-400">
                          <span className="text-green-500 font-semibold">{data!.wins}W</span>
                          {' '}<span className="text-red-400">{data!.losses}L</span>
                          {' '}<span className="text-gray-400">{data!.draws}D</span>
                        </span>
                      ) : <span className="text-xs text-gray-400">No games yet</span>}
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                      <div className="bg-green-400 h-full rounded-l-full transition-all" style={{ width: `${wPct}%` }} />
                      <div className="bg-red-300 h-full transition-all" style={{ width: `${lPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-pink-500" /> Account Info
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Name',          value: user.displayName || '—' },
              { label: 'In-game name',  value: inGameName },
              { label: 'Email',         value: user.email || '—' },
              { label: 'Partner',       value: partnerName ? `${partnerEmoji} ${partnerName}` : '—' },
              { label: 'Role',          value: role },
              { label: 'Sign-in',       value: user.photoURL ? '🔵 Google' : '📧 Email' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-white/20 dark:border-white/10' : ''}`}>
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Available Games */}
        <div className="glass-card p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gamepad2 size={18} className="text-purple-500" /> Available Games
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {ALL_GAMES.map(g => (
              <div key={g.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white/30 dark:bg-white/5 rounded-xl px-3 py-2">
                <span>{g.emoji}</span><span className="text-green-500 text-xs">✓</span>{g.label}
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-5 flex items-center gap-4">
          <Shield size={24} className="text-pink-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Private &amp; Secure</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This app is restricted to 3 authorised accounts only.</p>
          </div>
        </div>

        {/* Sign Out */}
        <button onClick={handleSignOut} disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
          {signingOut
            ? <span className="inline-block w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
            : <><LogOut size={18} /> Sign Out</>}
        </button>

      </div>
    </div>
  );
};
