import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Profile
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-3xl">
            {user?.displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.displayName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Stats (Coming Soon)
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Your gaming statistics will appear here.
          </p>
        </div>
      </div>
    </div>
  );
};