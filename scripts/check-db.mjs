import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibhfzlqwlluguyouiebz.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_UFLelgTc0DER8vrBQN1u9Q_-lfz7NEN";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { transport: ws },
});

async function listAllUsers() {
  const { data: users, error } = await supabase.from("users").select("id, nama, email, sandi, role, wilayah, telepon, alamat, foto, aktif");
  console.log("=== ALL USERS IN DB ===");
  console.log(JSON.stringify(users, null, 2));
}

listAllUsers();
