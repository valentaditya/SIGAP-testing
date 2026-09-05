import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Pakai Service Role Key (server-side only) agar bisa upload tanpa RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "laporan-foto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const laporanId = (formData.get("laporanId") as string) || `sgp-${Date.now()}`;

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada file yang dikirim." }, { status: 400 });
    }

    console.log(`\n📤 [SIGAP UPLOAD] Memulai upload ${files.length} foto untuk laporan: ${laporanId}`);

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        console.warn(`⚠️ Melewati file non-gambar: ${file.name}`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${laporanId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      console.log(`📷 Mengupload: ${fileName} (${(file.size / 1024).toFixed(1)} KB)`);

      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.warn(`⚠️ Upload gagal untuk ${fileName}:`, error.message);
        continue;
      }

      // Dapatkan public URL permanen
      const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
        console.log(`✅ Upload berhasil: ${urlData.publicUrl}`);
      }
    }

    console.log(`✅ [SIGAP UPLOAD] Selesai. ${uploadedUrls.length}/${files.length} foto berhasil diupload.`);

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error("❌ [SIGAP UPLOAD] Critical error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat mengupload foto.", urls: [] },
      { status: 500 }
    );
  }
}
