import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Issues" };

export default async function IssuesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) redirect("/login");

  const violations = await db.violation.findMany({
    where: { website: { organizationId: membership.organizationId }, status: "OPEN" },
    orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
    take: 50,
    include: { website: true, page: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {violations.length} open issue{violations.length !== 1 ? "s" : ""} across all websites
        </p>
      </div>

      {violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4 opacity-40" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">No open issues</h2>
          <p className="text-sm text-muted-foreground">
            Run a scan on one of your websites to detect accessibility issues.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm" role="table" aria-label="Open accessibility issues">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="text-left px-4 py-3 font-medium">Issue</th>
                <th scope="col" className="text-left px-4 py-3 font-medium hidden md:table-cell">Website</th>
                <th scope="col" className="text-left px-4 py-3 font-medium">Severity</th>
                <th scope="col" className="text-left px-4 py-3 font-medium hidden lg:table-cell">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {violations.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm truncate max-w-xs">{v.description}</p>
                    <p className="text-xs text-muted-foreground">{v.ruleId}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm truncate max-w-[150px]">{v.website.name}</p>
                  </td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatRelativeTime(v.firstDetectedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
