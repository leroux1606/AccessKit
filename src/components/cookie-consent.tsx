"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initPostHog, optOutPostHog, CONSENT_KEY } from "@/components/posthog-provider";

/**
 * GDPR / PECR cookie consent banner.
 * Shown on first visit; choice is persisted in localStorage.
 * Analytics (PostHog) must not fire until "accepted" is stored.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    initPostHog();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    optOutPostHog();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 shadow-lg"
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <p className="text-sm text-muted-foreground flex-1">
          We use essential cookies to operate AccessKit and optional analytics
          cookies to improve the product.{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            Essential only
          </Button>
          <Button size="sm" onClick={accept}>
            Accept all
          </Button>
          <button
            onClick={decline}
            aria-label="Dismiss cookie notice (decline optional cookies)"
            className="ml-1 rounded p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
