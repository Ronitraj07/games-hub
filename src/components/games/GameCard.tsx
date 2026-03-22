import React from 'react';
import { Clock, Users, Zap } from 'lucide-react';
import { BADGE_STYLES } from '@/lib/gameIcons';

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

export const GameCard: React.FC<GameCardProps> = ({
  name, description, icon, gradient, glowColor, difficulty, players, estimatedTime,
}) => {
  const difficultyStyle = BADGE_STYLES.difficulty[difficulty as keyof typeof BADGE_STYLES.difficulty] || BADGE_STYLES.difficulty.Medium;

  return (
    <div className="group perspective">
      {/* Main card container with liquid glass */}
      <div className="glass-card p-5 h-full flex flex-col cursor-pointer relative overflow-hidden transition-all duration-500 group-hover:shadow-xl group-hover:shadow-current/20">

        {/* Animated gradient background overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 rounded-2xl pointer-events-none`} />

        {/* Liquid-glass icon bubble with enhanced effects */}
        <div className="mb-4 relative w-fit">
          {/* Animated outer glow ring */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} blur-xl opacity-30 group-hover:opacity-60 scale-125 transition-all duration-500 group-hover:scale-150`} />

          {/* Glass shell with specular highlights */}
          <div className={`
            relative w-16 h-16 rounded-2xl
            flex items-center justify-center text-3xl
            bg-gradient-to-br from-white/40 to-white/20 dark:from-white/15 dark:to-white/5
            backdrop-blur-xl
            border border-white/70 dark:border-white/25
            shadow-xl ${glowColor}
            group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-2xl
            transition-all duration-300
            overflow-hidden
            before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:${gradient} before:opacity-15 before:group-hover:opacity-25 before:transition-opacity before:duration-300
          `}>
            {/* Inner shimmer effect */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top-left specular highlight */}
            <div className="absolute top-1.5 left-2 w-4 h-1.5 bg-white/70 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

            {/* Bottom-right soft gradient */}
            <div className={`absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl ${gradient} opacity-25 rounded-tl-2xl blur-md group-hover:opacity-40 transition-opacity duration-300`} />

            {/* The icon */}
            <span className="relative z-10 drop-shadow-sm select-none group-hover:scale-110 transition-transform duration-300">{icon}</span>
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-current group-hover:bg-clip-text group-hover:text-transparent">
            {name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
            {description}
          </p>
        </div>

        {/* Footer badges with refined styling */}
        <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-white/20 dark:border-white/10">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyStyle} flex items-center gap-1 transition-all duration-300 group-hover:scale-105`}>
            <Zap size={10} className="opacity-70" />{difficulty}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pink-50/50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border border-pink-200/50 dark:border-pink-700/50 flex items-center gap-1 transition-all duration-300 group-hover:scale-105">
            <Users size={10} className="opacity-70" />{players}P
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 ml-auto group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
            <Clock size={10} className="opacity-70" />{estimatedTime}
          </span>
        </div>
      </div>
    </div>
  );
};
