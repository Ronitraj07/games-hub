import React from 'react';
import { X } from 'lucide-react';
import { GLASS_VARIANTS } from '@/lib/glassTheme';

interface GlassModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeButton?: boolean;
  showBackdrop?: boolean;
  animation?: 'slideUp' | 'fadeScale' | 'scaleIn';
}

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'w-11/12 h-4/5',
};

/**
 * Refined glass modal component with smooth animations
 */
export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  title,
  description,
  children,
  onClose,
  size = 'md',
  closeButton = true,
  showBackdrop = true,
  animation = 'slideUp',
}) => {
  if (!isOpen) return null;

  const getAnimationClass = () => {
    switch (animation) {
      case 'slideUp':
        return 'animate-modal-slide-up';
      case 'fadeScale':
        return 'animate-scale-in';
      case 'scaleIn':
        return 'animate-pop-in';
      default:
        return 'animate-modal-slide-up';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-backdrop-fade"
          onClick={onClose}
        />
      )}

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Modal content */}
        <div
          className={`
            ${GLASS_VARIANTS.elevated}
            w-full ${MODAL_SIZES[size]}
            rounded-3xl
            p-6 md:p-8
            ${getAnimationClass()}
            pointer-events-auto
            relative
            max-h-[90vh]
            overflow-y-auto
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          {closeButton && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg glass-btn hover:bg-white/30 dark:hover:bg-white/15 transition-all duration-200 group"
              title="Close"
            >
              <X
                size={20}
                className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors"
              />
            </button>
          )}

          {/* Header */}
          {(title || description) && (
            <div className="mb-6">
              {title && (
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    </>
  );
};

interface GlassAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  dismissible?: boolean;
}

/**
 * Glass alert component for notifications
 */
export const GlassAlert: React.FC<GlassAlertProps> = ({
  type,
  title,
  description,
  action,
  onClose,
  dismissible = true,
}) => {
  const configs = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700/50',
      icon: '🔵',
      color: 'text-blue-700 dark:text-blue-400',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700/50',
      icon: '✅',
      color: 'text-green-700 dark:text-green-400',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-700/50',
      icon: '⚠️',
      color: 'text-yellow-700 dark:text-yellow-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700/50',
      icon: '❌',
      color: 'text-red-700 dark:text-red-400',
    },
  };

  const config = configs[type];

  return (
    <div
      className={`
        glass-card p-4 rounded-xl
        ${config.bg} border ${config.border}
        flex gap-4 items-start
        animate-slide-in-down
      `}
    >
      {/* Icon */}
      <span className="text-2xl flex-shrink-0">{config.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold ${config.color} mb-1`}>{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center flex-shrink-0">
        {action && (
          <button
            onClick={action.onClick}
            className={`text-sm font-semibold ${config.color} hover:opacity-70 transition-opacity`}
          >
            {action.label}
          </button>
        )}

        {dismissible && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg glass-btn hover:bg-white/30 dark:hover:bg-white/15 transition-all"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

interface GlassTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Glass tooltip component
 */
export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const positionClasses = {
    top: '-top-10 left-1/2 -translate-x-1/2 mb-2',
    bottom: '-bottom-10 left-1/2 -translate-x-1/2 mt-2',
    left: '-left-2 top-1/2 -translate-y-1/2 mr-2',
    right: '-right-2 top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="group relative inline-block">
      {children}

      {/* Tooltip */}
      <div
        className={`
          absolute z-50
          ${positionClasses[position]}
          opacity-0 group-hover:opacity-100
          pointer-events-none group-hover:pointer-events-auto
          transition-opacity duration-300
        `}
      >
        <div className={`glass-sm px-3 py-2 rounded-lg text-sm text-center whitespace-nowrap`}>
          {content}
        </div>
      </div>
    </div>
  );
};

interface GlassPopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Glass popover component
 */
export const GlassPopover: React.FC<GlassPopoverProps> = ({
  trigger,
  content,
  position = 'bottom',
}) => {
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="group relative inline-block">
      {trigger}

      {/* Popover */}
      <div
        className={`
          absolute z-50
          ${positionClasses[position]}
          opacity-0 group-hover:opacity-100
          group-hover:scale-100 scale-95
          pointer-events-none group-hover:pointer-events-auto
          transition-all duration-300
        `}
      >
        <div className={`${GLASS_VARIANTS.elevated} rounded-2xl p-4 min-w-max`}>
          {content}
        </div>
      </div>
    </div>
  );
};
