import { BusinessAlerts } from "./business-alerts";
import { getBusinessAlerts } from "@/lib/analytics/business-alerts";

type BusinessAlertsSectionProps = {
  workspaceId: string;
  offerId?: string;
  startDate: Date;
  endDate: Date;
};

export async function BusinessAlertsSection({
  workspaceId,
  offerId,
  startDate,
  endDate
}: BusinessAlertsSectionProps) {
  const alerts = await getBusinessAlerts({
    workspaceId,
    offerId,
    startDate,
    endDate
  });

  return <BusinessAlerts alerts={alerts} />;
}
