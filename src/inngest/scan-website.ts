import { inngest } from "./client";
import { db } from "@/lib/db";
import { runScan } from "@/scanner";
import type { ScanEventData } from "@/types/scan";

export const scanWebsiteJob = inngest.createFunction(
  {
    id: "scan-website",
    name: "Scan Website",
    triggers: [{ event: "scan/website.requested" }],
    concurrency: { limit: 3 },
    retries: 2,
  },
  async ({ event, step }) => {
    const { scanId, websiteId, websiteUrl, pageLimit, standards } = event.data as ScanEventData;

    // Step 1: Mark scan as RUNNING
    await step.run("mark-running", async () => {
      await db.scan.update({
        where: { id: scanId },
        data: { status: "RUNNING", startedAt: new Date() },
      });
    });

    // Step 2: Run the full scan (crawl + axe-core)
    const result = await step.run("run-scan", async () => {
      try {
        return await runScan(websiteUrl, pageLimit, standards);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.scan.update({
          where: { id: scanId },
          data: {
            status: "FAILED",
            errorMessage: message,
            completedAt: new Date(),
          },
        });
        throw err;
      }
    });

    // Step 3: Persist results to DB
    await step.run("save-results", async () => {
      const now = new Date();

      await db.$transaction(async (tx) => {
        for (const pageResult of result.pages) {
          const page = await tx.page.create({
            data: {
              scanId,
              url: pageResult.url,
              title: pageResult.title || pageResult.url,
              score: pageResult.score,
              violationCount: pageResult.violations.length,
              loadTime: pageResult.loadTime,
            },
          });

          for (const v of pageResult.violations) {
            // Carry forward firstDetectedAt and workflow state from previous scan
            const existing = await tx.violation.findFirst({
              where: { websiteId, fingerprint: v.fingerprint },
              orderBy: { firstDetectedAt: "asc" },
            });

            await tx.violation.create({
              data: {
                scanId,
                pageId: page.id,
                websiteId,
                ruleId: v.ruleId,
                engine: v.engine,
                severity: v.severity,
                impact: v.impact,
                category: v.category,
                standards: v.standards,
                wcagCriterion: v.wcagCriterion,
                wcagLevel: v.wcagLevel,
                description: v.description,
                helpText: v.helpText,
                helpUrl: v.helpUrl,
                htmlElement: v.htmlElement,
                cssSelector: v.cssSelector,
                xpath: v.xpath,
                fixSuggestion: v.fixSuggestion,
                effortEstimate: v.effortEstimate,
                fingerprint: v.fingerprint,
                firstDetectedAt: existing?.firstDetectedAt ?? now,
                status: existing?.status ?? "OPEN",
                assignedToId: existing?.assignedToId ?? null,
              },
            });
          }
        }

        await tx.scan.update({
          where: { id: scanId },
          data: {
            status: "COMPLETED",
            score: result.score,
            pagesScanned: result.pages.length,
            totalViolations: result.totalViolations,
            criticalCount: result.criticalCount,
            seriousCount: result.seriousCount,
            moderateCount: result.moderateCount,
            minorCount: result.minorCount,
            duration: result.duration,
            completedAt: now,
          },
        });

        await tx.website.update({
          where: { id: websiteId },
          data: {
            currentScore: result.score,
            lastScanAt: now,
          },
        });
      });
    });

    return {
      scanId,
      score: result.score,
      totalViolations: result.totalViolations,
      pagesScanned: result.pages.length,
    };
  },
);
