"use client";

import { useState, type FormEvent } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";

export default function VerifyCodeForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (error) {
      setErrorMessage(authErrorMessage(error));
      setLoading(false);
      return;
    }

    window.location.assign("/dash");
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) {
      setErrorMessage(authErrorMessage(error));
    } else {
      setResendMessage("A new code is on its way.");
    }
    setResending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          className="text-center font-mono tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </div>

      {errorMessage && (
        <span className="text-xs text-danger">{errorMessage}</span>
      )}
      {resendMessage && (
        <span className="text-xs text-success">{resendMessage}</span>
      )}

      <Button type="submit" variant="outline" disabled={loading || code.length !== 6}>
        {loading ? "Verifying…" : "Verify"}
      </Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-center text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>
    </form>
  );
}
