"use client";

import type { AdminChartsData } from "@/app/app/admin/actions";
import { UsersEvolutionChart } from "./charts/users-evolution-chart";
import { MRREvolutionChart } from "./charts/mrr-evolution-chart";
import { CancellationsChart } from "./charts/cancellations-chart";
import { PlansDistributionChart } from "./charts/plans-distribution-chart";

type Props = {
  chartsData: AdminChartsData;
};

/**
 * Wrapper para todos os gráficos do painel admin
 * Organiza em grid responsivo 2x2
 */
export function AdminCharts({ chartsData }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <UsersEvolutionChart data={chartsData.usersEvolution} />
      <MRREvolutionChart data={chartsData.mrrEvolution} />
      <CancellationsChart data={chartsData.cancellations} />
      <PlansDistributionChart data={chartsData.plansDistribution} />
    </div>
  );
}

