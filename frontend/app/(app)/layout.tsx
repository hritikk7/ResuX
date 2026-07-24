import AppHeader from "@/app/components/AppHeader";

export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      {children}
    </div>
  );
}
