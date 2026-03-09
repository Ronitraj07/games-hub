import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({ current, max, label = 'HP' }) => {
  const percentage = (current / max) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        <span>{label}</span>
        <span>{current} / {max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden border-2 border-gray-600">
        <div
          className="bg-gradient-to-r from-red-600 to-red-500 h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
