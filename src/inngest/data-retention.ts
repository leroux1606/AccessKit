import { inngest } from "./client";
import { db } from "@/lib/db";

/**
 * GDPR Article 5(1)(e) — storage limitation.
 *
 * Runs weekly (Sunday 03:00 UTC) and deletes scan records (and their
 * cascade-linked pages, violations, and comments) that are older than
 * 12 months and in a terminal state (COMPLETED or FAILED).
 *
 * Active/in-progress scans are never deleted.
 */
export const dataRetentionJob = inngest.createFunction(
  {
    id: "data-retention",
    name: "Data Retention Cleanup",
    triggers: [{ cron: "0 3 * * 0" }],
  },
  async ({ step, logger }) => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);

    const deleted = await step.run("delete-old-scans", async () => {
      const result = await db.scan.deleteMany({
        where: {
          createdAt: { lt: cutoff },
          status: { in: ["COMPLETED", "FAILED"] },
        },
      });
      return result.count;
    });

    logger.info(`Data retention: deleted ${deleted} scans older than 12 months`);
    return { deletedScans: deleted, cutoff: cutoff.toISOString() };
  },
);
