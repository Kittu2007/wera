// =============================================================================
// WERA — Supabase Client Utilities
// Server-side + Client-side Supabase client factories
// =============================================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ---------------------------------------------------------------------------
// Server-side client (for RSC, API routes, tRPC procedures)
// Uses cookies for session management
// ---------------------------------------------------------------------------

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Silently fail in RSC (cookies are read-only in Server Components)
          // This is expected behavior — session refresh happens in middleware
        }
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Service role client (for admin operations, webhooks, cron jobs)
// NEVER expose this to the client — bypasses RLS
// ---------------------------------------------------------------------------

export function createServiceRoleClient() {
  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op: service role client doesn't use cookies
      },
    },
  });
}

