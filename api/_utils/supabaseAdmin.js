import { createClient } from '@supabase/supabase-js';

const cleanEnvValue = (value) => {
  return typeof value === 'string' ? value.replace(/^\uFEFF/, '').trim() : value;
};

export const createSupabaseAdmin = () => {
  const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL || process.env.URL_SUPABASE_VITE || process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const getUserFromRequest = async (req, supabase) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    return { user: null, error: new Error('Missing bearer token.') };
  }

  const { data, error } = await supabase.auth.getUser(token);
  return { user: data?.user || null, error };
};
