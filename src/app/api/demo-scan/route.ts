import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter for demo scans
const recentScans = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3;

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * POST /api/demo-scan — run a quick single-page scan for the landing page demo.
 * Limited to 1 page, no auth required, rate limited.
 */
export async function POST(req: NextRequest) {
  const ip = getRateLimitKey(req);
  const now = Date.now();

  // Clean old entries
  for (const [key, time] of recentScans) {
    if (now - time > RATE_LIMIT_WINDOW) recentScans.delete(key);
  }

  const recentCount = [...recentScans.entries()].filter(
    ([key]) => key.startsWith(ip + ":"),
  ).length;
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  }
  recentScans.set(`${ip}:${now}`, now);

  const body = await req.json();
  const { url } = body as { url?: string };

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Validate and normalize URL
  let normalizedUrl: string;
  try {
    normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(normalizedUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Dynamic import to keep the demo endpoint light
    const { runScan } = await import("@/scanner");
    const result = await runScan(normalizedUrl, 1, []);

    const page = result.pages[0];
    const topIssues = page?.violations.slice(0, 5).map((v) => ({
      severity: v.severity,
      description: v.description,
      ruleId: v.ruleId,
      wcagCriterion: v.wcagCriterion,
      fixSuggestion: v.fixSuggestion,
    })) ?? [];

    return NextResponse.json({
      url: normalizedUrl,
      score: result.score,
      totalViolations: result.totalViolations,
      criticalCount: result.criticalCount,
      seriousCount: result.seriousCount,
      moderateCount: result.moderateCount,
      minorCount: result.minorCount,
      topIssues,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
