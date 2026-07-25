import { FileText, History, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/components/SignOutButton";

export default async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col justify-between border-r border-border">
      <div className="flex flex-col gap-6 px-4 py-5">
        <span className="text-sm font-medium text-foreground">Resume Analyzer</span>

        <nav className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-[13px] text-foreground">
            <FileText className="size-3.5" aria-hidden />
            Analyzer
          </div>

          {/* Not built yet — see docs/design.md "Sidebar timing". Shown as a
              placeholder so the nav shape is visible ahead of these shipping,
              not because they're reachable. */}
          <div
            className="flex cursor-not-allowed items-center gap-2 px-2.5 py-1.5 text-[13px] text-muted-foreground/50"
            title="Coming soon"
          >
            <History className="size-3.5" aria-hidden />
            History
          </div>
          <div
            className="flex cursor-not-allowed items-center gap-2 px-2.5 py-1.5 text-[13px] text-muted-foreground/50"
            title="Coming soon"
          >
            <Mail className="size-3.5" aria-hidden />
            Cover letter
          </div>
        </nav>
      </div>

      {user && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-4">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      )}
    </aside>
  );
}
