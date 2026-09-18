import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan service role key agar bisa buat tabel dan set RLS policy
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function POST() {
  const results: Record<string, unknown> = {};

  try {
    // 1. Buat tabel sinyal_darurat jika belum ada
    const { error: createErr } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS sinyal_darurat (
          id TEXT PRIMARY KEY,
          jenis_label TEXT NOT NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          pelapor TEXT NOT NULL,
          wilayah TEXT NOT NULL,
          waktu TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          aktif BOOLEAN NOT NULL DEFAULT TRUE
        );
      `,
    });

    if (createErr) {
      // Fallback: coba via raw insert untuk trigger autovivification
      results.createErr = createErr.message;

      // Insert dummy lalu hapus untuk "create if not exists" workaround
      await supabaseAdmin
        .from("sinyal_darurat")
        .insert({
          id: "_test_",
          jenis_label: "test",
          lat: 0,
          lng: 0,
          pelapor: "test",
          wilayah: "kota_yogya",
          waktu: new Date().toISOString(),
          aktif: false,
        })
        .select();

      await supabaseAdmin.from("sinyal_darurat").delete().eq("id", "_test_");
    }

    // 2. Verifikasi tabel ada dengan select
    const { data: check, error: checkErr } = await supabaseAdmin
      .from("sinyal_darurat")
      .select("id")
      .limit(1);

    results.tableCheck = { data: check, error: checkErr?.message };

    // 3. Coba aktifkan RLS + policies via rpc jika ada
    try {
      await supabaseAdmin.rpc("exec_sql", {
        sql: `
          ALTER TABLE sinyal_darurat ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "allow_all" ON sinyal_darurat;
          CREATE POLICY "allow_all" ON sinyal_darurat FOR ALL USING (true) WITH CHECK (true);
        `,
      });
      results.rls = "ok";
    } catch (e: any) {
      results.rlsSkipped = e.message;
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, results }, { status: 500 });
  }
}

export async function GET() {
  // Cek apakah tabel sudah ada
  const { data, error } = await supabaseAdmin
    .from("sinyal_darurat")
    .select("*")
    .order("waktu", { ascending: false });

  return NextResponse.json({ data, error: error?.message });
}
