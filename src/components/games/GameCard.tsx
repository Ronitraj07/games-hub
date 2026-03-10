import React from 'react';
import { Clock, Users, Zap } from 'lucide-react';

interface GameCardProps {
  name:          string;
  description:   string;
  icon:          string;
  gradient:      string;   // tailwind gradient classes e.g. "from-pink-400 to-rose-500"
  glowColor:     string;   // tailwind shadow color e.g. "shadow-pink-300/60"
  difficulty:    string;
  players:       '1' | '2' | '1-2' | '2-4';
  estimatedTime: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400',
  Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  Hard:   'bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400',
};

export const GameCard: React.FC<GameCardProps> = ({
  name, description, icon, gradient, glowColor, difficulty, players, estimatedTime,
}) => (
  <div className="glass-card p-5 h-full flex flex-col group cursor-pointer relative overflow-hidden">

    {/* Subtle card shimmer on hover */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 rounded-2xl pointer-events-none`} />

    {/* Liquid-glass icon bubble */}
    <div className="mb-4 relative w-fit">
      {/* Outer glow ring */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} blur-xl opacity-40 group-hover:opacity-70 scale-110 transition-all duration-500`} />
      {/* Glass shell */}
      <div className={`
        relative w-16 h-16 rounded-2xl
        flex items-center justify-center text-3xl
        bg-white/30 dark:bg-white/10
        backdrop-blur-xl
        border border-white/60 dark:border-white/20
        shadow-xl ${glowColor}
        group-hover:scale-110 group-hover:rotate-3
        transition-all duration-300
        overflow-hidden
      `}>
        {/* Inner gradient tint */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
        {/* Top-left specular highlight */}
        <div className="absolute top-1 left-1.5 w-5 h-2 bg-white/60 rounded-full blur-sm rotate-[-20deg]" />
        {/* Bottom-right soft tint */}
        <div className={`absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br ${gradient} opacity-30 rounded-tl-2xl blur-md`} />
        {/* The actual icon */}
        <span className="relative z-10 drop-shadow-sm select-none">{icon}</span>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1">
      <h3 className={`font-bold text-gray-900 dark:text-white text-lg mb-1 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:${gradient} group-hover:bg-clip-text group-hover:text-transparent`}>
        {name}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{description}</p>
    </div>

    {/* Footer tags */}
    <div className="flex items-center gap-2 flex-wrap mt-auto">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium}`}>
        <Zap size={10} className="inline mr-1" />{difficulty}
      </span>
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center gap-1">
        <Users size={10} />{players}P
      </span>
      <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
        <Clock size={10} />{estimatedTime}
      </span>
    </div>
  </div>
);
