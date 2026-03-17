import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Verify user has at least one organization
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  if (!membership) {
    // Edge case: user exists but has no org (shouldn't happen with our createUser event)
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main
          id="main-content"
          className="flex-1 p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
