import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getBudgetSummary, getCriticalAlerts } from "@/lib/domain/budget-analytics";

/**
 * GET /api/budgets/status
 * Retorna resumo e status geral de todos os orçamentos ativos
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!user.activeWorkspaceId) {
      return NextResponse.json(
        { error: "Nenhum workspace ativo" },
        { status: 400 }
      );
    }

    // Buscar parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const onlyCritical = searchParams.get("onlyCritical") === "true";

    if (onlyCritical) {
      // Retornar apenas alertas críticos
      const criticalAlerts = await getCriticalAlerts(user.activeWorkspaceId);
      return NextResponse.json(
        {
          alerts: criticalAlerts,
          count: criticalAlerts.length,
        },
        { status: 200 }
      );
    }

    // Retornar resumo completo
    const summary = await getBudgetSummary(user.activeWorkspaceId);

    return NextResponse.json(
      {
        summary,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar status dos orçamentos:", error);
    
    // Log detalhado para debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao buscar status dos orçamentos",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
