"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { calculateFee } from "@/lib/domain/finance";
import { Prisma } from "@prisma/client";
import { getWorkspaceDashboard } from "@/lib/analytics/dashboard";
import { getWorkspaceCashflow } from "@/lib/analytics/cashflow";
import { getOfferDashboard } from "@/lib/analytics/dashboard";
import type { DashboardRange } from "@/lib/analytics/date-range";
import { resolveDateRange } from "@/lib/analytics/date-range";
import { checkFeatureAccess } from "@/lib/plans/authorization";

function formatCSVValue(value: string | number | Date): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  const str = String(value);
  
  // Se for uma data no formato YYYY-MM-DD, converter para DD/MM/YYYY (formato brasileiro)
  const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dateMatch = str.match(datePattern);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}/${month}/${year}`;
  }
  
  // Substituir ponto decimal por vírgula (padrão brasileiro) apenas para números
  const localizedStr = str.replace(/\./g, ",");
  if (localizedStr.includes(";") || localizedStr.includes('"') || localizedStr.includes("\n")) {
    return `"${localizedStr.replace(/"/g, '""')}"`;
  }
  return localizedStr;
}

function generateCSV(rows: string[][]): string {
  // Usar ponto-e-vírgula como separador para compatibilidade com Excel BR
  return rows.map((row) => row.map(formatCSVValue).join(";")).join("\n");
}

export async function exportDashboardCSV(formData: FormData) {
  try {
    // Verifica se o plano permite exportação
    const featureCheck = await checkFeatureAccess("exports_excel");
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason || "Exportação não está disponível no plano FREE. Faça upgrade para PRO.");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const workspaceId = await requireActiveWorkspaceId();

    const rangeRaw = formData.get("range");
    const startRaw = formData.get("start");
    const endRaw = formData.get("end");

    let range: DashboardRange;
    if (startRaw && endRaw && typeof startRaw === "string" && typeof endRaw === "string") {
      const startDate = new Date(`${startRaw}T00:00:00.000Z`);
      const endDate = new Date(`${endRaw}T00:00:00.000Z`);
      range = { type: "absolute", startDate, endDate };
    } else {
      const allowed = ["today", "7d", "30d", "3m", "6m", "12m"] as const;
      const value = (allowed as readonly string[]).includes(rangeRaw as string)
        ? (rangeRaw as typeof allowed[number])
        : "30d";
      range = { type: "relative", value };
    }

    const { dailySeries, kpis } = await getWorkspaceDashboard({
      workspaceId,
      range
    });

    const headers = ["Data", "Investimento", "Faturamento", "Vendas", "Fee", "Lucro", "ROI (%)"];
    const csvRows: string[][] = [headers];

    // Filtrar apenas dias com dados relevantes (investimento > 0 ou faturamento > 0 ou vendas > 0)
    const relevantDays = dailySeries.filter((point) => 
      point.investment > 0 || point.revenue > 0 || point.sales > 0
    );

    for (const point of relevantDays) {
      csvRows.push([
        point.date,
        point.investment.toFixed(2),
        point.revenue.toFixed(2),
        point.sales.toString(),
        point.fee.toFixed(2),
        point.profit.toFixed(2),
        (point.roi * 100).toFixed(2)
      ]);
    }

    csvRows.push([]);
    csvRows.push([
      "TOTAL",
      kpis.investmentTotal.toFixed(2),
      kpis.revenueTotal.toFixed(2),
      kpis.salesTotal.toString(),
      kpis.feeTotal.toFixed(2),
      kpis.profitTotal.toFixed(2),
      (kpis.roiWeighted.toNumber() * 100).toFixed(2)
    ]);

    return generateCSV(csvRows);
  } catch (error) {
    console.error("Erro ao exportar dashboard CSV:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao exportar dashboard.");
  }
}

export async function exportCashflowCSV(formData: FormData) {
  try {
    // Verifica se o plano permite exportação
    const featureCheck = await checkFeatureAccess("exports_excel");
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason || "Exportação não está disponível no plano FREE. Faça upgrade para PRO.");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const workspaceId = await requireActiveWorkspaceId();

    const startRaw = formData.get("startDate");
    const endRaw = formData.get("endDate");

    if (!startRaw || !endRaw || typeof startRaw !== "string" || typeof endRaw !== "string") {
      throw new Error("Datas de início e fim são obrigatórias.");
    }

    const startDate = new Date(`${startRaw}T00:00:00.000Z`);
    const endDate = new Date(`${endRaw}T23:59:59.999Z`);

    const { series, kpis } = await getWorkspaceCashflow({
      workspaceId,
      startDate,
      endDate
    });

    const headers = [
      "Data",
      "Entrada (Receita)",
      "Saída (Investimento + Fees + Despesas + Investimentos)",
      "Saldo Diário",
      "Saldo Acumulado",
      "Investimento em Ads",
      "Fees",
      "Despesas",
      "Investimentos"
    ];
    const csvRows: string[][] = [headers];

    // Filtrar apenas dias com dados relevantes (inflow > 0 ou outflow > 0)
    const relevantDays = series.filter((point) => 
      point.inflow > 0 || point.outflow > 0
    );

    for (const point of relevantDays) {
      csvRows.push([
        point.date,
        point.inflow.toFixed(2),
        point.outflow.toFixed(2),
        point.net.toFixed(2),
        point.balance.toFixed(2),
        point.breakdown.adInvestment.toFixed(2),
        point.breakdown.fees.toFixed(2),
        point.breakdown.expenses.toFixed(2),
        point.breakdown.investments.toFixed(2)
      ]);
    }

    csvRows.push([]);
    csvRows.push([
      "TOTAL",
      kpis.totalRevenue.toFixed(2),
      kpis.totalOutflow.toFixed(2),
      kpis.netProfit.toFixed(2),
      kpis.endingBalance.toFixed(2),
      kpis.totalAdInvestment.toFixed(2),
      kpis.totalFees.toFixed(2),
      kpis.totalExpenses.toFixed(2),
      kpis.totalInvestments.toFixed(2)
    ]);

    return generateCSV(csvRows);
  } catch (error) {
    console.error("Erro ao exportar cashflow CSV:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao exportar cashflow.");
  }
}

export async function exportOfferCSV(formData: FormData) {
  try {
    // Verifica se o plano permite exportação
    const featureCheck = await checkFeatureAccess("exports_excel");
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason || "Exportação não está disponível no plano FREE. Faça upgrade para PRO.");
    }

    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const workspaceId = await requireActiveWorkspaceId();
    const offerIdRaw = formData.get("offerId");

    if (!offerIdRaw || typeof offerIdRaw !== "string") {
      throw new Error("ID da oferta é obrigatório.");
    }

    const offer = await prisma.offer.findFirst({
      where: { id: offerIdRaw, workspaceId }
    });

    if (!offer) {
      throw new Error("Oferta não encontrada no workspace atual.");
    }

    const startRaw = formData.get("startDate");
    const endRaw = formData.get("endDate");
    const rangeRaw = formData.get("range");

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let range: Parameters<typeof getOfferDashboard>[0]["range"];

    if (startRaw && endRaw && typeof startRaw === "string" && typeof endRaw === "string") {
      startDate = new Date(`${startRaw}T00:00:00.000Z`);
      endDate = new Date(`${endRaw}T23:59:59.999Z`);
    } else if (rangeRaw && typeof rangeRaw === "string") {
      const allowed = ["day", "7d", "30d", "3m", "6m", "12m"] as const;
      range = (allowed as readonly string[]).includes(rangeRaw) ? (rangeRaw as typeof allowed[number]) : "30d";
    } else {
      range = "30d";
    }

    const { dailySeries, kpis } = await getOfferDashboard({
      workspaceId,
      offerId: offer.id,
      ...(startDate && endDate ? { startDate, endDate } : { range })
    });

    const headers = ["Data", "Investimento", "Faturamento", "Vendas", "Fee", "Lucro", "ROI (%)"];
    const csvRows: string[][] = [headers];

    // Filtrar apenas dias com dados relevantes (investimento > 0 ou faturamento > 0 ou vendas > 0)
    const relevantDays = dailySeries.filter((point) => 
      point.investment > 0 || point.revenue > 0 || point.sales > 0
    );

    for (const point of relevantDays) {
      csvRows.push([
        point.date,
        point.investment.toFixed(2),
        point.revenue.toFixed(2),
        point.sales.toString(),
        point.fee.toFixed(2),
        point.profit.toFixed(2),
        (point.roi * 100).toFixed(2)
      ]);
    }

    csvRows.push([]);
    csvRows.push([
      "TOTAL",
      kpis.investmentTotal.toFixed(2),
      kpis.revenueTotal.toFixed(2),
      kpis.salesTotal.toString(),
      kpis.feeTotal.toFixed(2),
      kpis.profitTotal.toFixed(2),
      (kpis.roiWeighted.toNumber() * 100).toFixed(2)
    ]);

    return generateCSV(csvRows);
  } catch (error) {
    console.error("Erro ao exportar oferta CSV:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao exportar oferta.");
  }
}
