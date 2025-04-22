import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  throw new Error('Supabase URL and Service Key must be provided in .env file');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);
console.log('Using service role key for admin access');

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // Don't persist the session in localStorage
    autoRefreshToken: false, // Don't auto refresh the token
  },
});
