"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scan, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerScan } from "@/app/(dashboard)/websites/[websiteId]/actions";

interface ScanButtonProps {
  websiteId: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function ScanButton({ websiteId, disabled, disabledReason }: ScanButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const { redirectTo } = await triggerScan(websiteId);
        router.push(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start scan");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        onClick={handleClick}
        disabled={disabled || isPending}
        aria-label={disabledReason ?? (isPending ? "Starting scan…" : "Scan now")}
        title={disabledReason}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
        ) : (
          <Scan className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
        )}
        {isPending ? "Starting…" : "Scan now"}
      </Button>
      {error && <p className="text-xs text-destructive max-w-[160px] text-right">{error}</p>}
    </div>
  );
}
