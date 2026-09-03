import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "success" | "error" | "warning" | "info";

interface SimpleAlertProps {
  type: AlertType;
  message: string;
  details?: string;
  onDismiss?: () => void;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-success-soft",
    border: "border-success-vibrant/30",
    text: "text-success-vibrant",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  error: {
    bg: "bg-destructive-soft",
    border: "border-destructive-vibrant/30",
    text: "text-destructive-vibrant",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-600 dark:text-yellow-400",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
};

export function SimpleAlert({ type, message, details, onDismiss }: SimpleAlertProps) {
  const styles = alertStyles[type];

  return (
    <div className={cn("rounded-lg border p-4", styles.bg, styles.border)}>
      <div className="flex items-start gap-3">
        <div className={styles.text}>{styles.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", styles.text)}>{message}</p>
          {details && (
            <p className="text-xs text-muted-foreground mt-1">{details}</p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn("flex-shrink-0 hover:opacity-70 transition-opacity", styles.text)}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
