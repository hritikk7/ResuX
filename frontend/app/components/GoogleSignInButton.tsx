"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Button
        onClick={handleSignIn}
        disabled={loading}
        variant="default"
        className="w-full"
      >
        {loading ? "Connecting to Google…" : "Sign in with Google"}
      </Button>

      {errorMessage && (
        <span className="text-xs text-danger">{errorMessage}</span>
      )}
    </div>
  );
}
