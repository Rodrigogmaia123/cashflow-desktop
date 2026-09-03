"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { checkFeatureAccess, checkCustomReportsLimit } from "@/lib/plans/authorization";
import { trackEvent } from "@/lib/analytics/events";
import type { ReportType, ReportVisualization } from "@/lib/prisma-enums";

const saveReportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["CASHFLOW", "BY_CATEGORY", "BY_PERIOD"]),
  filters: z.string(), // JSON string com { startDate, endDate, categories?, transactionType? }
  visualization: z.enum(["TABLE", "LINE_CHART", "BAR_CHART"]),
});

export async function saveReportAction(formData: FormData) {
  try {
    // Verifica feature access
    const featureCheck = await checkFeatureAccess("custom_reports");
    if (!featureCheck.allowed) {
      throw new Error(featureCheck.reason || "Relatórios personalizados disponíveis apenas no plano BUSINESS");
    }

    // Verifica limite de relatórios
    const limitCheck = await checkCustomReportsLimit();
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.reason || "Limite de relatórios atingido. Faça upgrade para criar mais relatórios.");
    }

    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const parsed = saveReportSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      type: formData.get("type"),
      filters: formData.get("filters"),
      visualization: formData.get("visualization"),
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para salvar relatório");
    }

    // Valida que filters é JSON válido
    try {
      JSON.parse(parsed.data.filters);
    } catch {
      throw new Error("Filtros do relatório inválidos");
    }

    await prisma.savedReport.create({
      data: {
        workspaceId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        type: parsed.data.type as ReportType,
        filters: parsed.data.filters,
        visualization: parsed.data.visualization as ReportVisualization,
        createdBy: user.id,
      },
    });

    await trackEvent("custom_report_saved", {
      workspaceId,
      feature: "custom_reports",
      metadata: {
        reportType: parsed.data.type,
      },
    });

    revalidatePath("/app/settings/reports");
    revalidatePath("/app/cashflow");
  } catch (error) {
    console.error("Erro ao salvar relatório:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao salvar relatório");
  }
}

export async function deleteReportAction(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();
    const reportId = formData.get("id");

    if (!user || typeof reportId !== "string") {
      throw new Error("Dados inválidos");
    }

    await prisma.savedReport.delete({
      where: {
        id: reportId,
        workspaceId, // Garante que o relatório pertence ao workspace
      },
    });

    revalidatePath("/app/settings/reports");
  } catch (error) {
    console.error("Erro ao deletar relatório:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao deletar relatório");
  }
}

export async function getSavedReports(workspaceId: string) {
  return prisma.savedReport.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Carrega um relatório salvo e retorna os filtros para aplicar
 */
export async function loadReportAction(reportId: string) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const report = await prisma.savedReport.findFirst({
      where: {
        id: reportId,
        workspaceId,
      },
    });

    if (!report) {
      throw new Error("Relatório não encontrado");
    }

    // Parse dos filtros
    const filters = JSON.parse(report.filters);

    await trackEvent("custom_report_loaded", {
      workspaceId,
      feature: "custom_reports",
      metadata: {
        reportId: report.id,
        reportType: report.type,
      },
    });

    return {
      success: true,
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        filters,
        visualization: report.visualization,
      },
    };
  } catch (error) {
    console.error("Erro ao carregar relatório:", error);
    throw new Error(error instanceof Error ? error.message : "Falha ao carregar relatório");
  }
}

