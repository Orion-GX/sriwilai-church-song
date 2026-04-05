import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function AdminStatCard({
  title,
  value,
  hint,
  className,
}: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
