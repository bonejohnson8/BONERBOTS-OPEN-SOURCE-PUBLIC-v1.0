import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isAppConfigured } from '../config';
// Fix: Imported the Database type definition for a typed Supabase client.
import type { Database } from '../types';

// Fix: Applied the Database generic to createClient for type safety.
let supabase: ReturnType<typeof createClient<Database>> | null = null;

if (isAppConfigured) {
    // Fix: Applied the Database generic to createClient for type safety.
    supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    // The main App component will now show a dedicated warning screen,
    // so a console error here is for supplementary debugging.
    console.warn("Supabase is not configured. Please check your config.ts file.");
}

// Export the flag directly from here for convenience in other services.
export { supabase, isAppConfigured };
