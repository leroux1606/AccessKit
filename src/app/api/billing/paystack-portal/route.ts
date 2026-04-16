import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSubscriptionLink } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
    include: { organization: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "No admin access" }, { status: 403 });
  }

  const org = membership.organization;

  if (!org.paystackSubscriptionCode) {
    return NextResponse.json(
      { error: "No PayStack subscription found. Please subscribe to a plan first." },
      { status: 400 }
    );
  }

  try {
    const { link } = await generateSubscriptionLink(org.paystackSubscriptionCode);
    return NextResponse.json({ url: link });
  } catch (err) {
    console.error("[PayStack Portal] Error:", err);
    return NextResponse.json({ error: "Failed to get management link" }, { status: 500 });
  }
}
