import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Globe, BarChart3, Shield } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm" aria-hidden="true">AK</span>
          </div>
          <span className="font-bold text-lg">AccessKit</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Start free trial</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main>
        <section className="text-center py-20 px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-6">
            EU Accessibility Act enforcement started June 2025
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            The accessibility platform
            <br />
            built for agencies
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Scan, fix, prove compliance, and resell web accessibility to your clients.
            Powered by axe-core. Priced for agencies at <strong>$349/month</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">Start 14-day free trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No credit card required. Cancel anytime.</p>
        </section>

        {/* Features */}
        <section className="py-16 px-6 max-w-5xl mx-auto" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-3xl font-bold text-center mb-12">
            Everything agencies need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Globe,
                title: "Guided remediation",
                desc: "Every violation gets a copy-paste code fix — not generic guidance. AI-powered suggestions understand the context of your HTML.",
              },
              {
                icon: BarChart3,
                title: "Issue workflow",
                desc: "Turn violations into trackable tasks. Assign to team members, track status, and comment. Accessibility as project management.",
              },
              {
                icon: Shield,
                title: "Compliance evidence",
                desc: "Generate VPAT-style reports with timestamped evidence. Legal protection you can show clients and auditors.",
              },
              {
                icon: CheckCircle2,
                title: "Client portals",
                desc: "Create branded portals for each client. They see their score, issues, and progress. You look professional.",
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            AccessKit is a monitoring and baseline assessment tool — not a compliance guarantee.
            Find, track, and fix accessibility issues systematically.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">Start your free trial</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AccessKit. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
