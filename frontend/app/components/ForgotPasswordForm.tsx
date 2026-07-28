"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setErrorMessage(authErrorMessage(error));
      setLoading(false);
      return;
    }

    // Always proceed to the reset screen regardless of whether the address
    // is registered — never reveal account existence through this form.
    window.location.assign(`/reset-password?email=${encodeURIComponent(email)}`);
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

      {errorMessage && (
        <span className="text-xs text-danger">{errorMessage}</span>
      )}

      <Button type="submit" variant="outline" disabled={loading}>
        {loading ? "Sending…" : "Send reset code"}
      </Button>

      <Link
        href="/login"
        className="text-center text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        Back to sign in
      </Link>
    </form>
  );
}
