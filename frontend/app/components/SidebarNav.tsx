"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, History, Mail } from "lucide-react";

// Split out of Sidebar because the active indicator needs usePathname, which is
// client-only — Sidebar itself is an async server component (it awaits getUser).
const NAV_ITEMS = [
  { href: "/dash", label: "Analyzer", icon: FileText },
  { href: "/dash/history", label: "History", icon: History },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-[13px] text-foreground"
                : "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground"
            }
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </Link>
        );
      })}

      {/* Not built yet — see docs/PRD_V2.md "Cover Letter Generator". Shown as a
          placeholder so the nav shape is visible ahead of it shipping, not
          because it's reachable. */}
      <div
        className="flex cursor-not-allowed items-center gap-2 px-2.5 py-1.5 text-[13px] text-muted-foreground/50"
        title="Coming soon"
      >
        <Mail className="size-3.5" aria-hidden />
        Cover letter
      </div>
    </nav>
  );
}
