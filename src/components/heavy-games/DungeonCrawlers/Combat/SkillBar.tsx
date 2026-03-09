import React from 'react';

export const SkillBar: React.FC = () => {
  // TODO: Load character skills from useSkills hook

  const placeholderSkills = [
    { id: 1, name: 'Attack', icon: '⚔️', cooldown: 0 },
    { id: 2, name: 'Skill 1', icon: '🔥', cooldown: 5 },
    { id: 3, name: 'Skill 2', icon: '⚡', cooldown: 8 },
    { id: 4, name: 'Heal', icon: '❤️', cooldown: 10 },
  ];

  return (
    <div className="flex justify-center gap-4">
      {placeholderSkills.map((skill) => (
        <button
          key={skill.id}
          className="bg-gray-700 hover:bg-gray-600 border-2 border-purple-500 rounded-lg p-4 w-20 h-20 flex flex-col items-center justify-center transition-all"
        >
          <span className="text-2xl">{skill.icon}</span>
          <span className="text-xs text-gray-400 mt-1">{skill.name}</span>
        </button>
      ))}
    </div>
  );
};
