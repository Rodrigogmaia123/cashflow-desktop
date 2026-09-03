import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getBudgetWithUsage,
  updateBudget,
  deleteBudget,
} from "@/lib/domain/budget";
import { updateBudgetSchema } from "@/types/budget";
import { ZodError } from "zod";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/budgets/[id]
 * Busca um orçamento específico por ID com informações de uso
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
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

    const params = await context.params;
    const budget = await getBudgetWithUsage(params.id, user.activeWorkspaceId);

    if (!budget) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ budget }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar orçamento" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/budgets/[id]
 * Atualiza um orçamento existente
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
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

    const params = await context.params;
    const body = await request.json();

    // Validar com Zod
    const validatedData = updateBudgetSchema.parse(body);

    // Atualizar orçamento
    const budget = await updateBudget(
      params.id,
      user.activeWorkspaceId,
      validatedData
    );

    return NextResponse.json(
      { budget, message: "Orçamento atualizado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar orçamento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budgets/[id]
 * Deleta um orçamento
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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

    const params = await context.params;
    await deleteBudget(params.id, user.activeWorkspaceId);

    return NextResponse.json(
      { message: "Orçamento deletado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar orçamento:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao deletar orçamento" },
      { status: 500 }
    );
  }
}
