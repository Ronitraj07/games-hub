import React from 'react';
import { Heart } from 'lucide-react';
import { APP_CONFIG } from '@/lib/auth-config';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            Made with <Heart size={16} className="text-red-500 fill-red-500" /> for{' '}
            {APP_CONFIG.COUPLE_NAMES.join(' & ')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} {APP_CONFIG.APP_NAME}. Private & Secure.
          </p>
        </div>
      </div>
    </footer>
  );
};