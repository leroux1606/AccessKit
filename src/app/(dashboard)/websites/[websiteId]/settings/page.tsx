import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";

export const metadata = { title: "Website Settings" };

interface SettingsPageProps {
  params: Promise<{ websiteId: string }>;
}

export default async function WebsiteSettingsPage({ params }: SettingsPageProps) {
  const { websiteId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) redirect("/login");

  const website = await db.website.findUnique({
    where: { id: websiteId, organizationId: membership.organizationId },
  });

  if (!website) notFound();

  const metaTagValue = `<meta name="accesskit-verification" content="${website.verificationToken}">`;
  const dnsValue = `accesskit-verify=${website.verificationToken}`;
  const fileContent = website.verificationToken;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/websites/${websiteId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website settings</h1>
        <p className="text-sm text-muted-foreground">{website.name}</p>
      </div>

      {/* Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ownership verification</CardTitle>
            {website.verified ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </Badge>
            ) : (
              <Badge variant="warning">Not verified</Badge>
            )}
          </div>
          <CardDescription>
            Verify that you own this website. Choose any one method below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method 1: Meta tag */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Method 1: HTML meta tag</h3>
            <p className="text-xs text-muted-foreground">
              Add this tag inside the <code>&lt;head&gt;</code> of your homepage.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all font-mono">
                {metaTagValue}
              </code>
            </div>
          </div>

          {/* Method 2: DNS */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Method 2: DNS TXT record</h3>
            <p className="text-xs text-muted-foreground">
              Add a TXT record to your domain&apos;s DNS with this value.
            </p>
            <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
              {dnsValue}
            </code>
          </div>

          {/* Method 3: File */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Method 3: Verification file</h3>
            <p className="text-xs text-muted-foreground">
              Create a file at:{" "}
              <code className="bg-muted px-1 rounded text-xs">
                {website.url}/.well-known/accesskit-verify.txt
              </code>{" "}
              with this content:
            </p>
            <code className="block rounded bg-muted px-3 py-2 text-xs font-mono">
              {fileContent}
            </code>
          </div>

          {!website.verified && (
            <Button className="w-full" disabled>
              Verify ownership (automatic verification coming soon)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete website</p>
              <p className="text-xs text-muted-foreground">
                Permanently deletes this website and all its scans and violations.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
