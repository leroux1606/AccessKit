import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Globe, Plus, AlertTriangle, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, scoreToColor } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) redirect("/login");

  const org = membership.organization;

  const [websites, recentScans, openViolationsCount] = await Promise.all([
    db.website.findMany({
      where: { organizationId: org.id, isCompetitor: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        url: true,
        currentScore: true,
        lastScanAt: true,
        verified: true,
      },
    }),
    db.scan.findMany({
      where: {
        website: { organizationId: org.id },
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, score: true, createdAt: true, website: { select: { name: true } } },
    }),
    db.violation.count({
      where: {
        website: { organizationId: org.id },
        status: "OPEN",
      },
    }),
  ]);

  const websiteCount = websites.length;
  const hasWebsites = websiteCount > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back to {org.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/websites/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add website
          </Link>
        </Button>
      </div>

      {/* Trial banner */}
      {org.subscriptionStatus === "TRIALING" && org.trialEndsAt && (
        <div
          role="status"
          className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
            <span>
              Your free trial ends on{" "}
              <strong>
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  day: "numeric",
                }).format(new Date(org.trialEndsAt))}
              </strong>
              . All features are available during the trial.
            </span>
          </div>
          <Button size="sm" asChild>
            <Link href="/settings/billing">Upgrade now</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      {hasWebsites ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Websites monitored</CardDescription>
                <CardTitle className="text-3xl">{websiteCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Open issues</CardDescription>
                <CardTitle className="text-3xl text-destructive">{openViolationsCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recent scans</CardDescription>
                <CardTitle className="text-3xl">{recentScans.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Website list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Your websites</CardTitle>
                  <CardDescription>Latest scan scores</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/websites">View all</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y">
                {websites.map((website) => (
                  <li key={website.id}>
                    <Link
                      href={`/websites/${website.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{website.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{website.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        {website.currentScore !== null ? (
                          <span
                            className={`text-lg font-bold ${scoreToColor(website.currentScore)}`}
                            aria-label={`Accessibility score: ${website.currentScore}`}
                          >
                            {website.currentScore}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {formatRelativeTime(website.lastScanAt)}
                        </span>
                        {!website.verified && (
                          <Badge variant="warning" className="text-[10px]">
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6"
            aria-hidden="true"
          >
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Add your first website</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Connect a website to start scanning for accessibility issues. AccessKit will detect
            violations, prioritize fixes, and track your progress over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/websites/new">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add your first website
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="https://accesskit.app/docs/getting-started" target="_blank" rel="noopener noreferrer">
                Read the docs
              </a>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 text-left max-w-2xl w-full">
            {[
              {
                icon: AlertTriangle,
                title: "Find issues",
                desc: "Detect WCAG, Section 508, and EN 301 549 violations automatically.",
              },
              {
                icon: CheckCircle2,
                title: "Get fixes",
                desc: "Copy-paste code fixes for every issue, powered by axe-core and Claude AI.",
              },
              {
                icon: TrendingUp,
                title: "Track progress",
                desc: "Monitor your accessibility score over time as you make improvements.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
