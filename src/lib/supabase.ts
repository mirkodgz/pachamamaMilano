import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  return import.meta.env[key] || (typeof process !== 'undefined' ? process.env[key] : undefined);
};

const supabaseUrl = getEnv('PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL') || 'https://dummy.supabase.co';
const supabaseAnonKey = getEnv('PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || 'dummy_key';
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE');

// Cliente público para operaciones
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con privilegios de administrador (Solo Servidor)
// Condicionamos su creación porque en el navegador supabaseServiceKey es undefined y tira error fatal.
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as any;
