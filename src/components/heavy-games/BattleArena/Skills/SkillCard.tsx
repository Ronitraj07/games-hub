import React from 'react';
import { Sparkles, Clock, Droplet } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  levelRequired: number;
  learned: boolean;
}

interface SkillCardProps {
  skill: Skill;
  onClick?: () => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ skill, onClick }) => {
  return (
    <div
      onClick={skill.learned ? onClick : undefined}
      className={`
        p-4 rounded-lg border-2 transition-all
        ${skill.learned
          ? 'bg-blue-900/30 border-blue-500 hover:bg-blue-900/50 cursor-pointer hover:scale-105'
          : 'bg-gray-800/30 border-gray-600 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-white">{skill.name}</h3>
        <Sparkles className={skill.learned ? 'text-blue-400' : 'text-gray-600'} size={20} />
      </div>
      
      <p className="text-sm text-gray-300 mb-3">{skill.description}</p>
      
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Droplet size={14} />
          <span>{skill.manaCost} MP</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{skill.cooldown}s</span>
        </div>
      </div>
      
      {!skill.learned && (
        <div className="mt-2 text-xs text-yellow-500">
          Requires Level {skill.levelRequired}
        </div>
      )}
    </div>
  );
};