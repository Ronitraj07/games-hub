import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = ({ size = 'md', message }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-12 h-12', lg: 'w-16 h-16' };
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizes[size]} relative`}>
        <div className={`${sizes[size]} rounded-full border-4 border-pink-100 dark:border-pink-900/30`} />
        <div className={`${sizes[size]} rounded-full border-4 border-transparent border-t-pink-500 border-r-purple-500 animate-spin absolute inset-0`} />
        <div className="absolute inset-0 flex items-center justify-center text-lg animate-heartbeat">💕</div>
      </div>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{message}</p>}
    </div>
  );
};
