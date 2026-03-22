import React from 'react';
import { BUTTON_STYLES } from '@/lib/gameIcons';

interface RefinedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'accent';
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  title?: string;
}

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-2xl',
};

/**
 * Refined button component with liquid glass styling
 * Supports multiple variants with consistent micro-interactions
 */
export const RefinedButton: React.FC<RefinedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  accentColor,
  size = 'md',
  disabled = false,
  className = '',
  title,
}) => {
  const getButtonStyle = () => {
    if (variant === 'accent' && accentColor) {
      return `${BUTTON_STYLES.accent(accentColor)} ${SIZE_STYLES[size]}`;
    }
    return `${BUTTON_STYLES[variant]} ${SIZE_STYLES[size]}`;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${getButtonStyle()}
        relative overflow-hidden
        focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Animated background shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-500 pointer-events-none" />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

/**
 * Icon button with refined glass styling
 */
interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'secondary',
  disabled = false,
  className = '',
  title,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      glass-btn p-2 rounded-xl
      hover:bg-white/40 dark:hover:bg-white/15
      transition-all duration-200
      hover:scale-110 active:scale-95
      disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:ring-2 focus-visible:ring-pink-500/50
      ${className}
    `}
  >
    {icon}
  </button>
);

/**
 * Group button for button sets
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 flex-wrap ${className}`}>
    {children}
  </div>
);
