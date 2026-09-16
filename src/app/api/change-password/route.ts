import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan Service Role Key untuk bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/change-password
// Body: { email, sandiLama, sandiBaru }
export async function POST(req: NextRequest) {
  try {
    const { email, sandiLama, sandiBaru } = await req.json();

    if (!email || !sandiLama || !sandiBaru) {
      return NextResponse.json({ error: "email, sandiLama, dan sandiBaru wajib diisi" }, { status: 400 });
    }

    if (sandiBaru.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
    }

    // Verifikasi password lama
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("sandi", sandiLama)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
    }

    // Update password baru
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ sandi: sandiBaru })
      .eq("email", email);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
