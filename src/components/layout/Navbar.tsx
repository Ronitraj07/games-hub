import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPlayerEmoji } from '@/lib/auth-config';
import { Home, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { toggleSound, isSoundEnabled } from '@/utils/sounds';
import { GamesHubLogo } from '@/components/shared/GamesHubLogo';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/30 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <GamesHubLogo size={36} showText={true} />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1">

            {/* Sound toggle */}
            <button
              onClick={handleSoundToggle}
              className="glass-btn p-2 rounded-xl text-gray-700 dark:text-gray-300"
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled
                ? <Volume2 size={18} className="text-pink-500" />
                : <VolumeX  size={18} className="text-gray-400" />}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="glass-btn p-2 rounded-xl text-gray-700 dark:text-gray-300"
              title="Toggle theme"
            >
              {theme === 'light'
                ? <Moon size={18} className="text-purple-500" />
                : <Sun  size={18} className="text-yellow-400" />}
            </button>

            {user ? (
              <>
                <Link to="/"
                  className="glass-btn flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition">
                  <Home size={18} />
                  <span className="hidden sm:inline text-sm">Home</span>
                </Link>

                <Link to="/profile"
                  className="glass-btn flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg leading-none">{getPlayerEmoji(user.email || '')}</span>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{user.displayName}</span>
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-sm transition-all hover:scale-[1.03] active:scale-[0.97] shadow-md shadow-pink-200/50 dark:shadow-pink-900/30"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
