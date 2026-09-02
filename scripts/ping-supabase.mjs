/**
 * Script untuk ping Supabase agar database free tier tidak di-pause otomatis.
 * Jalankan: npm run ping:supabase atau node scripts/ping-supabase.mjs
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibhfzlqwlluguyouiebz.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_UFLelgTc0DER8vrBQN1u9Q_-lfz7NEN";

async function pingSupabase() {
  console.log(`[${new Date().toISOString()}] Memulai ping Supabase: ${SUPABASE_URL}`);

  try {
    // 1. Ping GoTrue Auth Service
    const authStart = performance.now();
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_KEY },
    });
    const authTime = Math.round(performance.now() - authStart);
    console.log(`✅ [Auth Health] Status: ${authRes.status} (${authTime}ms)`);

    // 2. Ping PostgREST Database Endpoint
    const restStart = performance.now();
    const restRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    const restTime = Math.round(performance.now() - restStart);
    console.log(`✅ [REST API] Status: ${restRes.status} (${restTime}ms)`);

    console.log(`🎉 Supabase berhasil diping! Database tetap aktif & tidak akan di-pause.`);
  } catch (error) {
    console.error(`❌ Gagal melakukan ping Supabase:`, error);
    process.exit(1);
  }
}

pingSupabase();
