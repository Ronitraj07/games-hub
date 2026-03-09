import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const RPGHub: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-800">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="text-6xl mb-6">⚔️🏰</div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">RPG Games</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Epic adventures coming soon!
        </p>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We're working on exciting RPG experiences including:
          </p>
          <ul className="text-left space-y-2 text-gray-600 dark:text-gray-400">
            <li>🗡️ <strong>Battle Arena</strong> - Turn-based combat system</li>
            <li>🏰 <strong>Dungeon Crawlers</strong> - Explore mysterious dungeons</li>
            <li>⚔️ <strong>Character Progression</strong> - Level up and gain skills</li>
            <li>🎒 <strong>Item Collection</strong> - Gather powerful equipment</li>
          </ul>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          Playing as: {user?.email || 'Guest'}
        </p>
      </div>
    </div>
  );
};
