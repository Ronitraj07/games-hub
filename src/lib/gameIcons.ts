/**
 * CENTRALIZED GAME ICON & STYLE SYSTEM
 * Ensures consistency across all 14 games with liquid glass theme
 * Updated: 2026-03-22
 */

export interface GameStyle {
  icon: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  accentColor: string;
  lightBg: string;
  darkBg: string;
}

export const GAME_ICONS: Record<string, GameStyle> = {
  // ORIGINAL 9 GAMES
  tictactoe: {
    icon: '💗',
    emoji: '💗',
    gradient: 'from-rose-400 to-pink-500',
    glowColor: 'shadow-rose-300/60 dark:shadow-rose-500/40',
    accentColor: 'text-rose-500 dark:text-rose-400',
    lightBg: 'bg-rose-50/50 dark:bg-rose-900/20',
    darkBg: 'dark:bg-rose-900/30',
  },
  wordscramble: {
    icon: '🔤',
    emoji: '🔤',
    gradient: 'from-violet-400 to-purple-600',
    glowColor: 'shadow-violet-300/60 dark:shadow-violet-500/40',
    accentColor: 'text-violet-500 dark:text-violet-400',
    lightBg: 'bg-violet-50/50 dark:bg-violet-900/20',
    darkBg: 'dark:bg-violet-900/30',
  },
  memorymatch: {
    icon: '🧠',
    emoji: '🧠',
    gradient: 'from-pink-400 to-fuchsia-500',
    glowColor: 'shadow-pink-300/60 dark:shadow-pink-500/40',
    accentColor: 'text-pink-500 dark:text-pink-400',
    lightBg: 'bg-pink-50/50 dark:bg-pink-900/20',
    darkBg: 'dark:bg-pink-900/30',
  },
  connect4: {
    icon: '🔵',
    emoji: '🔵',
    gradient: 'from-sky-400 to-blue-600',
    glowColor: 'shadow-sky-300/60 dark:shadow-sky-500/40',
    accentColor: 'text-sky-500 dark:text-sky-400',
    lightBg: 'bg-sky-50/50 dark:bg-sky-900/20',
    darkBg: 'dark:bg-sky-900/30',
  },
  triviaquiz: {
    icon: '🧩',
    emoji: '🧩',
    gradient: 'from-amber-400 to-rose-500',
    glowColor: 'shadow-amber-300/60 dark:shadow-amber-500/40',
    accentColor: 'text-amber-500 dark:text-amber-400',
    lightBg: 'bg-amber-50/50 dark:bg-amber-900/20',
    darkBg: 'dark:bg-amber-900/30',
  },
  rockpaperscissors: {
    icon: '✋',
    emoji: '✋',
    gradient: 'from-teal-400 to-cyan-500',
    glowColor: 'shadow-teal-300/60 dark:shadow-teal-500/40',
    accentColor: 'text-teal-500 dark:text-teal-400',
    lightBg: 'bg-teal-50/50 dark:bg-teal-900/20',
    darkBg: 'dark:bg-teal-900/30',
  },
  pictionary: {
    icon: '🎨',
    emoji: '🎨',
    gradient: 'from-orange-400 to-rose-500',
    glowColor: 'shadow-orange-300/60 dark:shadow-orange-500/40',
    accentColor: 'text-orange-500 dark:text-orange-400',
    lightBg: 'bg-orange-50/50 dark:bg-orange-900/20',
    darkBg: 'dark:bg-orange-900/30',
  },
  mathduel: {
    icon: '⚡',
    emoji: '⚡',
    gradient: 'from-lime-400 to-emerald-500',
    glowColor: 'shadow-lime-300/60 dark:shadow-emerald-500/40',
    accentColor: 'text-lime-500 dark:text-lime-400',
    lightBg: 'bg-lime-50/50 dark:bg-lime-900/20',
    darkBg: 'dark:bg-lime-900/30',
  },
  truthordare: {
    icon: '🔥',
    emoji: '🔥',
    gradient: 'from-rose-500 to-red-600',
    glowColor: 'shadow-rose-400/60 dark:shadow-red-600/40',
    accentColor: 'text-rose-500 dark:text-rose-400',
    lightBg: 'bg-rose-50/50 dark:bg-rose-900/20',
    darkBg: 'dark:bg-rose-900/30',
  },

  // NEW 4 GAMES
  scrabble: {
    icon: '🎯',
    emoji: '🎯',
    gradient: 'from-indigo-400 to-blue-600',
    glowColor: 'shadow-indigo-300/60 dark:shadow-blue-500/40',
    accentColor: 'text-indigo-500 dark:text-indigo-400',
    lightBg: 'bg-indigo-50/50 dark:bg-indigo-900/20',
    darkBg: 'dark:bg-indigo-900/30',
  },
  storybuilder: {
    icon: '✍️',
    emoji: '✍️',
    gradient: 'from-pink-500 to-rose-600',
    glowColor: 'shadow-pink-400/60 dark:shadow-rose-500/40',
    accentColor: 'text-pink-600 dark:text-pink-400',
    lightBg: 'bg-pink-50/50 dark:bg-pink-900/20',
    darkBg: 'dark:bg-pink-900/30',
  },
  kissingwheel: {
    icon: '💋',
    emoji: '💋',
    gradient: 'from-red-500 to-pink-600',
    glowColor: 'shadow-red-400/60 dark:shadow-pink-500/40',
    accentColor: 'text-red-500 dark:text-red-400',
    lightBg: 'bg-red-50/50 dark:bg-red-900/20',
    darkBg: 'dark:bg-red-900/30',
  },
};

/**
 * Button style system for consistent liquid glass design
 */
export const BUTTON_STYLES = {
  primary: `
    bg-gradient-to-r from-pink-500 to-rose-500
    text-white font-semibold
    hover:shadow-lg hover:shadow-pink-500/30 dark:hover:shadow-pink-600/30
    active:shadow-md active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all duration-200
  `,
  secondary: `
    glass-btn text-gray-700 dark:text-gray-300
    hover:bg-white/40 dark:hover:bg-white/15
    border border-white/50 dark:border-white/20
    transition-all duration-200
  `,
  ghost: `
    text-pink-600 dark:text-pink-400
    hover:text-pink-700 dark:hover:text-pink-300
    hover:bg-pink-50/50 dark:hover:bg-pink-900/20
    transition-all duration-200
  `,
  glass: `
    glass-btn rounded-xl px-4 py-2
    text-gray-700 dark:text-gray-300
    hover:bg-white/40 dark:hover:bg-white/15
    transition-all duration-200
  `,
  accent: (accentColor: string) => `
    glass-btn rounded-xl px-4 py-2
    ${accentColor}
    hover:bg-current/10
    transition-all duration-200
  `,
};

/**
 * Get game style by ID
 */
export const getGameStyle = (gameId: string): GameStyle => {
  return GAME_ICONS[gameId] || GAME_ICONS.tictactoe;
};

/**
 * Badge styles for consistency
 */
export const BADGE_STYLES = {
  difficulty: {
    Easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-700/50',
    Medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-700/50',
    Hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-700/50',
  },
  status: {
    active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
};
