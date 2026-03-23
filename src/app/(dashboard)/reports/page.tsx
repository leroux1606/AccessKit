import { FileBarChart } from "lucide-react";

export const metadata = { title: "Reports — AccessKit" };

export default function ReportsPage() {
  return (
    <main id="main-content" className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Reports</h1>
      <p className="text-muted-foreground mb-8">
        Generate and download accessibility compliance reports for your websites.
      </p>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 p-16 text-center">
        <FileBarChart className="h-10 w-10 text-muted-foreground mb-4" aria-hidden="true" />
        <h2 className="text-lg font-medium mb-1">Coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          PDF and CSV accessibility reports with executive summaries, WCAG
          criterion breakdowns, and remediation timelines are on the roadmap.
        </p>
      </div>
    </main>
  );
}
