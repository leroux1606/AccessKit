import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Key } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const apiKeys = await db.apiKey.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { createdAt: "desc" },
  });

  const isAgencyOrHigher = ["AGENCY", "ENTERPRISE"].includes(membership.organization.plan);

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
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Authenticate with the AccessKit API and CI/CD integrations
        </p>
      </div>

      {!isAgencyOrHigher ? (
        <Card className="border-orange-500/20 bg-orange-500/10">
          <CardContent className="p-6 text-center space-y-3">
            <Key className="h-8 w-8 mx-auto text-orange-400" aria-hidden="true" />
            <p className="font-medium">API access requires Agency plan or higher</p>
            <p className="text-sm text-muted-foreground">
              Upgrade to use the REST API, CI/CD integrations, and webhooks.
            </p>
            <Button asChild>
              <Link href="/settings/billing">Upgrade plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{apiKeys.length} API key{apiKeys.length !== 1 ? "s" : ""}</p>
            <Button disabled>Create API key (coming soon)</Button>
          </div>

          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10">
                <Key className="h-8 w-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No API keys yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul role="list" className="divide-y">
                  {apiKeys.map((key) => (
                    <li key={key.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(key.createdAt)} ·{" "}
                          {key.lastUsedAt ? `Last used ${formatDate(key.lastUsedAt)}` : "Never used"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="text-destructive" disabled>
                        Revoke
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
