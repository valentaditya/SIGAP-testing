import { NextResponse } from "next/server";

export interface AIAnalysisResult {
  modelUsed: string;
  priorityScore: number; // 1.0 to 10.0
  severity: number;      // 1.0 to 10.0
  confidence: number;    // 0.70 to 0.98
  dampak: string;
  reasoning: string;
  sla: string;
  isDarurat: boolean;
}

// 1. Primary AI: Google Gemini 1.5 Flash
async function tryGemini(
  geminiKey: string,
  category: string,
  description: string,
  judul: string,
  alamat: string,
  imageBase64?: string,
  mimeType?: string
): Promise<AIAnalysisResult | null> {
  try {
    const prompt = `
Anda adalah AI Agent Penilai Prioritas Laporan Kedaruratan Warga (Aplikasi SIGAP).
Analisis laporan berikut secara objektif dan berikan respons HANYA dalam format JSON valid:

Kategori: ${category}
Judul: ${judul}
Deskripsi: ${description}
Lokasi: ${alamat || "Tidak disebutkan"}

Tugas Anda:
1. Hitung priorityScore (1.0 - 10.0) berdasarkan tingkat urgensi & keselamatan umum.
2. Hitung severity (1.0 - 10.0) berdasarkan skala kerusakan fisik/dampak sosial.
3. Tentukan SLA penanganan yang disarankan ("< 12 jam (Darurat)", "24 jam", "48-72 jam", atau "5-7 hari").
4. Tulis deskripsi singkat dampak sosial/keselamatan.
5. Tulis alasan analisis singkat (max 2 kalimat).

Format Output JSON Wajib:
{
  "priorityScore": 8.5,
  "severity": 8.0,
  "confidence": 0.95,
  "dampak": "Dampak terhadap arus lalu lintas dan keselamatan berkendara",
  "reasoning": "Kerusakan signifikan pada fasilitas umum yang berpotensi menyebabkan kecelakaan jika tidak segera ditangani.",
  "sla": "24 jam"
}
`;

    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: prompt }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inline_data: {
          mime_type: mimeType || "image/jpeg",
          data: cleanBase64,
        },
      });
    }

    // Model fallback otomatis ke model Gemini versi terbaru yang aktif & stabil
    const modelsToTry = [
      "gemini-flash-latest",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
    ];
    let res: Response | null = null;
    let usedModelName = "Google Gemini Flash (Primary AI)";

    for (const model of modelsToTry) {
      const apiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        }
      );
      if (apiRes.ok) {
        res = apiRes;
        usedModelName = `Google Gemini (${model})`;
        break;
      } else {
        console.warn(`⚠️ Gemini model ${model} returned HTTP ${apiRes.status}:`, await apiRes.text());
      }
    }

    if (!res || !res.ok) {
      return null;
    }

    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    const score = Math.min(Math.max(Number(parsed.priorityScore) || 7.0, 1), 10);
    const roundedScore = Math.round(score * 10) / 10;

    return {
      modelUsed: usedModelName,
      priorityScore: roundedScore,
      severity: Math.round(Math.min(Math.max(Number(parsed.severity) || score, 1), 10) * 10) / 10,
      confidence: Number(parsed.confidence) || 0.94,
      dampak: parsed.dampak || "Dianalisis oleh Gemini Flash Vision",
      reasoning: parsed.reasoning || "Prioritas dihitung otomatis dari analisis gambar dan teks.",
      sla: parsed.sla || (roundedScore >= 9 ? "< 12 jam (Darurat)" : roundedScore >= 8 ? "24 jam" : "48–72 jam"),
      isDarurat: roundedScore >= 9,
    };
  } catch (err) {
    console.warn("⚠️ Gemini Exception Error:", err);
    return null;
  }
}

// 2. Secondary AI (Fallback): OpenAI GPT-4o-mini
async function tryOpenAI(
  openaiKey: string,
  category: string,
  description: string,
  judul: string,
  alamat: string,
  imageBase64?: string
): Promise<AIAnalysisResult | null> {
  try {
    const promptText = `Analisis prioritas laporan warga SIGAP:
Kategori: ${category}
Judul: ${judul}
Deskripsi: ${description}
Lokasi: ${alamat}

Kembalikan JSON valid saja:
{
  "priorityScore": (number 1-10),
  "severity": (number 1-10),
  "confidence": (number 0.7-0.98),
  "dampak": (string),
  "reasoning": (string singkat),
  "sla": (string)
}`;

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: promptText },
    ];

    if (imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
        },
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn("⚠️ OpenAI API Response Not OK:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const rawText = json.choices?.[0]?.message?.content;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    const score = Math.min(Math.max(Number(parsed.priorityScore) || 7.0, 1), 10);
    const roundedScore = Math.round(score * 10) / 10;

    return {
      modelUsed: "OpenAI GPT-4o-mini (Fallback AI 1)",
      priorityScore: roundedScore,
      severity: Math.round(Math.min(Math.max(Number(parsed.severity) || score, 1), 10) * 10) / 10,
      confidence: Number(parsed.confidence) || 0.92,
      dampak: parsed.dampak || "Dianalisis oleh GPT-4o-mini Vision",
      reasoning: parsed.reasoning || "Dianalisis melalui model cadangan OpenAI GPT-4o-mini.",
      sla: parsed.sla || (roundedScore >= 9 ? "< 12 jam (Darurat)" : roundedScore >= 8 ? "24 jam" : "48–72 jam"),
      isDarurat: roundedScore >= 9,
    };
  } catch (err) {
    console.warn("⚠️ OpenAI Exception Error:", err);
    return null;
  }
}

// 3. Intelligent Heuristic Engine (Offline / Local Fallback 2)
function fallbackLocal(
  category: string,
  description: string,
  judul: string,
  hasImage: boolean
): AIAnalysisResult {
  const catWeights: Record<string, number> = {
    keamanan: 8.5,
    banjir: 8.8,
    jalan: 7.6,
    sampah: 6.2,
    lampu: 5.8,
    fasum: 4.5,
  };

  const base = catWeights[category.toLowerCase()] || 6.5;

  const text = `${judul} ${description}`.toLowerCase();
  const emergencyKeywords = [
    "darurat", "korban", "darah", "kebakaran", "roboh", "longsor", "pohon tumbang",
    "kabel putus", "tewas", "luka", "begal", "pembegalan", "meledak", "tenggelam",
    "parah", "bocor gas", "kecelakaan"
  ];
  const highKeywords = ["lubang besar", "macet total", "banjir tinggi", "rusak parah", "bau menyengat", "bocor"];

  let bonus = 0;
  if (emergencyKeywords.some((k) => text.includes(k))) bonus += 1.8;
  if (highKeywords.some((k) => text.includes(k))) bonus += 0.9;
  if (hasImage) bonus += 0.4;
  if (description.length > 50) bonus += 0.3;

  const score = Math.round(Math.min(base + bonus, 9.8) * 10) / 10;
  const isDarurat = score >= 8.8;

  return {
    modelUsed: "Local Intelligent Rules (Offline Fallback)",
    priorityScore: score,
    severity: score,
    confidence: hasImage ? 0.88 : 0.82,
    dampak: isDarurat
      ? "Ancaman langsung terhadap keselamatan warga & ketertiban umum."
      : "Dampak terhadap fasilitas publik dan kenyamanan warga.",
    reasoning: isDarurat
      ? "Laporan memuat kata kunci berisiko tinggi dan membutuhkan penanganan segera."
      : "Skor dihitung otomatis dari bobot risiko kategori dan kelengkapan bukti laporan.",
    sla: isDarurat ? "< 12 jam (Darurat)" : score >= 8 ? "24 jam" : score >= 5.5 ? "48–72 jam" : "5–7 hari",
    isDarurat,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category = "jalan", description = "", judul = "", alamat = "", imageBase64, mimeType } = body;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    console.log("\n=======================================================");
    console.log("🤖 [SIGAP AI ROUTER] INCOMING REPORT FOR AI ANALYSIS");
    console.log("=======================================================");
    console.log(`📌 Judul      : ${judul}`);
    console.log(`📌 Kategori   : ${category}`);
    console.log(`📌 Deskripsi  : ${description}`);
    console.log(`📌 Lokasi     : ${alamat}`);
    console.log(`📷 Foto Bukti : ${imageBase64 ? "Ada (Base64 Image Attached)" : "Tidak Ada"}`);
    console.log(`🔑 Gemini Key : ${geminiKey ? "TERSEDIA ✅" : "KOSONG / BELUM SET ❌"}`);
    console.log(`🔑 OpenAI Key : ${openaiKey ? "TERSEDIA ✅" : "KOSONG / BELUM SET ❌"}`);

    // 1. Try Gemini (Primary)
    if (geminiKey) {
      console.log("🚀 [AI ROUTER] Memproses dengan AI Utama: Google Gemini 1.5 Flash...");
      const geminiResult = await tryGemini(geminiKey, category, description, judul, alamat, imageBase64, mimeType);
      if (geminiResult) {
        console.log("✅ [AI ROUTER] BERHASIL! Diproses oleh Google Gemini 1.5 Flash");
        console.log("📊 AI OUTPUT PAYLOAD:", JSON.stringify(geminiResult, null, 2));
        console.log("=======================================================\n");
        return NextResponse.json({ success: true, data: geminiResult });
      }
      console.warn("⚠️ [AI ROUTER] Google Gemini Gagal/Error. Berpindah ke AI Cadangan 1...");
    }

    // 2. Try OpenAI (Fallback 1)
    if (openaiKey) {
      console.log("🚀 [AI ROUTER] Memproses dengan AI Cadangan 1: OpenAI GPT-4o-mini...");
      const openaiResult = await tryOpenAI(openaiKey, category, description, judul, alamat, imageBase64);
      if (openaiResult) {
        console.log("✅ [AI ROUTER] BERHASIL! Diproses oleh OpenAI GPT-4o-mini");
        console.log("📊 AI OUTPUT PAYLOAD:", JSON.stringify(openaiResult, null, 2));
        console.log("=======================================================\n");
        return NextResponse.json({ success: true, data: openaiResult });
      }
      console.warn("⚠️ [AI ROUTER] OpenAI Gagal/Error. Berpindah ke Offline Fallback Engine...");
    }

    // 3. Fallback to Local Rule Engine (Fallback 2)
    console.log("🚀 [AI ROUTER] Memproses dengan Offline Fallback: Local Intelligent Rules Engine...");
    const localResult = fallbackLocal(category, description, judul, !!imageBase64);
    console.log("✅ [AI ROUTER] BERHASIL! Diproses oleh Local Intelligent Rules Engine");
    console.log("📊 AI OUTPUT PAYLOAD:", JSON.stringify(localResult, null, 2));
    console.log("=======================================================\n");
    return NextResponse.json({ success: true, data: localResult });

  } catch (error) {
    console.error("❌ [AI ROUTER CRITICAL ERROR]:", error);
    const safeFallback = fallbackLocal("jalan", "", "", false);
    return NextResponse.json({ success: true, data: safeFallback });
  }
}
