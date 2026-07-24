interface StatusBarProps {
  status: string;
}

export default function StatusBar({ status }: StatusBarProps) {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
      <span
        className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden
      />
      <span>{status}</span>
    </div>
  );
}
