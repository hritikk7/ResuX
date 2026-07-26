import Sidebar from "@/app/components/Sidebar";

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="border-b border-border px-6 py-3">
          <span className="text-sm font-medium text-foreground">Analyzer</span>
        </header>
        {children}
      </div>
    </div>
  );
}
