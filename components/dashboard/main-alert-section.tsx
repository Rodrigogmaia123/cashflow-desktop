import { getBusinessAlerts } from "@/lib/analytics/business-alerts";
import { MainAlert } from "./main-alert";

type MainAlertSectionProps = {
  workspaceId: string;
  startDate: Date;
  endDate: Date;
};

export async function MainAlertSection({ workspaceId, startDate, endDate }: MainAlertSectionProps) {
  const alerts = await getBusinessAlerts({
    workspaceId,
    startDate,
    endDate
  });

  return <MainAlert alerts={alerts} />;
}
