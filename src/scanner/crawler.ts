import type { Browser } from "playwright";
import { assertSafeFetchUrl } from "@/lib/ssrf-guard";

// Extracts URLs from a sitemap.xml string using regex (avoids XML parser dep)
export function parseSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1];
    if (url) urls.push(url.trim());
  }
  return urls;
}

// Check if robots.txt disallows crawling a path
export function isAllowedByRobots(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split("\n");
  let inUserAgentAll = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("user-agent:")) {
      const agent = trimmed.split(":")[1]?.trim();
      inUserAgentAll = agent === "*";
    }
    if (inUserAgentAll && trimmed.toLowerCase().startsWith("disallow:")) {
      const disallowed = trimmed.split(":")[1]?.trim();
      if (disallowed && path.startsWith(disallowed)) return false;
    }
  }
  return true;
}

export function normalizeUrl(url: string, origin: string): string | null {
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return null; // external link
    parsed.hash = ""; // remove fragments
    // Remove trailing slash except for root
    const href = parsed.pathname !== "/"
      ? parsed.href.replace(/\/$/, "")
      : parsed.href;
    return href;
  } catch {
    return null;
  }
}

async function fetchSitemapUrls(websiteUrl: string): Promise<string[]> {
  const origin = new URL(websiteUrl).origin;
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap/index.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "AccessKit-Scanner/1.0" },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const urls = parseSitemapUrls(xml);
      if (urls.length > 0) {
        return urls.filter((u) => normalizeUrl(u, origin) !== null);
      }
    } catch {
      // try next sitemap URL
    }
  }
  return [];
}

async function crawlFromHomepage(
  websiteUrl: string,
  browser: Browser,
  limit: number,
): Promise<string[]> {
  const origin = new URL(websiteUrl).origin;
  const visited = new Set<string>();
  const discovered = new Set<string>();

  const page = await browser.newPage();
  try {
    await page.goto(websiteUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    const hrefs = await page.$$eval("a[href]", (links) =>
      links.map((a) => (a as HTMLAnchorElement).href),
    );

    for (const href of hrefs) {
      const normalized = normalizeUrl(href, origin);
      if (normalized && !visited.has(normalized)) {
        discovered.add(normalized);
      }
    }
  } catch {
    // If homepage fails, at least scan the homepage itself
  } finally {
    await page.close();
  }

  // Always include the homepage
  const homepageNorm = normalizeUrl(websiteUrl, origin);
  if (homepageNorm) visited.add(homepageNorm);

  const urls = [
    ...(homepageNorm ? [homepageNorm] : [websiteUrl]),
    ...Array.from(discovered).slice(0, limit - 1),
  ];
  return urls.slice(0, limit);
}

export async function crawlWebsite(
  websiteUrl: string,
  pageLimit: number,
  browser: Browser,
): Promise<string[]> {
  // Re-validate before any outbound fetch — guards against DNS rebinding
  // between when the website was added and when the scan actually runs.
  await assertSafeFetchUrl(websiteUrl);

  const origin = new URL(websiteUrl).origin;

  // Check robots.txt
  let robotsTxt = "";
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "AccessKit-Scanner/1.0" },
    });
    if (res.ok) robotsTxt = await res.text();
  } catch {
    // robots.txt is optional
  }

  // Try sitemap first
  let urls = await fetchSitemapUrls(websiteUrl);

  if (urls.length === 0) {
    // Fall back to crawling from homepage
    urls = await crawlFromHomepage(websiteUrl, browser, pageLimit);
  } else {
    // Filter by robots.txt and normalize
    const homepageNorm = normalizeUrl(websiteUrl, origin);
    const sitemapNorm = urls
      .map((u) => normalizeUrl(u, origin))
      .filter((u): u is string => u !== null)
      .filter((u) => {
        try {
          const path = new URL(u).pathname;
          return isAllowedByRobots(robotsTxt, path);
        } catch {
          return false;
        }
      });

    // Ensure homepage is first, deduplicate, limit
    const ordered = new Set<string>();
    if (homepageNorm) ordered.add(homepageNorm);
    for (const u of sitemapNorm) {
      if (ordered.size >= pageLimit) break;
      ordered.add(u);
    }
    urls = Array.from(ordered);
  }

  return urls.slice(0, pageLimit);
}
