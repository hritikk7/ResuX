import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-1.5 text-center">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-[13px] text-muted-foreground">{subtitle}</p>
      </header>
      {children}
    </main>
  );
}
