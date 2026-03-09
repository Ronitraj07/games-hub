import React from 'react';
import { HealthBar } from './HealthBar';
import { SkillBar } from './SkillBar';

// TODO: Implement combat system

export const CombatArena: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-red-500">
      <h2 className="text-3xl font-bold text-center text-red-400 mb-6">Combat Arena</h2>
      
      <div className="text-center text-gray-400 py-20">
        <p className="text-xl mb-4">⚔️ Combat System Under Construction</p>
        <p>Turn-based combat with skills and items coming soon!</p>
      </div>

      <div className="mt-6">
        <SkillBar />
      </div>
    </div>
  );
};
