import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL      || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Returns true only when both env vars are properly set.
 * Use this guard before every Supabase call to avoid 406 / auth errors
 * when the app is deployed without Supabase credentials.
 */
export const isSupabaseConfigured = (): boolean =>
  !!(supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey && supabaseAnonKey.length > 20);

if (!isSupabaseConfigured()) {
  console.warn(
    '[Supabase] ⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid.\n' +
    'Add them to your Vercel project → Settings → Environment Variables:\n' +
    '  VITE_SUPABASE_URL      = https://xxxx.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY = eyJ...\n' +
    'Game history and stats will not work until these are set.'
  );
}

// Always create the client (needed for type inference), but requests will
// fail gracefully if env vars are missing — guard with isSupabaseConfigured()
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession:   true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'Accept':  'application/json',
        'apikey':  supabaseAnonKey || 'placeholder',
      },
    },
  }
);

export default supabase;
