import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface IssuesPageProps {
  params: Promise<{ websiteId: string }>;
  searchParams: Promise<{ status?: string; severity?: string }>;
}

export async function generateMetadata({ params }: IssuesPageProps) {
  const { websiteId } = await params;
  const website = await db.website.findUnique({ where: { id: websiteId } });
  return { title: `Issues — ${website?.name ?? "Website"}` };
}

export default async function WebsiteIssuesPage({ params, searchParams }: IssuesPageProps) {
  const { websiteId } = await params;
  const filters = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({ where: { userId: session.user.id } });
  if (!membership) redirect("/login");

  const website = await db.website.findUnique({
    where: { id: websiteId, organizationId: membership.organizationId },
  });
  if (!website) notFound();

  const statusFilter = filters.status as string | undefined;
  const severityFilter = filters.severity as string | undefined;

  const violations = await db.violation.findMany({
    where: {
      websiteId,
      ...(statusFilter ? { status: statusFilter as never } : { status: { in: ["OPEN", "IN_PROGRESS"] } }),
      ...(severityFilter ? { severity: severityFilter as never } : {}),
    },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { page: true, assignedTo: true },
  });

  const severityCounts = await db.violation.groupBy({
    by: ["severity"],
    where: { websiteId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    _count: { id: true },
  });

  const countBySeverity = Object.fromEntries(
    severityCounts.map((s) => [s.severity, s._count.id])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/websites/${websiteId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            {website.name}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
        <p className="text-sm text-muted-foreground">{violations.length} issue{violations.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Severity summary */}
      <div className="flex flex-wrap gap-2">
        {(["CRITICAL", "SERIOUS", "MODERATE", "MINOR"] as const).map((sev) => {
          const count = countBySeverity[sev] ?? 0;
          if (count === 0) return null;
          return (
            <Link
              key={sev}
              href={`/websites/${websiteId}/issues?severity=${sev}`}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            >
              <Badge
                variant={
                  sev === "CRITICAL"
                    ? "critical"
                    : sev === "SERIOUS"
                    ? "serious"
                    : sev === "MODERATE"
                    ? "moderate"
                    : "minor"
                }
                className="cursor-pointer hover:opacity-80"
              >
                {count} {sev.toLowerCase()}
              </Badge>
            </Link>
          );
        })}
        {(statusFilter || severityFilter) && (
          <Link
            href={`/websites/${websiteId}/issues`}
            className="text-xs text-muted-foreground hover:underline self-center"
          >
            Clear filters
          </Link>
        )}
      </div>

      {violations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="text-sm">
            {statusFilter || severityFilter ? "No issues match your filters." : "No open issues. Great work!"}
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm" aria-label="Website accessibility issues">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="text-left px-6 py-3 font-medium">Issue</th>
                  <th scope="col" className="text-left px-6 py-3 font-medium">Severity</th>
                  <th scope="col" className="text-left px-6 py-3 font-medium hidden md:table-cell">Category</th>
                  <th scope="col" className="text-left px-6 py-3 font-medium hidden lg:table-cell">Page</th>
                  <th scope="col" className="text-left px-6 py-3 font-medium hidden md:table-cell">Detected</th>
                  <th scope="col" className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {violations.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 max-w-xs">
                      <p className="font-medium truncate">{v.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.ruleId}</p>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          v.severity === "CRITICAL"
                            ? "critical"
                            : v.severity === "SERIOUS"
                            ? "serious"
                            : v.severity === "MODERATE"
                            ? "moderate"
                            : "minor"
                        }
                      >
                        {v.severity.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell text-xs text-muted-foreground capitalize">
                      {v.category.toLowerCase().replace("_", " ")}
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <a
                        href={v.page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:underline max-w-[160px] truncate block"
                        title={v.page.url}
                      >
                        {new URL(v.page.url).pathname || "/"}
                      </a>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell text-xs text-muted-foreground">
                      {formatRelativeTime(v.firstDetectedAt)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={v.status === "OPEN" ? "destructive" : "warning"}>
                        {v.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
