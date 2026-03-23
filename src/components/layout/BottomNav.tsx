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
    { path: '/dashboard', icon: Home, label: 'Home', color: 'pink' },
    { path: '/leaderboard', icon: Trophy, label: 'Scores', color: 'yellow' },
    { path: '/profile', icon: Gamepad2, label: 'Profile', color: 'purple' },
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
    <nav
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden max-w-[90vw] w-full px-4"
      aria-label="Mobile navigation"
    >
      <div
        className="relative rounded-[28px] border-2 border-white/40 dark:border-white/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(236,72,153,0.25)] dark:shadow-[0_8px_32px_rgba(236,72,153,0.4)] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.65) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        {/* Shine overlay */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/60 via-transparent to-transparent opacity-70 pointer-events-none" />

        {/* Inner light reflex */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-b from-white/80 to-transparent blur-2xl pointer-events-none" />

        {/* Dark mode gradient overlay */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-transparent via-black/5 to-black/10 dark:from-black/30 dark:via-black/20 dark:to-black/40 pointer-events-none" />

        <div className="flex justify-around items-center h-20 px-2 relative z-10">

          {/* Home */}
          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-5 rounded-[20px] transition-all duration-300 group relative overflow-hidden min-w-[72px] ${
              isActive('/dashboard')
                ? 'bg-gradient-to-br from-pink-400/60 to-pink-500/40 text-pink-600 dark:text-pink-300 shadow-lg shadow-pink-400/50 scale-110'
                : 'text-gray-700 dark:text-gray-300 hover:bg-pink-400/25 hover:text-pink-600 dark:hover:text-pink-400 hover:scale-105 active:scale-95'
            }`}
            aria-label="Go to Home"
            aria-current={isActive('/dashboard') ? 'page' : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[20px]" />
            <Home size={24} className="relative z-10 drop-shadow-sm" />
            <span className="text-[10px] font-bold relative z-10 tracking-wide">Home</span>
          </Link>

          {/* Leaderboard */}
          <Link
            to="/leaderboard"
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-5 rounded-[20px] transition-all duration-300 group relative overflow-hidden min-w-[72px] ${
              isActive('/leaderboard')
                ? 'bg-gradient-to-br from-yellow-400/60 to-yellow-500/40 text-yellow-600 dark:text-yellow-300 shadow-lg shadow-yellow-400/50 scale-110'
                : 'text-gray-700 dark:text-gray-300 hover:bg-yellow-400/25 hover:text-yellow-600 dark:hover:text-yellow-400 hover:scale-105 active:scale-95'
            }`}
            aria-label="View Leaderboard"
            aria-current={isActive('/leaderboard') ? 'page' : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[20px]" />
            <Trophy size={24} className="relative z-10 drop-shadow-sm" />
            <span className="text-[10px] font-bold relative z-10 tracking-wide">Scores</span>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center gap-1.5 py-3 px-5 rounded-[20px] text-gray-700 dark:text-gray-300 hover:bg-purple-400/25 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 hover:scale-105 active:scale-95 group relative overflow-hidden min-w-[72px]"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[20px]" />
            {theme === 'light' ? <Moon size={24} className="relative z-10 drop-shadow-sm" /> : <Sun size={24} className="relative z-10 drop-shadow-sm" />}
            <span className="text-[10px] font-bold relative z-10 tracking-wide">Theme</span>
          </button>

          {/* Profile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-5 rounded-[20px] transition-all duration-300 group relative overflow-hidden min-w-[72px] ${
              isActive('/profile')
                ? 'bg-gradient-to-br from-purple-400/60 to-purple-500/40 text-purple-600 dark:text-purple-300 shadow-lg shadow-purple-400/50 scale-110'
                : 'text-gray-700 dark:text-gray-300 hover:bg-purple-400/25 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-105 active:scale-95'
            }`}
            aria-label="View My Profile"
            aria-current={isActive('/profile') ? 'page' : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[20px]" />
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover relative z-10 ring-2 ring-white/50 drop-shadow-sm" />
            ) : (
              <span className="text-xl leading-none relative z-10 drop-shadow-sm">{getPlayerEmoji(user.email || '')}</span>
            )}
            <span className="text-[10px] font-bold relative z-10 tracking-wide">Me</span>
          </Link>

        </div>
      </div>
    </nav>
  );
};
