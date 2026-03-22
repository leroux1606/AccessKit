import { chromium } from "playwright";
import type { ScanResult } from "@/types/scan";
import { crawlWebsite } from "./crawler";
import { scanPageWithAxe } from "./axe-scanner";
import { addPageScores, calculateScore } from "./scorer";

export async function runScan(
  websiteUrl: string,
  pageLimit: number,
  standards: string[],
): Promise<ScanResult> {
  const startTime = Date.now();
  const websiteOrigin = new URL(websiteUrl).origin;

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Discover pages to scan
    const urls = await crawlWebsite(websiteUrl, pageLimit, browser);

    // 2. Scan each page with axe-core (max 3 concurrent to balance speed vs. memory)
    const CONCURRENCY = 3;
    const rawPages = [];
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const batch = urls.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((url) => scanPageWithAxe(browser, url, websiteOrigin, standards)),
      );
      rawPages.push(...results);
    }

    // 3. Add per-page scores
    const pages = addPageScores(rawPages);

    // 4. Aggregate violation counts
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    for (const page of pages) {
      for (const v of page.violations) {
        if (v.severity === "CRITICAL") criticalCount++;
        else if (v.severity === "SERIOUS") seriousCount++;
        else if (v.severity === "MODERATE") moderateCount++;
        else if (v.severity === "MINOR") minorCount++;
      }
    }

    const totalViolations = criticalCount + seriousCount + moderateCount + minorCount;
    const score = calculateScore(criticalCount, seriousCount, moderateCount, minorCount);
    const duration = Date.now() - startTime;

    return {
      pages,
      totalViolations,
      criticalCount,
      seriousCount,
      moderateCount,
      minorCount,
      score,
      duration,
    };
  } finally {
    await browser.close();
  }
}
