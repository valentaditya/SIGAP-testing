import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ibhfzlqwlluguyouiebz.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_UFLelgTc0DER8vrBQN1u9Q_-lfz7NEN";

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    supabaseUrl,
  };

  try {
    // 1. Ping Auth service (GoTrue)
    const authStart = Date.now();
    const authRes = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
      cache: "no-store",
    });
    const authDuration = Date.now() - authStart;
    results.auth = {
      status: authRes.status,
      statusText: authRes.statusText,
      durationMs: authDuration,
      ok: authRes.ok,
    };

    // 2. Ping PostgREST API
    const restStart = Date.now();
    const restRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    });
    const restDuration = Date.now() - restStart;
    results.rest = {
      status: restRes.status,
      statusText: restRes.statusText,
      durationMs: restDuration,
      ok: restRes.status < 500, // Reaching PostgREST resets the inactivity timer
    };

    const totalDuration = Date.now() - startTime;
    results.totalDurationMs = totalDuration;
    results.message = "Supabase keep-alive ping successful! Activity recorded.";

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to ping Supabase",
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
