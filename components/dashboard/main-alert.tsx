import { AlertCard } from "./alert-card";
import type { BusinessAlert } from "@/lib/analytics/business-alerts";

type MainAlertProps = {
  alerts: BusinessAlert[];
  hideOfferActions?: boolean;
};

export function MainAlert({ alerts, hideOfferActions = false }: MainAlertProps) {
  if (alerts.length === 0) {
    return null;
  }

  // Get most critical alert
  const priorityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  const mainAlert = alerts.sort(
    (a, b) => priorityOrder[a.level] - priorityOrder[b.level]
  )[0];

  // Determine action based on alert type
  const getAction = (alert: BusinessAlert): { label: string; href: string } | null => {
    if (hideOfferActions) {
      return { label: "Ver fluxo de caixa", href: "/app/cashflow" };
    }
    if (alert.title.toLowerCase().includes("ofert")) {
      return { label: "Ver ofertas", href: "/app/offers" };
    }
    if (alert.title.toLowerCase().includes("roi") || alert.title.toLowerCase().includes("lucro")) {
      return { label: "Analisar", href: "/app/dashboard" };
    }
    return null;
  };

  const action = getAction(mainAlert);

  return (
    <AlertCard
      alert={mainAlert}
      actionLabel={action?.label}
      href={action?.href}
    />
  );
}
