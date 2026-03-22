import React, { useState } from 'react';

/**
 * MICRO-INTERACTIONS & ANIMATION UTILITY COMPONENT
 * Provides smooth transitions and enhanced UX through CSS animations
 */

/**
 * Smooth Button with Glow Effect
 * Usage: <SmoothButton onClick={handler}>Click me</SmoothButton>
 */
export const SmoothButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}> = ({ onClick, children, variant = 'primary', size = 'md', disabled = false, className = '' }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold',
    secondary: 'glass-btn text-gray-700 dark:text-gray-300',
    ghost: 'text-pink-600 dark:text-pink-400 hover:text-pink-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-6 py-2.5 text-base rounded-xl',
    lg: 'px-8 py-3.5 text-lg rounded-2xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]} ${sizes[size]}
        interactive-lift button-glow
        transition-all duration-300 ease-out
        hover:shadow-lg active:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

/**
 * Animated Card Component
 * Slides in with staggered animations
 */
export const AnimatedCard: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  return (
    <div
      className={`glass-card animate-slide-in-up ${className}`}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Loading Spinner with Smooth Animation
 */
export const SmoothLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizes[size]} animate-spin`}>
      <div className="w-full h-full border-4 border-pink-200 dark:border-pink-900 border-t-pink-500 dark:border-t-pink-400 rounded-full" />
    </div>
  );
};

/**
 * Success Tick Animation
 */
export const SuccessTick: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`${className} animate-pop-in`}>
      <svg className="w-full h-full text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
};

/**
 * Score Pop-up Animation
 * Shows when points are earned
 */
export const ScorePop: React.FC<{ value: number; x?: number; y?: number }> = ({ value, x = 0, y = 0 }) => {
  return (
    <div
      className="fixed text-2xl font-bold text-pink-500 dark:text-pink-400 pointer-events-none animate-float-up"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        animation: 'floatUp 1s ease-out forwards',
      }}
    >
      +{value}
    </div>
  );
};

/**
 * Page Transition Wrapper
 * Smooth enter/exit animations for pages
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`animate-page-enter ${className}`}>{children}</div>;
};

/**
 * Modal Backdrop with Fade Animation
 */
export const ModalBackdrop: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center animate-backdrop-fade"
      onClick={onClick}
    >
      <div className="animate-modal-slide-up" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

/**
 * Staggered List for Multiple Items
 * Each item appears with a delay
 */
export const StaggeredList: React.FC<{
  items: React.ReactNode[];
  delay?: number;
  className?: string;
}> = ({ items, delay = 50, className = '' }) => {
  return (
    <div className={className}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="animate-slide-in-up"
          style={{
            animationDelay: `${idx * delay}ms`,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

/**
 * Combo Counter Display
 * Shows multi-hit combos with pulsing effect
 */
export const ComboCounter: React.FC<{ count: number }> = ({ count }) => {
  const showCombo = count >= 2;

  return showCombo ? (
    <div className="text-center animate-combo-pulse">
      <p className="text-sm text-pink-600 dark:text-pink-400 font-semibold mb-1">COMBO!</p>
      <p className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
        x{count}
      </p>
    </div>
  ) : null;
};

/**
 * Victory Banner
 * Shows with celebration animation
 */
export const VictoryBanner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="animate-victory-animation text-center p-6 glass-lg rounded-3xl">
      <p className="text-6xl mb-4">🎉</p>
      <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
        {message}
      </p>
    </div>
  );
};

/**
 * Smooth Transition Badge
 * Status indicators with smooth color transitions
 */
export const TransitionBadge: React.FC<{
  label: string;
  status: 'active' | 'pending' | 'completed';
}> = ({ label, status }) => {
  const colors = {
    active: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-500/20 text-green-700 dark:text-green-400',
  };

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-sm font-semibold
        transition-all duration-300
        ${colors[status]}
      `}
    >
      {label}
    </span>
  );
};
