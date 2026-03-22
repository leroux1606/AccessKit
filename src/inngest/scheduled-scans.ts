import { inngest } from "./client";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import type { ScanEventData } from "@/types/scan";

const FREQUENCY_MS = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  MANUAL: 0,
} as const;

/**
 * Inngest cron job — runs every 15 minutes, checks for websites
 * whose scheduled scan time has arrived, and fires scan events.
 *
 * Phase 8: Automation & Monitoring
 */
export const scheduledScansJob = inngest.createFunction(
  {
    id: "scheduled-scans",
    name: "Trigger Scheduled Scans",
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step }) => {
    // Find all enabled schedules that are due
    const dueSchedules = await step.run("find-due-schedules", async () => {
      return db.scanSchedule.findMany({
        where: {
          enabled: true,
          nextRunAt: { lte: new Date() },
          website: { verified: true },
        },
        include: {
          website: {
            include: { organization: true },
          },
        },
      });
    });

    if (dueSchedules.length === 0) return { triggered: 0 };

    let triggered = 0;

    for (const schedule of dueSchedules) {
      await step.run(`trigger-scan-${schedule.websiteId}`, async () => {
        const website = schedule.website;

        // Skip if there's already an active scan
        const activeScans = await db.scan.count({
          where: {
            websiteId: website.id,
            status: { in: ["QUEUED", "RUNNING"] },
          },
        });
        if (activeScans > 0) return;

        const limits = getPlanLimits(website.organization.plan);
        const pageLimit = isFinite(limits.pagesPerScan) ? limits.pagesPerScan : 1000;

        // Create the scan record
        const scan = await db.scan.create({
          data: {
            websiteId: website.id,
            status: "QUEUED",
            pageLimit,
            triggeredBy: "SCHEDULED",
          },
        });

        // Fire the scan event
        const eventData: ScanEventData = {
          scanId: scan.id,
          websiteId: website.id,
          organizationId: website.organizationId,
          websiteUrl: website.url,
          pageLimit,
          standards: website.standards,
        };

        await inngest.send({ name: "scan/website.requested", data: eventData });

        // Update schedule: set lastRunAt + calculate nextRunAt
        const freq = schedule.frequency as keyof typeof FREQUENCY_MS;
        const intervalMs = FREQUENCY_MS[freq] ?? FREQUENCY_MS.WEEKLY;
        await db.scanSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: new Date(Date.now() + intervalMs),
          },
        });

        triggered++;
      });
    }

    return { triggered };
  },
);
