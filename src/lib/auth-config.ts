/**
 * Authentication Configuration
 * Three-layer email restriction system
 */

export const ALLOWED_EMAILS = [
  'sinharonitraj@gmail.com',       // Player 1 — Ronit
  'radhikadidwania567@gmail.com',  // Player 2 — Radhika
  'shizzandsparkles@gmail.com',    // Owner / Tester
];

/** The testing account that can play with BOTH Ronit and Radhika */
export const TEST_ACCOUNT_EMAIL = 'shizzandsparkles@gmail.com';

/** Returns true if the email is the designated testing account */
export const isTestAccount = (email: string): boolean =>
  email.toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();

export const isEmailAllowed = (email: string): boolean =>
  ALLOWED_EMAILS.some(a => a.toLowerCase() === email.toLowerCase());

export const AUTH_ERRORS = {
  UNAUTHORIZED_EMAIL: '⛔ This app is private. Only Ronit, Radhika & Shizz can access.',
  INVALID_CREDENTIALS: '❌ Invalid email or password.',
  EMAIL_IN_USE: '⚠️ This email is already registered.',
  ACCOUNT_DELETED: '🚫 Unauthorized account removed.',
  NETWORK_ERROR: '🌐 Network error. Please check your connection.',
  WEAK_PASSWORD: '🔒 Password should be at least 6 characters.',
  UNKNOWN_ERROR: '❓ An unexpected error occurred. Please try again.',
};

export const APP_CONFIG = {
  APP_NAME: 'Games-Hub',
  DESCRIPTION: 'Private gaming platform for Ronit & Radhika',
  COUPLE_NAMES: ['Ronit', 'Radhika'],
};

export const getDisplayNameFromEmail = (email: string): string => {
  if (email === 'sinharonitraj@gmail.com')      return 'Ronit';
  if (email === 'radhikadidwania567@gmail.com')  return 'Radhika';
  if (email === 'shizzandsparkles@gmail.com')    return 'Shizz';
  return email.split('@')[0];
};

export const getPlayerRole = (email: string): string => {
  if (email === 'sinharonitraj@gmail.com')      return 'Player 1';
  if (email === 'radhikadidwania567@gmail.com')  return 'Player 2';
  if (email === 'shizzandsparkles@gmail.com')    return 'Owner';
  return 'Guest';
};

export const getPlayerEmoji = (email: string): string => {
  if (email === 'sinharonitraj@gmail.com')      return '👨‍💻';
  if (email === 'radhikadidwania567@gmail.com')  return '👩‍🎤';
  if (email === 'shizzandsparkles@gmail.com')    return '👑';
  return '👤';
};

/**
 * Returns the partner's email for a given player.
 * Ronit  ↔ Radhika (bidirectional)
 * Shizz  → null (test account — bypasses partner restriction, can play with anyone)
 */
export const getPartnerEmail = (email: string): string | null => {
  if (email === 'sinharonitraj@gmail.com')      return 'radhikadidwania567@gmail.com';
  if (email === 'radhikadidwania567@gmail.com')  return 'sinharonitraj@gmail.com';
  return null; // Shizz / unknown — no fixed partner (test account bypasses this)
};

/**
 * Returns the partner's display name for a given player.
 */
export const getPartnerName = (email: string): string | null => {
  const partnerEmail = getPartnerEmail(email);
  return partnerEmail ? getDisplayNameFromEmail(partnerEmail) : null;
};

/**
 * Returns the partner's emoji for a given player.
 */
export const getPartnerEmoji = (email: string): string | null => {
  const partnerEmail = getPartnerEmail(email);
  return partnerEmail ? getPlayerEmoji(partnerEmail) : null;
};

/**
 * For the test account: returns both real player emails so Shizz
 * can act as either player's partner in multiplayer sessions.
 */
export const getTestPartners = (): { email: string; name: string }[] => [
  { email: 'sinharonitraj@gmail.com',      name: 'Ronit'   },
  { email: 'radhikadidwania567@gmail.com', name: 'Radhika' },
];
