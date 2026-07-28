import { Separator } from "@/components/ui/separator";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import SignUpForm from "@/app/components/SignUpForm";
import AuthShell from "@/app/components/AuthShell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create an account"
      subtitle="Sign up to analyze your résumé against a job description."
    >
      <GoogleSignInButton />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <SignUpForm />
    </AuthShell>
  );
}
