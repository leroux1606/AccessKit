import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowLeft, ExternalLink, Globe, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatRelativeTime, scoreToColor } from "@/lib/utils";

interface WebsitePageProps {
  params: Promise<{ websiteId: string }>;
}

export async function generateMetadata({ params }: WebsitePageProps) {
  const { websiteId } = await params;
  const website = await db.website.findUnique({ where: { id: websiteId } });
  return { title: website?.name ?? "Website" };
}

export default async function WebsitePage({ params }: WebsitePageProps) {
  const { websiteId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) redirect("/login");

  const website = await db.website.findUnique({
    where: { id: websiteId, organizationId: membership.organizationId },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!website) notFound();

  const openIssues = await db.violation.count({
    where: { websiteId, status: "OPEN" },
  });

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/websites">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Websites
          </Link>
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{website.name}</h1>
              {website.verified ? (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {website.url}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/websites/${websiteId}/settings`}>Settings</Link>
            </Button>
            <Button size="sm" disabled>
              Scan now
              <span className="sr-only"> (scanning engine coming in Phase 3)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Accessibility score</CardDescription>
            <CardTitle
              className={`text-4xl ${scoreToColor(website.currentScore)}`}
              aria-label={
                website.currentScore !== null
                  ? `Accessibility score: ${website.currentScore} out of 100`
                  : "No scans yet"
              }
            >
              {website.currentScore ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open issues</CardDescription>
            <CardTitle className="text-4xl text-destructive">{openIssues}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last scanned</CardDescription>
            <CardTitle className="text-lg">
              {website.lastScanAt ? formatRelativeTime(website.lastScanAt) : "Never"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Verification prompt */}
      {!website.verified && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium text-sm">Verify website ownership</p>
                <p className="text-xs text-muted-foreground">
                  Verify that you own this website to enable scanning and receive full results.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/websites/${websiteId}/settings`}>Verify ownership</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent scans</CardTitle>
          <CardDescription>Click on a scan to see the full results</CardDescription>
        </CardHeader>
        <CardContent>
          {website.scans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
              <p className="text-sm">No scans yet. Start your first scan to see results.</p>
            </div>
          ) : (
            <ul role="list" className="divide-y -mx-6">
              {website.scans.map((scan) => (
                <li key={scan.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {scan.status === "COMPLETED"
                        ? `Score: ${scan.score ?? "—"}`
                        : scan.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(scan.createdAt)} · {scan.pagesScanned} page
                      {scan.pagesScanned !== 1 ? "s" : ""} scanned
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {scan.totalViolations !== null && (
                      <span className="text-sm text-muted-foreground">
                        {scan.totalViolations} issue{scan.totalViolations !== 1 ? "s" : ""}
                      </span>
                    )}
                    <Badge
                      variant={
                        scan.status === "COMPLETED"
                          ? "success"
                          : scan.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {scan.status.toLowerCase()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
