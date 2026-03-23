import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Globe, Plus, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, scoreToColor } from "@/lib/utils";

export const metadata = { title: "Websites" };

export default async function WebsitesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const websites = await db.website.findMany({
    where: { organizationId: membership.organizationId, isCompetitor: false },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Websites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {websites.length} website{websites.length !== 1 ? "s" : ""} monitored
          </p>
        </div>
        <Button asChild>
          <Link href="/websites/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add website
          </Link>
        </Button>
      </div>

      {websites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">No websites yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Add your first website to start scanning for accessibility issues.
          </p>
          <Button asChild>
            <Link href="/websites/new">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add website
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {websites.map((website) => (
            <Card key={website.id} className="hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/websites/${website.id}`}
                      className="font-semibold text-sm hover:underline underline-offset-4 block truncate"
                    >
                      {website.name}
                    </Link>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline truncate block mt-0.5"
                    >
                      {website.url}
                    </a>
                  </div>
                  {website.currentScore !== null && (
                    <span
                      className={`text-2xl font-bold ml-4 flex-shrink-0 ${scoreToColor(website.currentScore)}`}
                      aria-label={`Score: ${website.currentScore}`}
                    >
                      {website.currentScore}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!website.verified && (
                      <Badge variant="warning" className="text-[10px]">
                        Unverified
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Scanned {formatRelativeTime(website.lastScanAt)}
                    </span>
                  </div>

                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/websites/${website.id}`}>
                      <Scan className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
