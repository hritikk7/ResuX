import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/components/SignOutButton";

export default async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
        <span className="text-sm font-medium text-foreground">Resume Analyzer</span>
        {user && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">{user.email}</span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
