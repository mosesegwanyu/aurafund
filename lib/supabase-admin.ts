import { createClient } from '@supabase/supabase-js';

// Server-side only. Uses the service-role key, which bypasses Row Level
// Security, so this file must never be imported into client components.
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Campaign image uploads will fail until these are configured in Vercel.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl || '', serviceRoleKey || '', {
  auth: { persistSession: false },
});

export const CAMPAIGN_IMAGES_BUCKET = 'campaign-images';
