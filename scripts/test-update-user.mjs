import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibhfzlqwlluguyouiebz.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_UFLelgTc0DER8vrBQN1u9Q_-lfz7NEN";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { transport: ws },
});

async function testUpdate() {
  console.log("Testing update with SUPABASE_SERVICE_ROLE_KEY or anon key...");
  
  // 1. Anon update test
  const { data: anonData, error: anonErr } = await supabase
    .from("users")
    .update({ telepon: "08123456789" })
    .eq("email", "budi@gmail.com")
    .select();
  console.log("Anon update result:", anonData, "error:", anonErr);

  // 2. Query users by email to check exact casing
  const { data: userData } = await supabase
    .from("users")
    .select("id, email, nama")
    .eq("email", "budi@gmail.com");
  console.log("Found user:", userData);
}

testUpdate();
