import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { generatePeriodReport } from "@/lib/domain/period-report";
import { periodReportFiltersSchema } from "@/types/report";

// GET /api/reports/period - Gerar relatório de período
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const { searchParams } = new URL(request.url);

    const filters = periodReportFiltersSchema.parse({
      workspaceId,
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      categoryIds: searchParams.get("categoryIds")
        ? searchParams.get("categoryIds")!.split(",")
        : undefined,
    });

    console.log("[Period Report] Filtros recebidos:", {
      workspaceId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      categoryIds: filters.categoryIds,
    });

    const report = await generatePeriodReport(filters);

    console.log("[Period Report] Relatório gerado:", {
      totalBudgeted: report.totalBudgeted,
      totalSpent: report.totalSpent,
      categoriesWithBudget: report.categoriesWithBudget,
      categoriesCount: report.categories.length,
    });

    return NextResponse.json({ report }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating period report:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
