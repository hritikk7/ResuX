"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(authErrorMessage(error));
      setLoading(false);
      return;
    }

    // Supabase returns a user with no identities when the email already
    // belongs to an account created via another method (e.g. Google) —
    // it doesn't send a code in that case, so send them to sign in instead.
    if (data.user && data.user.identities?.length === 0) {
      window.location.assign(
        `/login?message=${encodeURIComponent(
          "That email already has an account. Sign in instead — if you used Google originally, use the Google button above."
        )}`
      );
      return;
    }

    window.location.assign(`/signup/verify?email=${encodeURIComponent(email)}`);
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
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="********"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {errorMessage && (
        <span className="text-xs text-danger">{errorMessage}</span>
      )}

      <Button type="submit" variant="outline" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <Link
        href="/login"
        className="text-center text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        Already have an account? Sign in
      </Link>
    </form>
  );
}
