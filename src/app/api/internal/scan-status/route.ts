import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scanId = request.nextUrl.searchParams.get("scanId");
  if (!scanId) {
    return NextResponse.json({ error: "Missing scanId" }, { status: 400 });
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json({ error: "No membership" }, { status: 403 });
  }

  const scan = await db.scan.findFirst({
    where: {
      id: scanId,
      website: { organizationId: membership.organizationId },
    },
    select: { status: true },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({ status: scan.status });
}
