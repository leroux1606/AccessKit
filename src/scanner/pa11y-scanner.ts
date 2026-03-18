/**
 * pa11y secondary scanning engine.
 * Phase 3 stub — pa11y runs its own Chromium instance via puppeteer.
 * Will be wired up in a later iteration to merge results with axe-core.
 */
export async function scanPageWithPa11y(
  _url: string,
): Promise<[]> {
  // TODO: npm install pa11y, then:
  // const pa11y = await import("pa11y");
  // const results = await pa11y(_url, { standard: "WCAG2AA" });
  // Map pa11y results → ScanViolation[] and merge with axe results
  return [];
}
