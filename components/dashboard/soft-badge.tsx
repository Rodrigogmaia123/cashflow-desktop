import { cn } from "@/lib/utils";

type SoftBadgeProps = {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "primary" | "default";
  className?: string;
};

export function SoftBadge({ children, variant = "default", className }: SoftBadgeProps) {
  const variants = {
    success: "bg-success-soft text-success-vibrant border-success-vibrant/30",
    danger: "bg-destructive-soft text-destructive-vibrant border-destructive-vibrant/30",
    warning: "bg-warning-soft text-warning border-warning/30",
    primary: "bg-primary-soft text-primary border-primary/30",
    accent: "bg-accent-soft text-accent border-accent/30",
    default: "bg-white/5 text-muted-foreground border-white/10"
  };

  return (
    <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
