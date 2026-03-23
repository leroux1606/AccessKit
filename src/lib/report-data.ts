import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { ScanReportData } from "@/components/reports/pdf-template";

/**
 * Build the data object needed for a PDF report from a scan ID.
 */
export async function buildScanReportData(scanId: string): Promise<ScanReportData | null> {
  const scan = await db.scan.findUnique({
    where: { id: scanId },
    include: {
      website: {
        include: { organization: true },
      },
      pages: {
        include: {
          violations: {
            orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { violationCount: "desc" },
      },
    },
  });

  if (!scan || scan.status !== "COMPLETED") return null;

  return {
    websiteName: scan.website.name,
    websiteUrl: scan.website.url,
    organizationName: scan.website.organization.name,
    scanDate: formatDate(scan.completedAt ?? scan.createdAt),
    score: scan.score,
    pagesScanned: scan.pagesScanned,
    totalViolations: scan.totalViolations ?? 0,
    criticalCount: scan.criticalCount ?? 0,
    seriousCount: scan.seriousCount ?? 0,
    moderateCount: scan.moderateCount ?? 0,
    minorCount: scan.minorCount ?? 0,
    duration: scan.duration,
    standards: scan.website.standards,
    pages: scan.pages.map((page) => ({
      url: page.url,
      title: page.title,
      score: page.score,
      violationCount: page.violationCount,
      violations: page.violations.map((v) => ({
        severity: v.severity,
        description: v.description,
        ruleId: v.ruleId,
        wcagCriterion: v.wcagCriterion,
        wcagLevel: v.wcagLevel,
        helpText: v.helpText,
        cssSelector: v.cssSelector,
        fixSuggestion: v.fixSuggestion,
        category: v.category,
      })),
    })),
  };
}
