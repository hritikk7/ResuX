import Sidebar from "@/app/components/Sidebar";

export default function DashLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Each page owns its own title (docs/design.md "consistent page headers"),
          so the shell deliberately has no header bar of its own. */}
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
