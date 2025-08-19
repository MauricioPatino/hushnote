import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  console.warn('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: false
  }
});

export const AUDIO_BUCKET = 'notes-audio';