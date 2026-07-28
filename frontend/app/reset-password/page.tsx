import { redirect } from "next/navigation";
import ResetPasswordForm from "@/app/components/ResetPasswordForm";
import AuthShell from "@/app/components/AuthShell";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    redirect("/forgot-password");
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle={`Enter the code we sent to ${email} and choose a new password.`}
    >
      <ResetPasswordForm email={email} />
    </AuthShell>
  );
}
