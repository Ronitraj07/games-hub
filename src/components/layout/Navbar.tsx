import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPlayerEmoji } from '@/lib/auth-config';
import { Home, Sun, Moon, Volume2, VolumeX, Trophy } from 'lucide-react';
import { toggleSound, isSoundEnabled } from '@/utils/sounds';
import { GamesHubLogo } from '@/components/shared/GamesHubLogo';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  const isLeaderboard = location.pathname === '/leaderboard';

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/30 dark:border-white/10 hidden sm:block shadow-xl shadow-pink-200/20 dark:shadow-pink-900/30 relative overflow-hidden">
      {/* Shine overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 relative z-10">

          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="hover:opacity-90 transition-opacity transform hover:scale-105 duration-200">
            <GamesHubLogo size={40} showText={true} />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Sound toggle */}
            <button
              onClick={handleSoundToggle}
              className="glass-btn relative p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg group overflow-hidden"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {soundEnabled
                ? <Volume2 size={20} className="text-pink-500 relative z-10" />
                : <VolumeX  size={20} className="text-gray-400 relative z-10" />}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="glass-btn relative p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg group overflow-hidden"
              title="Toggle theme"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {theme === 'light'
                ? <Moon size={20} className="text-purple-500 relative z-10" />
                : <Sun  size={20} className="text-yellow-400 relative z-10" />}
            </button>

            {user && (
              <>
                {/* Home */}
                <Link to="/dashboard"
                  className={`glass-btn relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 group overflow-hidden ${
                    location.pathname === '/dashboard'
                      ? 'text-pink-600 dark:text-pink-400 bg-gradient-to-r from-pink-200/50 to-pink-100/30 dark:from-pink-900/40 dark:to-pink-800/20 shadow-lg shadow-pink-300/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-white/40 dark:hover:bg-white/15'
                  }`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <Home size={20} className="relative z-10" />
                  <span className="hidden sm:inline text-sm font-semibold relative z-10">Home</span>
                </Link>

                {/* Leaderboard */}
                <Link to="/leaderboard"
                  className={`glass-btn relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 group overflow-hidden ${
                    isLeaderboard
                      ? 'text-yellow-600 dark:text-yellow-400 bg-gradient-to-r from-yellow-200/50 to-yellow-100/30 dark:from-yellow-900/40 dark:to-yellow-800/20 shadow-lg shadow-yellow-300/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-white/40 dark:hover:bg-white/15'
                  }`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <Trophy size={20} className="relative z-10" />
                  <span className="hidden sm:inline text-sm font-semibold relative z-10">Scores</span>
                </Link>

                {/* Profile */}
                <Link to="/profile"
                  className={`glass-btn relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 group overflow-hidden ${
                    location.pathname === '/profile'
                      ? 'text-purple-600 dark:text-purple-400 bg-gradient-to-r from-purple-200/50 to-purple-100/30 dark:from-purple-900/40 dark:to-purple-800/20 shadow-lg shadow-purple-300/30'
                      : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/40 dark:hover:bg-white/15'
                  }`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover relative z-10" />
                  ) : (
                    <span className="text-lg leading-none relative z-10">{getPlayerEmoji(user.email || '')}</span>
                  )}
                  <span className="hidden sm:inline text-sm font-semibold relative z-10">{user.displayName}</span>
                </Link>
              </>
            )}

            {!user && (
              <Link
                to="/login"
                className="relative flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-300/50 dark:shadow-pink-900/40 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
