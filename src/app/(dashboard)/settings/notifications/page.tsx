import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences-form";

export const metadata = { title: "Notification Preferences" };

const ALL_TYPES: NotificationType[] = [
  "SCAN_COMPLETE",
  "CRITICAL_ISSUES",
  "SCORE_DROP",
  "WEEKLY_DIGEST",
  "ISSUE_ASSIGNED",
];

export default async function NotificationPreferencesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  });
  if (!membership) redirect("/login");

  const prefs = await db.notificationPreference.findMany({
    where: {
      userId: session.user.id,
      organizationId: membership.organizationId,
    },
  });

  const prefMap = new Map(prefs.map((p) => [p.type, p]));
  const preferences = ALL_TYPES.map((type) => ({
    type,
    email: prefMap.get(type)?.email ?? true,
    inApp: prefMap.get(type)?.inApp ?? true,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose how and when you want to be notified
        </p>
      </div>

      <NotificationPreferencesForm initialPreferences={preferences} />
    </div>
  );
}
