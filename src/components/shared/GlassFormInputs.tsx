import React from 'react';
import { INPUT_GLASS_STYLES } from '@/lib/glassTheme';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'floating' | 'minimal';
}

/**
 * Glass morphism input component
 * Supports multiple variants with smooth micro-interactions
 */
export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  helperText,
  icon,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: INPUT_GLASS_STYLES,
    floating: `
      bg-transparent
      border-b-2 border-white/30 dark:border-white/20
      focus:border-pink-500
      rounded-none px-0 py-2
    `,
    minimal: `
      bg-transparent
      border-none
      focus:ring-2 focus:ring-pink-500/30
      rounded-lg px-3 py-2
    `,
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          className={`
            w-full
            ${variantStyles[variant]}
            ${icon ? 'pl-10' : 'px-3'}
            py-2 px-3
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            rounded-lg
            transition-all duration-200
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 animate-slide-in-up">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}

/**
 * Glass morphism select component
 */
export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  options,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        <select
          className={`
            w-full
            ${INPUT_GLASS_STYLES}
            ${icon ? 'pl-10' : 'px-3'}
            py-2
            appearance-none
            cursor-pointer
            rounded-lg
            transition-all duration-200
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

/**
 * Glass morphism textarea component
 */
export const GlassTextarea: React.FC<GlassTextareaProps> = ({
  label,
  error,
  helperText,
  maxLength,
  value,
  className = '',
  ...props
}) => {
  const charCount = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          className={`
            w-full min-h-[120px]
            ${INPUT_GLASS_STYLES}
            px-3 py-2
            rounded-lg
            resize-none
            transition-all duration-200
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30' : ''}
            ${className}
          `}
          value={value}
          {...props}
        />

        {maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-500 dark:text-gray-400">
            {charCount}/{maxLength}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 animate-slide-in-up">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface GlassCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/**
 * Glass morphism checkbox component
 */
export const GlassCheckbox: React.FC<GlassCheckboxProps> = ({
  label,
  className = '',
  ...props
}) => {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        className={`
          w-5 h-5
          rounded-lg
          bg-white/20 dark:bg-white/10
          border-2 border-white/40 dark:border-white/20
          checked:bg-pink-500 checked:border-pink-500
          focus:ring-2 focus:ring-pink-500/30 focus:ring-offset-0
          cursor-pointer
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      {label && (
        <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
};
