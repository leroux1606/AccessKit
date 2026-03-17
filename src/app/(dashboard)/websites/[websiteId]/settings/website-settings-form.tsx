"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateWebsiteSettings } from "./actions";
import { cn } from "@/lib/utils";
import type { PlanType, ScanFrequency } from "@prisma/client";
import { PLAN_LIMITS } from "@/lib/plans";

const FREQUENCY_OPTIONS: { value: ScanFrequency; label: string; description: string }[] = [
  { value: "MANUAL", label: "Manual only", description: "Scan only when you trigger it" },
  { value: "MONTHLY", label: "Monthly", description: "Once per month, automatically" },
  { value: "WEEKLY", label: "Weekly", description: "Every week, automatically" },
  { value: "DAILY", label: "Daily", description: "Every day, automatically" },
];

const STANDARDS_OPTIONS = [
  { value: "WCAG21_A", label: "WCAG 2.1 Level A", description: "Minimum accessibility" },
  { value: "WCAG21_AA", label: "WCAG 2.1 Level AA", description: "Most common standard" },
  { value: "WCAG22_AA", label: "WCAG 2.2 Level AA", description: "Latest standard (2023)" },
  { value: "SECTION_508", label: "Section 508", description: "US federal requirements" },
  { value: "EN_301_549", label: "EN 301 549", description: "EU accessibility act" },
] as const;

interface WebsiteSettingsFormProps {
  websiteId: string;
  currentName: string;
  currentFrequency: ScanFrequency;
  currentStandards: string[];
  orgPlan: PlanType;
  canManage: boolean;
}

export function WebsiteSettingsForm({
  websiteId,
  currentName,
  currentFrequency,
  currentStandards,
  orgPlan,
  canManage,
}: WebsiteSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [frequency, setFrequency] = useState<ScanFrequency>(currentFrequency);
  const [standards, setStandards] = useState<string[]>(currentStandards);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedFrequencies = PLAN_LIMITS[orgPlan].scanFrequencies;

  function toggleStandard(value: string) {
    setStandards((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (standards.length === 0) {
      setError("Select at least one standard.");
      return;
    }

    startTransition(async () => {
      const result = await updateWebsiteSettings({ websiteId, name, frequency, standards });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        You need Member or higher role to change settings.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="website-name" className="block text-sm font-medium mb-1.5">
          Display name
        </label>
        <input
          id="website-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={cn(
            "w-full px-3 py-2 rounded-md border border-input bg-background text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-50"
          )}
          disabled={isPending}
        />
      </div>

      {/* Scan frequency */}
      <fieldset>
        <legend className="block text-sm font-medium mb-2">Scan frequency</legend>
        <div className="space-y-2">
          {FREQUENCY_OPTIONS.map((opt) => {
            const isAllowed = allowedFrequencies.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3 transition-colors",
                  isAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                  frequency === opt.value && isAllowed
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                )}
              >
                <input
                  type="radio"
                  name="frequency"
                  value={opt.value}
                  checked={frequency === opt.value}
                  onChange={() => isAllowed && setFrequency(opt.value)}
                  disabled={!isAllowed || isPending}
                  className="accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {!isAllowed && (
                  <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                    Upgrade
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Standards */}
      <fieldset>
        <legend className="block text-sm font-medium mb-2">Accessibility standards</legend>
        <div className="space-y-2">
          {STANDARDS_OPTIONS.map((std) => (
            <label
              key={std.value}
              className={cn(
                "flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                standards.includes(std.value)
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted/50"
              )}
            >
              <input
                type="checkbox"
                checked={standards.includes(std.value)}
                onChange={() => toggleStandard(std.value)}
                disabled={isPending}
                className="h-4 w-4 rounded accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{std.label}</p>
                <p className="text-xs text-muted-foreground">{std.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Save settings"
          )}
        </Button>
        {saved && (
          <p role="status" className="text-sm text-green-600" aria-live="polite">
            Settings saved.
          </p>
        )}
      </div>
    </form>
  );
}
