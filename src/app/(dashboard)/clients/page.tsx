import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalManager } from "@/components/dashboard/portal-manager";

export const metadata = { title: "Client Portals" };

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const isAgencyOrHigher = ["AGENCY", "ENTERPRISE"].includes(membership.organization.plan);

  if (!isAgencyOrHigher) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Portals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            White-label portals for your clients to view their accessibility progress
          </p>
        </div>
        <Card className="border-orange-500/20 bg-orange-500/10">
          <CardContent className="p-6 text-center space-y-3">
            <ExternalLink className="h-8 w-8 mx-auto text-orange-400" aria-hidden="true" />
            <p className="font-medium">Client portals require Agency plan or higher</p>
            <p className="text-sm text-muted-foreground">
              Create branded portals for each client with their own login, score tracking, and issue visibility.
            </p>
            <Button asChild>
              <Link href="/settings/billing">Upgrade to Agency</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [portals, websites] = await Promise.all([
    db.clientPortal.findMany({
      where: { organizationId: membership.organizationId },
      include: {
        website: { select: { name: true, url: true, currentScore: true, lastScanAt: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.website.findMany({
      where: { organizationId: membership.organizationId, isCompetitor: false },
      select: { id: true, name: true, url: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Client Portals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Branded portals for clients to view their accessibility progress
        </p>
      </div>

      <PortalManager
        portals={portals.map((p) => ({
          id: p.id,
          slug: p.slug,
          companyName: p.companyName,
          enabled: p.enabled,
          website: {
            name: p.website.name,
            url: p.website.url,
            currentScore: p.website.currentScore,
            lastScanAt: p.website.lastScanAt?.toISOString() ?? null,
          },
        }))}
        websites={websites}
        baseUrl={baseUrl}
      />
    </div>
  );
}
