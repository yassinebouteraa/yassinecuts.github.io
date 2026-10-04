import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

let clientPromise = null;

/**
 * The Supabase client, loaded on first use. The library is ~58 KB gzipped,
 * so importing it statically held up the first paint for every visitor;
 * every caller is already async, so it now streams in after the page shows.
 */
export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_KEY)
    );
  }
  return clientPromise;
}
