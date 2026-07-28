import ForgotPasswordForm from "@/app/components/ForgotPasswordForm";
import AuthShell from "@/app/components/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a verification code."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
