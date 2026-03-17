import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_NAMES, PLAN_PRICES, getPlanLimits } from "@/lib/plans";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const org = membership.organization;
  const limits = getPlanLimits(org.plan);
  const [websiteCount, teamCount] = await Promise.all([
    db.website.count({ where: { organizationId: org.id, isCompetitor: false } }),
    db.membership.count({ where: { organizationId: org.id } }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Settings
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your subscription</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Current plan</CardTitle>
              <CardDescription>
                {org.subscriptionStatus === "TRIALING"
                  ? `Free trial — ends ${org.trialEndsAt ? formatDate(org.trialEndsAt) : "soon"}`
                  : org.subscriptionStatus}
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm px-3 py-1">
              {PLAN_NAMES[org.plan]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              {
                label: "Websites",
                used: websiteCount,
                limit: limits.websites === Infinity ? "∞" : limits.websites,
              },
              {
                label: "Team seats",
                used: teamCount,
                limit: limits.teamSeats === Infinity ? "∞" : limits.teamSeats,
              },
              {
                label: "Pages/scan",
                used: null,
                limit: limits.pagesPerScan === Infinity ? "∞" : limits.pagesPerScan,
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">
                  {stat.used !== null ? `${stat.used} / ` : "Up to "}
                  {stat.limit}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade prompt */}
      {org.plan !== "ENTERPRISE" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Upgrade your plan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get more websites, daily scans, white-label reports, client portals, and AI-powered fixes.
            </p>
            <Button disabled>
              Manage billing (Stripe integration coming soon)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
