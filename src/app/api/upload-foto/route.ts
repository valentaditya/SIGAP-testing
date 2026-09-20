import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${laporanId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        console.warn(`Upload gagal untuk ${fileName}:`, error.message);
        continue;
      }

      const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengunggah foto.", urls: [] },
      { status: 500 }
    );
  }
}
