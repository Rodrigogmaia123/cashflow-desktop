import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  actions?: React.ReactNode;
};

export function DashboardSection({
  title,
  description,
  children,
  className,
  headerClassName,
  actions
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className={cn("flex items-start justify-between gap-3", headerClassName)}>
          <div className="space-y-1">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
