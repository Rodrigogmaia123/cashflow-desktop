import { Decimal } from "@prisma/client/runtime/library";
import { calculateRoiAndProfit } from "./finance";
import { getDateNDaysAgo, normalizeDateToStart, normalizeDateToEnd } from "@/lib/utils/date-normalization";

export type OfferMetrics = {
  roi7d: number | null;
  roi30d: number | null;
  roiGeneral: number | null; // Baseado em TODOS os dados disponíveis
  totalRevenue: number | null;
  trendData: number[]; // Array de valores de ROI para sparkline (últimos 30 dias)
  // Dados brutos serializados para recálculo no frontend
  performances: Array<{
    date: string; // ISO string
    investment: number;
    revenue: number;
    sales: number;
    checkoutPercentage: number;
    gatewayFeePerSale: number;
    taxPercentage: number;
  }>;
};

/**
 * Calcula métricas agregadas de uma oferta baseado em suas performances diárias
 */
export function calculateOfferMetrics(
  performances: Array<{
    date: Date;
    investment: Decimal;
    revenue: Decimal;
    sales: number;
    checkoutPercentageSnapshot: Decimal;
    gatewayFeePerSaleSnapshot: Decimal;
    taxPercentageSnapshot: Decimal;
  }>
): OfferMetrics {
  if (performances.length === 0) {
    return {
      roi7d: null,
      roi30d: null,
      roiGeneral: null,
      totalRevenue: null,
      trendData: [],
      performances: []
    };
  }

  // Usar função utilitária para normalização correta de datas
  const now = normalizeDateToEnd(new Date()); // Incluir o dia atual completo
  const date7dAgo = getDateNDaysAgo(7);
  const date30dAgo = getDateNDaysAgo(30);

  // Filtrar performances por período usando função utilitária
  const performances7d = performances.filter((p) => {
    const perfDate = normalizeDateToStart(p.date);
    return perfDate >= date7dAgo && perfDate <= now;
  });
  
  const performances30d = performances.filter((p) => {
    const perfDate = normalizeDateToStart(p.date);
    return perfDate >= date30dAgo && perfDate <= now;
  });

  // Calcular ROI agregado para cada período
  const roi7d = calculateAggregatedROI(performances7d);
  const roi30d = calculateAggregatedROI(performances30d);
  // roiGeneral sempre usa TODOS os dados disponíveis (não periodDays)
  const roiGeneral = calculateAggregatedROI(performances);

  // Calcular faturamento total (todas as performances)
  const totalRevenue = performances.reduce(
    (sum, p) => sum + p.revenue.toNumber(),
    0
  );

  // Gerar dados de tendência (últimos 30 dias, valores diários de ROI)
  const trendData = generateTrendData(performances30d);

  // Serializar performances para recálculo no frontend
  const serializedPerformances = performances.map((p) => ({
    date: p.date.toISOString(),
    investment: p.investment.toNumber(),
    revenue: p.revenue.toNumber(),
    sales: p.sales,
    checkoutPercentage: p.checkoutPercentageSnapshot.toNumber(),
    gatewayFeePerSale: p.gatewayFeePerSaleSnapshot.toNumber(),
    taxPercentage: p.taxPercentageSnapshot.toNumber()
  }));

  return {
    roi7d,
    roi30d,
    roiGeneral,
    totalRevenue: totalRevenue > 0 ? totalRevenue : null,
    trendData,
    performances: serializedPerformances
  };
}

/**
 * Calcula ROI agregado somando investment, revenue e sales de múltiplas performances
 */
function calculateAggregatedROI(
  performances: Array<{
    investment: Decimal;
    revenue: Decimal;
    sales: number;
    checkoutPercentageSnapshot: Decimal;
    gatewayFeePerSaleSnapshot: Decimal;
    taxPercentageSnapshot: Decimal;
  }>
): number | null {
  if (performances.length === 0) {
    return null;
  }

  // Somar todos os valores
  const totalInvestment = performances.reduce(
    (sum, p) => sum + p.investment.toNumber(),
    0
  );
  
  const totalRevenue = performances.reduce(
    (sum, p) => sum + p.revenue.toNumber(),
    0
  );
  
  const totalSales = performances.reduce(
    (sum, p) => sum + p.sales,
    0
  );

  // Usar a primeira performance como referência para as taxas (ou média se necessário)
  // Na prática, cada performance tem seu snapshot, mas para cálculo agregado
  // usamos a média ponderada ou a primeira
  const firstPerf = performances[0];
  
  const { roi } = calculateRoiAndProfit({
    investment: totalInvestment,
    revenue: totalRevenue,
    sales: totalSales,
    checkoutPercentage: firstPerf.checkoutPercentageSnapshot,
    gatewayFeePerSale: firstPerf.gatewayFeePerSaleSnapshot,
    taxPercentage: firstPerf.taxPercentageSnapshot
  });

  return roi.toNumber();
}

/**
 * Gera array de valores de ROI diários para sparkline (últimos 30 dias)
 * Retorna array de números representando ROI de cada dia
 */
function generateTrendData(
  performances: Array<{
    date: Date;
    investment: Decimal;
    revenue: Decimal;
    sales: number;
    checkoutPercentageSnapshot: Decimal;
    gatewayFeePerSaleSnapshot: Decimal;
    taxPercentageSnapshot: Decimal;
  }>
): number[] {
  if (performances.length === 0) {
    return [];
  }

  // Ordenar por data
  const sorted = [...performances].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Calcular ROI diário para cada performance
  return sorted.map((p) => {
    const { roi } = calculateRoiAndProfit({
      investment: p.investment,
      revenue: p.revenue,
      sales: p.sales,
      checkoutPercentage: p.checkoutPercentageSnapshot,
      gatewayFeePerSale: p.gatewayFeePerSaleSnapshot,
      taxPercentage: p.taxPercentageSnapshot
    });
    return roi.toNumber();
  });
}

