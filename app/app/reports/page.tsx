import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { PeriodReportPage } from "@/components/reports/period-report-page";

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await requireActiveWorkspaceId();

  return <PeriodReportPage />;
}
