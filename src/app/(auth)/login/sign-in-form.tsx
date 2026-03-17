"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Github, Mail, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleOAuth(provider: "google" | "github") {
    setIsLoading(provider);
    await signIn(provider, { callbackUrl });
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsLoading("email");
    const result = await signIn("resend", {
      email,
      callbackUrl,
      redirect: false,
    });
    setIsLoading(null);
    if (result?.ok) {
      setMagicLinkSent(true);
    }
  }

  if (magicLinkSent) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMagicLinkSent(false);
            setEmail("");
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuth("google")}
          disabled={isLoading !== null}
          aria-label="Sign in with Google"
        >
          <Chrome className="h-4 w-4 mr-2" aria-hidden="true" />
          Continue with Google
          {isLoading === "google" && (
            <span className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleOAuth("github")}
          disabled={isLoading !== null}
          aria-label="Sign in with GitHub"
        >
          <Github className="h-4 w-4 mr-2" aria-hidden="true" />
          Continue with GitHub
          {isLoading === "github" && (
            <span className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            disabled={isLoading !== null}
            autoComplete="email"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading !== null || !email}
          aria-label="Send magic link to email"
        >
          <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
          Send magic link
          {isLoading === "email" && (
            <span className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          )}
        </Button>
      </form>
    </div>
  );
}
