import { prisma } from "@/lib/db";
import { calculateFee } from "@/lib/domain/finance";
import { Decimal } from "@prisma/client/runtime/library";
import { measure } from "@/lib/observability/measure";

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  profit: number;
  revenue: number;
  investment: number;
  roi: number;
  intensity: 0 | 1 | 2 | 3 | 4 | 5;
};

export async function getOfferDailyHeatmap(params: {
  workspaceId: string;
  offerId: string;
  startDate: Date;
  endDate: Date;
}): Promise<HeatmapDay[]> {
  return measure(
    "analytics.offerHeatmap",
    async () => {
      const rows = await prisma.dailyPerformance.findMany({
        where: {
          offerId: params.offerId,
          date: {
            gte: params.startDate,
            lte: params.endDate
          },
          offer: {
            workspaceId: params.workspaceId
          }
        },
        orderBy: { date: "asc" }
      });

      if (rows.length === 0) {
        return [];
      }

      // Calcular profit para cada dia
      const daysWithProfit: Array<{
        date: string;
        profit: number;
        revenue: number;
        investment: number;
        roi: number;
      }> = [];

      for (const row of rows) {
        const fee = calculateFee({
          revenue: row.revenue,
          sales: row.sales,
          checkoutPercentage: row.checkoutPercentageSnapshot,
          gatewayFeePerSale: row.gatewayFeePerSaleSnapshot,
          taxPercentage: row.taxPercentageSnapshot
        });

        const profit = row.revenue.sub(row.investment.add(fee));
        const totalCost = row.investment.add(fee);
        const roi = totalCost.equals(0)
          ? new Decimal(0)
          : row.revenue.div(totalCost);

        daysWithProfit.push({
          date: row.date.toISOString().split("T")[0],
          profit: profit.toNumber(),
          revenue: row.revenue.toNumber(),
          investment: row.investment.toNumber(),
          roi: roi.toNumber()
        });
      }

      // Calcular intensidade via percentis (0-5)
      const profits = daysWithProfit.map((d) => d.profit).sort((a, b) => a - b);
      const minProfit = profits[0];
      const maxProfit = profits[profits.length - 1];
      
      // Se todos os lucros forem negativos ou zero
      if (maxProfit <= 0) {
        return daysWithProfit.map((d) => ({
          ...d,
          intensity: 0 as 0 | 1 | 2 | 3 | 4 | 5
        }));
      }

      // Se todos os lucros forem iguais e positivos
      if (minProfit === maxProfit && minProfit > 0) {
        return daysWithProfit.map((d) => ({
          ...d,
          intensity: 3 as 0 | 1 | 2 | 3 | 4 | 5 // Nível médio
        }));
      }

      // Calcular percentis apenas para valores positivos
      const positiveProfits = profits.filter((p) => p > 0);
      
      if (positiveProfits.length === 0) {
        return daysWithProfit.map((d) => ({
          ...d,
          intensity: 0 as 0 | 1 | 2 | 3 | 4 | 5
        }));
      }

      const getPercentile = (arr: number[], percentile: number) => {
        if (arr.length === 0) return 0;
        const index = Math.floor((percentile / 100) * arr.length);
        return arr[Math.min(index, arr.length - 1)];
      };

      const p20 = getPercentile(positiveProfits, 20);
      const p40 = getPercentile(positiveProfits, 40);
      const p60 = getPercentile(positiveProfits, 60);
      const p80 = getPercentile(positiveProfits, 80);

      // Mapear profit para intensidade (0-5)
      const getIntensity = (profit: number): 0 | 1 | 2 | 3 | 4 | 5 => {
        if (profit <= 0) return 0;
        if (profit <= p20) return 1;
        if (profit <= p40) return 2;
        if (profit <= p60) return 3;
        if (profit <= p80) return 4;
        return 5;
      };

      return daysWithProfit.map((d) => ({
        ...d,
        intensity: getIntensity(d.profit)
      }));
    },
    {
      workspaceId: params.workspaceId,
      offerId: params.offerId
    }
  );
}

