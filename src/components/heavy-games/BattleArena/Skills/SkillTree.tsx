import React from 'react';
import { SkillCard } from './SkillCard';

interface SkillTreeProps {
  characterClass: string;
  learnedSkills: string[];
  onSkillSelect?: (skillId: string) => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({ characterClass, learnedSkills, onSkillSelect }) => {
  // TODO: Fetch skills from Supabase based on character class
  const mockSkills = [
    {
      id: 'skill-1',
      name: 'Power Strike',
      description: 'Deal 150% damage to target',
      manaCost: 20,
      cooldown: 5,
      levelRequired: 1,
      learned: learnedSkills.includes('skill-1')
    },
    {
      id: 'skill-2',
      name: 'Whirlwind',
      description: 'AOE attack dealing 120% damage',
      manaCost: 30,
      cooldown: 8,
      levelRequired: 5,
      learned: learnedSkills.includes('skill-2')
    },
    {
      id: 'skill-3',
      name: 'Battle Cry',
      description: 'Increase attack by 30% for 10 seconds',
      manaCost: 25,
      cooldown: 15,
      levelRequired: 10,
      learned: learnedSkills.includes('skill-3')
    }
  ];

  return (
    <div className="p-6 bg-gray-900 rounded-xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        {characterClass} Skill Tree
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockSkills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onClick={() => onSkillSelect?.(skill.id)}
          />
        ))}
      </div>

      <div className="mt-6 text-center text-gray-400 text-sm">
        <p>More skills unlock as you level up</p>
      </div>
    </div>
  );
};