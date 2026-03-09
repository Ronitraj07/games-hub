/**
 * Authentication Configuration
 * Three-layer email restriction system
 */

export const ALLOWED_EMAILS = [
  'sinharonitraj@gmail.com',
  'radhikadidwania567@gmail.com'
];

/**
 * Check if an email is in the whitelist
 */
export const isEmailAllowed = (email: string): boolean => {
  return ALLOWED_EMAILS.some(
    allowed => allowed.toLowerCase() === email.toLowerCase()
  );
};

/**
 * User-friendly error messages
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED_EMAIL: '⛔ This app is private. Only Ronit and Radhika can access.',
  INVALID_CREDENTIALS: '❌ Invalid email or password.',
  EMAIL_IN_USE: '⚠️ This email is already registered.',
  ACCOUNT_DELETED: '🚫 Unauthorized account deleted.',
  NETWORK_ERROR: '🌐 Network error. Please check your connection.',
  WEAK_PASSWORD: '🔒 Password should be at least 6 characters.',
  UNKNOWN_ERROR: '❓ An unexpected error occurred. Please try again.',
};

/**
 * Application configuration
 */
export const APP_CONFIG = {
  APP_NAME: 'Couple Games Hub',
  DESCRIPTION: 'Private gaming platform for Ronit & Radhika',
  COUPLE_NAMES: ['Ronit', 'Radhika'],
};

/**
 * Get display name from email
 */
export const getDisplayNameFromEmail = (email: string): string => {
  if (email === 'sinharonitraj@gmail.com') return 'Ronit';
  if (email === 'radhikadidwania567@gmail.com') return 'Radhika';
  return email.split('@')[0];
};