"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

export default function EmailPasswordSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message === "Email not confirmed") {
        window.location.assign(`/signup/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      setErrorMessage(authErrorMessage(error));
      setLoading(false);
      return;
    }

    // Full navigation (not router.push) so proxy.ts re-evaluates with the
    // fresh session cookies rather than relying on client-side router cache.
    window.location.assign("/dash");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="********"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {errorMessage && (
        <span className="text-xs text-danger">{errorMessage}</span>
      )}

      <Button type="submit" variant="outline" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <Link
        href="/signup"
        className="text-center text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        Create an account
      </Link>
    </form>
  );
}
