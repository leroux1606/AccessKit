import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Client Portals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          White-label portals for your clients to view their accessibility progress
        </p>
      </div>

      {!isAgencyOrHigher ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center space-y-3">
            <ExternalLink className="h-8 w-8 mx-auto text-orange-500" aria-hidden="true" />
            <p className="font-medium">Client portals require Agency plan or higher</p>
            <p className="text-sm text-muted-foreground">
              Create branded portals for each client with their own login, score tracking, and issue visibility.
            </p>
            <Button asChild>
              <Link href="/settings/billing">Upgrade to Agency</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Client portal management coming soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
