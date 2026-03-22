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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 glass rounded-full border border-white/30 dark:border-white/10 sm:hidden backdrop-blur-xl">
      <div className="flex justify-center items-center gap-1 h-14 px-2">

        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all ${
            isActive('/')
              ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-pink-500/10 hover:text-pink-600 dark:hover:text-pink-400'
          }`}
        >
          <Home size={22} />
          <span className="text-xs font-semibold">Home</span>
        </Link>

        {/* Leaderboard */}
        <Link
          to="/leaderboard"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all ${
            isActive('/leaderboard')
              ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400'
          }`}
        >
          <Trophy size={22} />
          <span className="text-xs font-semibold">Scores</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full text-gray-600 dark:text-gray-400 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          <span className="text-xs font-semibold">Theme</span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all ${
            isActive('/profile')
              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400'
          }`}
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <span className="text-xl leading-none">{getPlayerEmoji(user.email || '')}</span>
          )}
          <span className="text-xs font-semibold">Profile</span>
        </Link>

      </div>
    </nav>
  );
};
