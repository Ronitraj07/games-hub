import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Heart, Trophy, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 text-center">
          {/* Avatar */}
          <div className="relative inline-block mb-5">
            <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center text-5xl shadow-lg animate-float">
              {user?.displayName?.[0]?.toUpperCase() || '💕'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <Heart size={14} className="text-white fill-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-1">
            {user?.displayName || 'Player'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Couple Gamer</p>

          <div className="space-y-3 mb-8 text-left">
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <Mail size={18} className="text-pink-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <User size={18} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Display Name</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{user?.displayName || '—'}</p>
              </div>
            </div>
            <div className="glass rounded-xl p-4 flex items-center gap-3">
              <Shield size={18} className="text-rose-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Account Status</p>
                <p className="font-medium text-green-600 dark:text-green-400 text-sm">✓ Verified</p>
              </div>
            </div>
          </div>

          <button onClick={handleSignOut}
            className="w-full glass-btn text-red-500 hover:text-red-600 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
