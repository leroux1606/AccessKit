import { inngest } from "./client";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import type { ScanEventData } from "@/types/scan";

function calculateNextRunAt(
  frequency: string,
  scheduledHour: number,
  scheduledDay: number | null,
): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(scheduledHour);

  if (frequency === "DAILY") {
    next.setUTCDate(next.getUTCDate() + 1);
  } else if (frequency === "WEEKLY") {
    const target = scheduledDay ?? 1;
    let diff = (target - next.getUTCDay() + 7) % 7;
    if (diff === 0) diff = 7;
    next.setUTCDate(next.getUTCDate() + diff);
  } else if (frequency === "MONTHLY") {
    const target = scheduledDay ?? 1;
    next.setUTCDate(target);
    next.setUTCMonth(next.getUTCMonth() + 1);
  }

  return next;
}

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

        // Update schedule: set lastRunAt + calculate next occurrence from stored day/hour
        await db.scanSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: calculateNextRunAt(
              schedule.frequency,
              schedule.scheduledHour,
              schedule.scheduledDay,
            ),
          },
        });

        triggered++;
      });
    }

    return { triggered };
  },
);
