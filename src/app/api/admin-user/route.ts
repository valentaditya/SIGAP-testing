import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan Service Role Key untuk bypass RLS — HANYA di server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin-user — Tambah user baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, email, role, wilayah, telepon, alamat, aktif } = body;

    if (!nama || !email || !role) {
      return NextResponse.json({ error: "nama, email, dan role wajib diisi" }, { status: 400 });
    }

    // Password default = nama lowercase tanpa spasi
    const defaultPassword = nama.toLowerCase().replace(/\s+/g, "");

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        nama,
        email,
        role,
        wilayah: wilayah || null,
        telepon: telepon || null,
        alamat: alamat || null,
        aktif: aktif !== undefined ? aktif : true,
        sandi: defaultPassword,
      })
      .select()
      .single();

    if (error) {
      console.error("[admin-user POST] Supabase error:", error);
      return NextResponse.json({ error: error.message, detail: error.details }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/admin-user — Update data user
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    if (updateData.nama !== undefined) payload.nama = updateData.nama;
    if (updateData.email !== undefined) payload.email = updateData.email;
    if (updateData.role !== undefined) payload.role = updateData.role;
    if (updateData.wilayah !== undefined) payload.wilayah = updateData.wilayah;
    if (updateData.telepon !== undefined) payload.telepon = updateData.telepon;
    if (updateData.alamat !== undefined) payload.alamat = updateData.alamat;
    if (updateData.aktif !== undefined) payload.aktif = updateData.aktif;
    if (updateData.sandi !== undefined) payload.sandi = updateData.sandi;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diupdate" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("[admin-user PATCH] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin-user — Hapus user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[admin-user DELETE] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
