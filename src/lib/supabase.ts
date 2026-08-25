import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibhfzlqwlluguyouiebz.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_UFLelgTc0DER8vrBQN1u9Q_-lfz7NEN";

const isBrowser = typeof window !== "undefined";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
  ...(isBrowser
    ? {}
    : {
        realtime: {
          transport: require("ws"),
        },
      }),
});
