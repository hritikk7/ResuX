import { redirect } from "next/navigation";
import VerifyCodeForm from "@/app/components/VerifyCodeForm";
import AuthShell from "@/app/components/AuthShell";

export default async function VerifySignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    redirect("/signup");
  }

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
    >
      <VerifyCodeForm email={email} />
    </AuthShell>
  );
}
