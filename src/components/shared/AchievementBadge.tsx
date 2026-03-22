import React, { useState } from 'react';
import { Achievement, EarnedAchievement } from '@/types/achievements.types';

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  earnedDate?: string;
  showLabel?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  earned = false,
  earnedDate,
  showLabel = false,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative">
      {/* Badge */}
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${
          earned
            ? 'bg-gradient-to-br from-amber-200 to-yellow-300 dark:from-amber-700 dark:to-yellow-600 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/50 hover:scale-110'
            : 'bg-gray-200 dark:bg-gray-700 opacity-50 grayscale hover:opacity-60'
        }`}
        title={achievement.name}
      >
        {achievement.icon}
        {earned && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            ✓
          </div>
        )}
      </button>

      {/* Label (optional) */}
      {showLabel && (
        <p className="text-xs font-semibold text-center mt-1 line-clamp-2 text-gray-700 dark:text-gray-300">
          {achievement.name}
        </p>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="glass-card px-3 py-2 text-xs text-center rounded-lg shadow-xl whitespace-nowrap">
            <p className="font-semibold text-gray-900 dark:text-white">{achievement.name}</p>
            <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">{achievement.description}</p>
            {earned && earnedDate && (
              <p className="text-green-600 dark:text-green-400 text-xs mt-1 font-medium">
                Earned {formatDate(earnedDate)}
              </p>
            )}
            {!earned && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Locked</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
