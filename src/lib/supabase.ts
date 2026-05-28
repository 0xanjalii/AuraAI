import { createClient } from "@supabase/supabase-js";

let cachedClient: any = null;

/**
 * Retrieves the Supabase client instance.
 * Supports dynamic configuration at runtime (e.g. settings UI)
 * or falls back to static environment variables.
 */
export function getSupabaseClient(dynamicUrl?: string, dynamicKey?: string) {
  // Prioritize dynamic runtime inputs
  if (dynamicUrl && dynamicKey) {
    try {
      return createClient(dynamicUrl, dynamicKey);
    } catch (e) {
      console.error("Failed to initialize dynamic Supabase client", e);
      return null;
    }
  }

  // Fallback to process environment variables
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    if (!cachedClient) {
      try {
        cachedClient = createClient(envUrl, envKey);
      } catch (e) {
        console.error("Failed to initialize cached Supabase client", e);
        return null;
      }
    }
    return cachedClient;
  }

  return null;
}
