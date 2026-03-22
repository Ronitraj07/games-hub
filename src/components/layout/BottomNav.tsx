import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPlayerEmoji } from '@/lib/auth-config';
import { Home, Gamepad2, Trophy, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { toggleSound, isSoundEnabled } from '@/utils/sounds';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  if (!user) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home', color: 'pink' },
    { path: '/leaderboard', icon: Trophy, label: 'Scores', color: 'yellow' },
    { path: '', icon: Gamepad2, label: 'Games', color: 'purple' }, // Placeholder - could link to games page
    { path: '/profile', icon: Gamepad2, label: 'Profile', color: 'purple' }, // Will use avatar if available
  ];

  const isActive = (path: string) => location.pathname === path;

  const getColorClass = (isActive: boolean, color: string) => {
    if (!isActive) return 'text-gray-600 dark:text-gray-400';
    const colors: Record<string, string> = {
      pink: 'text-pink-600 dark:text-pink-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
      purple: 'text-purple-600 dark:text-purple-400',
    };
    return colors[color] || colors.pink;
  };

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full border border-white/30 dark:border-white/10 sm:hidden backdrop-blur-xl shadow-2xl shadow-pink-300/30 dark:shadow-pink-900/50 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
      }}>
      {/* Shine overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Inner light reflex */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-xl pointer-events-none" />

      <div className="flex justify-center items-center gap-1 h-14 px-2 relative z-10">

        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all group relative overflow-hidden ${
            isActive('/')
              ? 'bg-gradient-to-br from-pink-400/40 to-pink-500/20 text-pink-600 dark:text-pink-400 shadow-lg shadow-pink-300/40'
              : 'text-gray-600 dark:text-gray-400 hover:bg-pink-400/20 hover:text-pink-600 dark:hover:text-pink-400'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full" />
          <Home size={22} className="relative z-10" />
          <span className="text-xs font-semibold relative z-10">Home</span>
        </Link>

        {/* Leaderboard */}
        <Link
          to="/leaderboard"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all group relative overflow-hidden ${
            isActive('/leaderboard')
              ? 'bg-gradient-to-br from-yellow-400/40 to-yellow-500/20 text-yellow-600 dark:text-yellow-400 shadow-lg shadow-yellow-300/40'
              : 'text-gray-600 dark:text-gray-400 hover:bg-yellow-400/20 hover:text-yellow-600 dark:hover:text-yellow-400'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full" />
          <Trophy size={22} className="relative z-10" />
          <span className="text-xs font-semibold relative z-10">Scores</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full text-gray-600 dark:text-gray-400 hover:bg-purple-400/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all group relative overflow-hidden"
          title="Toggle theme"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full" />
          {theme === 'light' ? <Moon size={22} className="relative z-10" /> : <Sun size={22} className="relative z-10" />}
          <span className="text-xs font-semibold relative z-10">Theme</span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all group relative overflow-hidden ${
            isActive('/profile')
              ? 'bg-gradient-to-br from-purple-400/40 to-purple-500/20 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-300/40'
              : 'text-gray-600 dark:text-gray-400 hover:bg-purple-400/20 hover:text-purple-600 dark:hover:text-purple-400'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full" />
          {user.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover relative z-10" />
          ) : (
            <span className="text-xl leading-none relative z-10">{getPlayerEmoji(user.email || '')}</span>
          )}
          <span className="text-xs font-semibold relative z-10">Profile</span>
        </Link>

      </div>
    </nav>
  );
};
