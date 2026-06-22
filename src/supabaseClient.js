import { createClient } from '@supabase/supabase-js';

const cleanEnvValue = (value) => {
  return typeof value === 'string' ? value.replace(/^\uFEFF/, '').trim() : value;
};

const supabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);
// Trying both ANON_KEY and PUBLISHABLE_KEY based on what was in the .env
const supabaseAnonKey = cleanEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
