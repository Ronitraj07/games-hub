import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL      || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] ⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Game history and RPG features will not work correctly.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      // Explicitly set Accept and apikey so every request is well-formed.
      // Without these, Supabase PostgREST returns 406 Not Acceptable.
      'Accept':  'application/json',
      'apikey':  supabaseAnonKey,
    },
  },
});

export default supabase;
