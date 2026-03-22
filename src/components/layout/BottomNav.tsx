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
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/30 dark:border-white/10 sm:hidden">
      <div className="flex justify-around items-center h-16 px-2">

        {/* Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition ${
            isActive('/')
              ? 'text-pink-600 dark:text-pink-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400'
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-semibold">Home</span>
        </Link>

        {/* Leaderboard */}
        <Link
          to="/leaderboard"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition ${
            isActive('/leaderboard')
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400'
          }`}
        >
          <Trophy size={24} />
          <span className="text-xs font-semibold">Scores</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          <span className="text-xs font-semibold">Theme</span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition ${
            isActive('/profile')
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
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
