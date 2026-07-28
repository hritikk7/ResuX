import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import EmailPasswordSignInForm from "@/app/components/EmailPasswordSignInForm";
import AuthShell from "@/app/components/AuthShell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Sign in to analyze your résumé against a job description."
    >
      {(error || message) && (
        <p className="text-center text-xs text-danger">{error ?? message}</p>
      )}

      <GoogleSignInButton />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <EmailPasswordSignInForm />
    </AuthShell>
  );
}
