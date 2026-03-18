"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { getPlanLimits } from "@/lib/plans";
import type { ScanEventData } from "@/types/scan";

export async function triggerScan(websiteId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const website = await db.website.findUnique({
    where: { id: websiteId, organizationId: membership.organizationId },
  });
  if (!website) throw new Error("Website not found");

  // Check if there's already a scan in progress
  const runningScan = await db.scan.findFirst({
    where: { websiteId, status: { in: ["QUEUED", "RUNNING"] } },
  });
  if (runningScan) {
    redirect(`/websites/${websiteId}/scans/${runningScan.id}`);
  }

  const limits = getPlanLimits(membership.organization.plan);
  const pageLimit = isFinite(limits.pagesPerScan) ? limits.pagesPerScan : 1000;

  // Create scan record in QUEUED state
  const scan = await db.scan.create({
    data: {
      websiteId,
      status: "QUEUED",
      pageLimit,
      triggeredBy: "MANUAL",
    },
  });

  // Fire Inngest event
  const eventData: ScanEventData = {
    scanId: scan.id,
    websiteId,
    organizationId: membership.organizationId,
    websiteUrl: website.url,
    pageLimit,
    standards: website.standards,
  };

  await inngest.send({
    name: "scan/website.requested",
    data: eventData,
  });

  redirect(`/websites/${websiteId}/scans/${scan.id}`);
}
