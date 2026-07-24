import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-1.5 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Sign in to analyze your résumé against a job description.
        </p>
      </header>

      <GoogleSignInButton />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Placeholder only — not wired to any auth call. Google OAuth via
          GoogleSignInButton above is the only functional sign-in path
          (docs/PRD_V2.md scopes auth in as Google OAuth only). */}
      <form className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="********" disabled />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled
          title="Not implemented — Google sign-in only"
        >
          Sign in
        </Button>

        <button
          type="button"
          disabled
          className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 disabled:cursor-not-allowed"
          title="Not implemented — Google sign-in only"
        >
          Create an account
        </button>
      </form>
    </main>
  );
}
