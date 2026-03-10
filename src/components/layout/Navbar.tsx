import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { APP_CONFIG, getPlayerEmoji } from '@/lib/auth-config';
import { LogOut, User, Home, Sun, Moon, Volume2, VolumeX, LogIn } from 'lucide-react';
import { toggleSound, isSoundEnabled } from '@/utils/sounds';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  const handleSignOut = async () => {
    try { await signOut(); navigate('/login'); }
    catch (error) { console.error('Sign out error:', error); }
  };

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/30 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent hover:from-pink-400 hover:to-purple-400 transition-all"
          >
            <span className="text-2xl animate-heartbeat">🎮</span>
            <span className="hidden sm:inline">{APP_CONFIG.APP_NAME}</span>
            <span className="sm:hidden">GH</span>
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
                {/* Home */}
                <Link to="/"
                  className="glass-btn flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition">
                  <Home size={18} />
                  <span className="hidden sm:inline text-sm">Home</span>
                </Link>

                {/* Profile — shows avatar if Google user, else emoji */}
                <Link to="/profile"
                  className="glass-btn flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg leading-none">{getPlayerEmoji(user.email || '')}</span>
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{user.displayName}</span>
                </Link>

                {/* Sign Out */}
                <button onClick={handleSignOut}
                  className="glass-btn flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:text-red-600 transition">
                  <LogOut size={18} />
                  <span className="hidden sm:inline text-sm">Sign Out</span>
                </button>
              </>
            ) : (
              /* ── NOT LOGGED IN ── */
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-sm transition-all hover:scale-[1.03] active:scale-[0.97] shadow-md shadow-pink-200/50 dark:shadow-pink-900/30"
              >
                <LogIn size={16} />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
