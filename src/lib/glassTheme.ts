/**
 * COMPREHENSIVE GLASS MORPHISM UI SYSTEM
 * Phase 4: Applies liquid glass theme across all game pages
 * Updated: 2026-03-23
 */

export interface GlassContainerProps {
  variant?: 'default' | 'elevated' | 'modal' | 'floating';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  children: React.ReactNode;
}

/**
 * Glass container size presets
 */
export const GLASS_SIZES = {
  sm: { padding: 'p-3', rounded: 'rounded-lg' },
  md: { padding: 'p-4', rounded: 'rounded-xl' },
  lg: { padding: 'p-6', rounded: 'rounded-2xl' },
  xl: { padding: 'p-8', rounded: 'rounded-3xl' },
};

/**
 * Glass container variants with different blur/transparency levels
 */
export const GLASS_VARIANTS = {
  // Default: Balanced glass for content containers
  default: `
    glass-card
    backdrop-blur-xl
    border border-white/30 dark:border-white/10
    shadow-lg shadow-pink-500/5 dark:shadow-black/20
  `,

  // Elevated: Stronger glass for prominent sections
  elevated: `
    glass-lg
    backdrop-blur-2xl
    border border-white/40 dark:border-white/15
    shadow-xl shadow-pink-500/10 dark:shadow-black/30
  `,

  // Modal: Subtle glass for overlays
  modal: `
    bg-black/40 dark:bg-black/60
    backdrop-blur-md
    border border-white/20 dark:border-white/10
    shadow-2xl shadow-black/40
  `,

  // Floating: Minimal glass for floating elements
  floating: `
    glass-sm
    backdrop-blur-lg
    border border-white/25 dark:border-white/15
    shadow-md shadow-pink-500/5
  `,
};

/**
 * Game state container styles
 */
export const GAME_STATE_STYLES = {
  loading: `
    relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-r
    before:from-transparent before:via-white/30 before:to-transparent
    before:animate-shimmer before:-translate-x-full before:group-hover:translate-x-full
    before:transition-transform before:duration-2s
  `,

  active: `
    ring-2 ring-pink-500/50
    shadow-lg shadow-pink-500/20
  `,

  completed: `
    ring-2 ring-green-500/50
    shadow-lg shadow-green-500/20
  `,

  error: `
    ring-2 ring-red-500/50
    shadow-lg shadow-red-500/20
  `,

  disabled: `
    opacity-60
    pointer-events-none
  `,
};

/**
 * Form input glass styling
 */
export const INPUT_GLASS_STYLES = `
  bg-white/20 dark:bg-white/10
  backdrop-blur-sm
  border border-white/40 dark:border-white/20
  text-gray-900 dark:text-white
  placeholder-gray-500 dark:placeholder-gray-400
  focus:bg-white/30 dark:focus:bg-white/15
  focus:border-pink-500/50 dark:focus:border-pink-400/50
  focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-0
  transition-all duration-200
`;

/**
 * Achievement badge glass styles
 */
export const ACHIEVEMENT_BADGE_STYLES = {
  locked: `
    glass-sm p-3 rounded-lg
    grayscale opacity-50
    border border-white/10 dark:border-white/5
    hover:opacity-70 transition-opacity
  `,

  earned: `
    glass-card p-3 rounded-lg
    ring-2 ring-yellow-400/50
    shadow-lg shadow-yellow-500/20
    hover:scale-110 hover:shadow-xl
    transition-all duration-300
  `,

  featured: `
    glass-lg p-4 rounded-xl
    ring-2 ring-pink-500/50
    shadow-xl shadow-pink-500/30
    hover:scale-105 hover:shadow-2xl
    transition-all duration-300
    bg-gradient-to-br from-pink-500/10 to-purple-500/10
  `,
};

/**
 * Loading state skeleton styles
 */
export const SKELETON_STYLES = {
  base: `
    bg-gradient-to-r from-white/20 via-white/40 to-white/20
    dark:from-white/5 dark:via-white/10 dark:to-white/5
    rounded-lg
    animate-pulse
  `,

  shimmer: `
    relative overflow-hidden
    bg-gradient-to-r from-white/10 via-white/25 to-white/10
    dark:from-white/5 dark:via-white/15 dark:to-white/5
    rounded-lg
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-transparent before:via-white/40
    before:to-transparent before:dark:via-white/20
    before:-translate-x-full before:animate-shimmer
  `,

  pulse: `
    opacity-60 hover:opacity-100
    transition-opacity duration-300
    animate-pulse
  `,
};

/**
 * Modal backdrop + content animation combinations
 */
export const MODAL_ANIMATIONS = {
  slideUp: `
    enter:animate-modal-slide-up
    exit:animate-modal-slide-out
  `,

  fadeScale: `
    enter:animate-scale-in
    exit:animate-scale-out
  `,

  backdrop: `
    animate-backdrop-fade
  `,
};

/**
 * Button group glass container
 */
export const BUTTON_GROUP_CONTAINER = `
  glass-card p-4 rounded-xl
  flex flex-wrap items-center justify-center gap-3
  border border-white/30 dark:border-white/15
  shadow-lg shadow-pink-500/5
`;

/**
 * Score display glass box
 */
export const SCORE_DISPLAY_BOX = `
  glass-lg p-6 rounded-2xl
  ring-2 ring-pink-500/30
  shadow-xl shadow-pink-500/10
  text-center
`;

/**
 * Game board container
 */
export const GAME_BOARD_CONTAINER = `
  glass-card p-8 rounded-3xl
  border border-white/30 dark:border-white/15
  shadow-2xl shadow-pink-500/10
  bg-gradient-to-br from-white/30 to-white/10
  dark:from-white/10 dark:to-white/5
  my-6
`;

/**
 * Player info card
 */
export const PLAYER_INFO_CARD = `
  glass-card p-4 rounded-xl
  flex items-center gap-3
  border border-white/20 dark:border-white/10
  hover:border-pink-500/50 hover:shadow-lg
  transition-all duration-300
`;

/**
 * Round counter/phase indicator
 */
export const PHASE_INDICATOR = `
  glass-sm px-4 py-2 rounded-full
  text-sm font-semibold
  text-pink-600 dark:text-pink-400
  bg-pink-50/50 dark:bg-pink-900/20
  border border-pink-200/50 dark:border-pink-700/50
  inline-flex items-center gap-2
`;

/**
 * Timer display
 */
export const TIMER_DISPLAY = `
  glass-card px-6 py-3 rounded-xl
  text-center
  font-mono text-2xl font-bold
  text-pink-600 dark:text-pink-400
`;

/**
 * Hero section glass container
 */
export const HERO_CONTAINER = `
  glass-lg p-12 rounded-3xl
  text-center
  border-t-2 border-white/40 dark:border-white/15
  shadow-2xl shadow-pink-500/10
  bg-gradient-to-br from-pink-500/5 to-purple-500/5
  dark:from-pink-500/2 dark:to-purple-500/2
  my-8
`;

/**
 * Utility to get glass container class
 */
export const getGlassContainer = (
  variant: 'default' | 'elevated' | 'modal' | 'floating' = 'default',
  padding: 'sm' | 'md' | 'lg' | 'xl' = 'md',
  rounded: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' = 'xl'
): string => {
  const sizeConfig = GLASS_SIZES[padding];
  const variantClass = GLASS_VARIANTS[variant];
  return `${variantClass} ${sizeConfig.padding} ${sizeConfig.rounded}`;
};

/**
 * Get game state styling
 */
export const getGameStateStyle = (state: 'loading' | 'active' | 'completed' | 'error' | 'disabled' = 'active'): string => {
  return GAME_STATE_STYLES[state];
};
