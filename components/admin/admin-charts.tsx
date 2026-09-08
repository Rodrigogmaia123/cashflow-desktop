"use client";

import type { AdminChartsData } from "@/app/app/admin/actions";
import { LicensesEvolutionChart } from "./charts/users-evolution-chart";
import { RevenueEvolutionChart } from "./charts/mrr-evolution-chart";
import { RevocationsChart } from "./charts/cancellations-chart";
import { EditionsDistributionChart } from "./charts/plans-distribution-chart";

type Props = {
  chartsData: AdminChartsData;
};

export function AdminCharts({ chartsData }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <LicensesEvolutionChart data={chartsData.licensesEvolution} />
      <RevenueEvolutionChart data={chartsData.revenueEvolution} />
      <RevocationsChart data={chartsData.revocations} />
      <EditionsDistributionChart data={chartsData.editionsDistribution} />
    </div>
  );
}
