import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkExpenseImpact } from "@/lib/domain/budget-analytics";
import { z } from "zod";

const expenseImpactSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  date: z.coerce.date(),
});

/**
 * POST /api/budgets/check-impact
 * Verifica o impacto de uma despesa nos orçamentos antes de salvá-la
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = expenseImpactSchema.parse(body);

    const impact = await checkExpenseImpact(
      user.activeWorkspaceId,
      validatedData.categoryId,
      validatedData.amount,
      validatedData.date
    );

    return NextResponse.json(
      {
        impact,
        hasImpact: impact.affectedBudgets.length > 0,
        willExceed: impact.willExceed,
        alertsCount: impact.newAlerts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao verificar impacto:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao verificar impacto" },
      { status: 500 }
    );
  }
}
