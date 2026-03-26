import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CompetitorManager } from "@/components/dashboard/competitor-manager";
import { ComparisonChart } from "@/components/dashboard/comparison-chart";

export const metadata = { title: "Competitive Benchmarking" };

export default async function BenchmarkingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const org = membership.organization;
  const limits = getPlanLimits(org.plan);

  if (!limits.hasBenchmarking) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitive Benchmarking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Compare your accessibility scores against competitors
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold mb-2">Agency Plan Required</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Competitive benchmarking lets you scan competitor websites and compare accessibility
              scores side-by-side. Upgrade to Agency or Enterprise to unlock this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch own websites and competitors
  const [ownWebsites, competitors] = await Promise.all([
    db.website.findMany({
      where: { organizationId: org.id, isCompetitor: false },
      select: { id: true, name: true, url: true, currentScore: true, lastScanAt: true },
      orderBy: { name: "asc" },
    }),
    db.website.findMany({
      where: { organizationId: org.id, isCompetitor: true },
      select: { id: true, name: true, url: true, currentScore: true, lastScanAt: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const competitorLimit = limits.competitorScans;
  const canAddMore = competitors.length < competitorLimit;

  // Average scores
  const ownScores = ownWebsites.filter((w) => w.currentScore !== null).map((w) => w.currentScore!);
  const compScores = competitors.filter((w) => w.currentScore !== null).map((w) => w.currentScore!);
  const avgOwn = ownScores.length > 0 ? Math.round(ownScores.reduce((a, b) => a + b, 0) / ownScores.length) : null;
  const avgComp = compScores.length > 0 ? Math.round(compScores.reduce((a, b) => a + b, 0) / compScores.length) : null;
  const scoreDiff = avgOwn !== null && avgComp !== null ? avgOwn - avgComp : null;

  // Prepare chart data
  const chartData = [
    ...ownWebsites
      .filter((w) => w.currentScore !== null)
      .map((w) => ({ name: w.name, score: w.currentScore!, type: "own" as const })),
    ...competitors
      .filter((w) => w.currentScore !== null)
      .map((w) => ({ name: w.name, score: w.currentScore!, type: "competitor" as const })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Competitive Benchmarking</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Compare your accessibility scores against competitors
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Your Average Score</p>
            <p className="text-3xl font-bold mt-1">
              {avgOwn !== null ? `${avgOwn}/100` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {ownScores.length} website{ownScores.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Competitor Average</p>
            <p className="text-3xl font-bold mt-1">
              {avgComp !== null ? `${avgComp}/100` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Across {compScores.length} competitor{compScores.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Your Advantage</p>
            <div className="flex items-center gap-2 mt-1">
              {scoreDiff !== null ? (
                <>
                  {scoreDiff > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  ) : scoreDiff < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-muted-foreground" />
                  )}
                  <p className={`text-3xl font-bold ${
                    scoreDiff > 0 ? "text-green-400" : scoreDiff < 0 ? "text-red-400" : ""
                  }`}>
                    {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold">—</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Points vs competitors</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Website scores table */}
      {(ownWebsites.length > 0 || competitors.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Websites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Website</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ownWebsites, ...competitors]
                    .sort((a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0))
                    .map((w) => {
                      const isCompetitor = competitors.some((c) => c.id === w.id);
                      return (
                        <tr key={w.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2.5 px-3">
                            <p className="font-medium">{w.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{w.url}</p>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={isCompetitor ? "secondary" : "default"}>
                              {isCompetitor ? "Competitor" : "Your site"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {w.currentScore !== null ? (
                              <span className={`font-bold ${
                                w.currentScore >= 90
                                  ? "text-green-400"
                                  : w.currentScore >= 70
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}>
                                {w.currentScore}/100
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not scanned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitor management */}
      <CompetitorManager
        organizationId={org.id}
        competitors={competitors}
        competitorLimit={competitorLimit}
        canAddMore={canAddMore}
      />
    </div>
  );
}
