import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { renewBudget, renewAllMonthlyBudgets } from "@/lib/domain/period-report";
import { z } from "zod";

const renewBudgetSchema = z.object({
  budgetId: z.string().min(1),
  newStartDate: z.coerce.date().optional(),
  newEndDate: z.coerce.date().optional(),
  adjustAmount: z.number().optional(),
  adjustPercentage: z.number().optional(),
});

// POST /api/budgets/renew - Renovar um orçamento
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const workspaceId = await requireActiveWorkspaceId();
    const body = await request.json();

    // Verificar se é renovação em lote
    if (body.renewAll === true) {
      const results = await renewAllMonthlyBudgets(workspaceId, user.id);
      return NextResponse.json(
        {
          message: `${results.length} orçamentos renovados com sucesso`,
          results,
        },
        { status: 200 }
      );
    }

    // Renovação individual
    const input = renewBudgetSchema.parse(body);
    const result = await renewBudget(input, user.id);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error: any) {
    console.error("Error renewing budget:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao renovar orçamento" },
      { status: 500 }
    );
  }
}
