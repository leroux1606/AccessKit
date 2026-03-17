import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plug, Github } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const plan = membership.organization.plan;
  const hasGithub = ["PROFESSIONAL", "AGENCY", "ENTERPRISE"].includes(plan);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect AccessKit to your development workflow
        </p>
      </div>

      <div className="space-y-4">
        <Card className={!hasGithub ? "opacity-75" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Github className="h-6 w-6" aria-hidden="true" />
                <div>
                  <CardTitle className="text-base">GitHub Actions</CardTitle>
                  <CardDescription className="text-xs">Scan on every PR and deploy</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasGithub ? (
                  <Badge variant="success">Available</Badge>
                ) : (
                  <Badge variant="secondary">Professional+</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasGithub ? (
              <p className="text-sm text-muted-foreground">GitHub Actions integration coming soon. Use your API key to authenticate.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Automatically scan staging URLs on every pull request. Block merges if new critical issues are introduced.
                </p>
                <Button size="sm" asChild>
                  <Link href="/settings/billing">Upgrade to Professional</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
