import { StatCard } from "@/components/dashboard";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * สถิติแอดมิน — ห่อ StatCard ของ design system (Celestial)
 */
export function AdminStatCard({
  title,
  value,
  hint,
  className,
  "data-testid": dataTestId,
}: AdminStatCardProps) {
  return (
    <StatCard
      label={title}
      value={typeof value === "number" ? value.toLocaleString() : value}
      hint={hint}
      className={className}
      data-testid={dataTestId}
    />
  );
}
