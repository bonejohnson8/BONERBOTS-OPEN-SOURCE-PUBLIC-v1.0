// config.ts
/**
 * The URL for the Cloudflare Worker proxy.
 * This is used to bypass CORS issues when calling third-party APIs from the browser.
 * Replace with your actual worker URL.
 * Example: 'https://my-worker.my-account.workers.dev'
 */
export const PROXY_URL = 'PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE'; // IMPORTANT: SET YOUR PROXY URL HERE

/**
 * Supabase URL for real-time data synchronization in spectator mode.
 * Get this from your Supabase project settings.
 */
export const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_URL_HERE';

/**
 * Supabase Anon Key for real-time data synchronization in spectator mode.
 * This is a public key and is safe to expose in the browser.
 * Get this from your Supabase project settings.
 */
export const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';

/**
 * A flag that checks if all necessary environment variables are configured.
 * The application will show a warning if this is false.
 */
export const isAppConfigured = 
  PROXY_URL && !PROXY_URL.includes('PASTE_YOUR') &&
  SUPABASE_URL && !SUPABASE_URL.includes('PASTE_YOUR') &&
  SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('PASTE_YOUR');