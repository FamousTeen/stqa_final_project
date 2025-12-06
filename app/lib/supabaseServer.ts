// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // !! server-only

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE env variables on the server.');
}

/**
 * Server client uses the service role key. Use only in server-side code.
 */
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
