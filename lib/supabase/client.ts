import { createBrowserClient } from "@supabase/ssr";

// Not parameterized with the Database type: our hand-written schema types
// (types/database.ts) don't include the Relationships metadata supabase-js's
// generic constraint expects, which collapses every query result to `never`.
// We type query results manually at each call site instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
