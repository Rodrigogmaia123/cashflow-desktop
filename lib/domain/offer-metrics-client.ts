/**
 * Funções client-side para cálculo de ROI baseado em período selecionado
 * Versão simplificada que não depende de Decimal do Prisma
 */

import { getDateNDaysAgo, normalizeDateToStart, normalizeDateToEnd } from "@/lib/utils/date-normalization";

type PerformanceData = {
  date: string;
  investment: number;
  revenue: number;
  sales: number;
  checkoutPercentage: number;
  gatewayFeePerSale: number;
  taxPercentage: number;
};

/**
 * Calcula fee total baseado em revenue, sales e taxas
 */
function calculateFeeClient(params: {
  revenue: number;
  sales: number;
  checkoutPercentage: number;
  gatewayFeePerSale: number;
  taxPercentage: number;
}): number {
  const checkout = params.revenue * params.checkoutPercentage;
  const gateway = params.sales * params.gatewayFeePerSale;
  const tax = params.revenue * params.taxPercentage;
  return checkout + gateway + tax;
}

/**
 * Calcula ROI: revenue / (investment + fee)
 */
function calculateROIClient(params: {
  investment: number;
  revenue: number;
  sales: number;
  checkoutPercentage: number;
  gatewayFeePerSale: number;
  taxPercentage: number;
}): number {
  const fee = calculateFeeClient(params);
  const totalCost = params.investment + fee;
  
  if (totalCost === 0) {
    return 0;
  }
  
  return params.revenue / totalCost;
}

/**
 * Calcula ROI agregado para um período específico usando dados brutos de performances
 * Se periodDays >= 999, usa todos os dados disponíveis (sem filtro de data)
 */
export function calculateROIForPeriod(
  performances: PerformanceData[],
  periodDays: number
): number | null {
  if (performances.length === 0) {
    return null;
  }

  let filtered: PerformanceData[];

  // Se periodDays >= 999, usar todos os dados (sem filtro)
  if (periodDays >= 999) {
    filtered = performances;
  } else {
    // Usar função utilitária para normalização correta de datas
    const now = normalizeDateToEnd(new Date()); // Incluir o dia atual completo
    const datePeriodAgo = getDateNDaysAgo(periodDays);

    // Filtrar performances dentro do período
    filtered = performances.filter((p) => {
      const perfDate = normalizeDateToStart(p.date);
      return perfDate >= datePeriodAgo && perfDate <= now;
    });
  }

  if (filtered.length === 0) {
    return null;
  }

  // Somar todos os valores
  const totalInvestment = filtered.reduce((sum, p) => sum + p.investment, 0);
  const totalRevenue = filtered.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = filtered.reduce((sum, p) => sum + p.sales, 0);

  // Usar a primeira performance como referência para as taxas
  const firstPerf = filtered[0];

  return calculateROIClient({
    investment: totalInvestment,
    revenue: totalRevenue,
    sales: totalSales,
    checkoutPercentage: firstPerf.checkoutPercentage,
    gatewayFeePerSale: firstPerf.gatewayFeePerSale,
    taxPercentage: firstPerf.taxPercentage
  });
}

