import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Team" };

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });
  if (!membership) redirect("/login");

  const members = await db.membership.findMany({
    where: { organizationId: membership.organizationId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {members.length} member{members.length !== 1 ? "s" : ""} in {membership.organization.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>People with access to this organization</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul role="list" className="divide-y">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-4 px-6 py-4">
                <Avatar className="h-9 w-9">
                  {member.user.image && (
                    <AvatarImage src={member.user.image} alt={member.user.name ?? member.user.email} />
                  )}
                  <AvatarFallback className="text-xs">
                    {getInitials(member.user.name, member.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                    {member.role.toLowerCase().replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Joined {formatDate(member.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Team invitation and role management coming soon. Upgrade to Professional or higher to add team members.
      </p>
    </div>
  );
}
