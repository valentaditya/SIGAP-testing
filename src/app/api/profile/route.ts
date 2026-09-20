import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gunakan Service Role Key untuk bypass RLS — HANYA di server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "laporan-foto";

// Helper upload base64 ke Supabase Storage jika formatnya data URL
async function uploadBase64ToStorage(base64Data: string, email: string): Promise<string> {
  try {
    const match = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!match) return base64Data; // Bukan data URL base64, return as is (misal URL http)

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const base64String = match[2];
    const buffer = Buffer.from(base64String, "base64");

    const cleanEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `avatars/avatar_${cleanEmail}_${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: `image/${match[1]}`,
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload avatar failed, fallback to base64 string:", error.message);
      return base64Data;
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
    return urlData?.publicUrl || base64Data;
  } catch (err) {
    console.warn("Exception uploading avatar to storage:", err);
    return base64Data;
  }
}

// POST /api/profile — Update data profile user (termasuk foto)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nama, telepon, alamat, wilayah, foto } = body;

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    let finalFoto = foto;
    if (foto && typeof foto === "string" && foto.startsWith("data:image/")) {
      finalFoto = await uploadBase64ToStorage(foto, email);
    }

    const payload: Record<string, unknown> = {};
    if (nama !== undefined) payload.nama = nama.trim();
    if (telepon !== undefined) payload.telepon = telepon.trim();
    if (alamat !== undefined) payload.alamat = alamat.trim();
    if (wilayah !== undefined) payload.wilayah = wilayah;
    if (finalFoto !== undefined) payload.foto = finalFoto;

    // Update ke Supabase DB dengan Service Role
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(payload)
      .eq("email", email.trim())
      .select("id, nama, email, role, wilayah, telepon, alamat, foto, aktif")
      .single();

    if (error) {
      console.error("[POST /api/profile] Supabase error:", error);
      // Jika kolom foto belum ada di DB, coba update tanpa foto
      if (error.message.includes("foto") || error.code === "42703") {
        delete payload.foto;
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from("users")
          .update(payload)
          .eq("email", email.trim())
          .select("id, nama, email, role, wilayah, telepon, alamat, aktif")
          .single();

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, data: { ...retryData, foto: finalFoto } });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || { email, ...payload } });
  } catch (e: any) {
    console.error("[POST /api/profile] Exception:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
