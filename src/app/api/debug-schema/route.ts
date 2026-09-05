import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Cek kolom tabel laporan via information_schema
    const { data: laporanCols, error: laporanErr } = await supabase
      .rpc("get_table_columns", { table_name: "laporan" })
      .select("*");

    // Fallback: coba insert kosong dan lihat error untuk debug
    const { error: insertErr } = await supabase
      .from("laporan")
      .select("*")
      .limit(0);

    // Coba ambil satu row untuk tahu kolomnya
    const { data: sample, error: sampleErr } = await supabase
      .from("laporan")
      .select("*")
      .limit(1);

    const { data: usersSample, error: usersErr } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    // Cek storage buckets
    const { data: buckets, error: bucketsErr } = await supabase
      .storage
      .listBuckets();

    return NextResponse.json({
      laporan: {
        sample,
        error: sampleErr?.message,
        cols: laporanCols,
        colsErr: laporanErr?.message,
      },
      users: {
        sample: usersSample,
        error: usersErr?.message,
      },
      storage: {
        buckets,
        error: bucketsErr?.message,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
