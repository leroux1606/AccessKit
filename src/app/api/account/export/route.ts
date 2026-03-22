import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GDPR Article 15 & 20 — Right of access and data portability.
 * Returns all personal data held for the authenticated user as JSON.
 * GET /api/account/export
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, memberships, accounts] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.membership.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            createdAt: true,
            websites: {
              select: {
                id: true,
                name: true,
                url: true,
                currentScore: true,
                lastScanAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    db.account.findMany({
      where: { userId },
      select: {
        provider: true,
        providerAccountId: true,
        type: true,
      },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    linkedAccounts: accounts,
    memberships: memberships.map((m) => ({
      role: m.role,
      joinedAt: m.createdAt,
      organization: m.organization,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="accesskit-export-${userId}.json"`,
    },
  });
}
