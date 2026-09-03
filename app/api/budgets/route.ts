import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  createBudget,
  listBudgetsWithUsage,
} from "@/lib/domain/budget";
import { createBudgetSchema } from "@/types/budget";
import { ZodError } from "zod";

/**
 * GET /api/budgets
 * Lista todos os orçamentos do workspace ativo com informações de uso
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
    const categoryId = searchParams.get("categoryId") || undefined;
    const periodType = searchParams.get("periodType") as "MONTHLY" | "CUSTOM" | undefined;
    const isActive = searchParams.get("isActive") === "true" ? true : undefined;

    const budgets = await listBudgetsWithUsage({
      workspaceId: user.activeWorkspaceId,
      categoryId,
      periodType,
      isActive,
    });

    return NextResponse.json({ budgets }, { status: 200 });
  } catch (error) {
    console.error("Erro ao listar orçamentos:", error);
    return NextResponse.json(
      { error: "Erro ao listar orçamentos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budgets
 * Cria um novo orçamento
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

    // Adicionar workspaceId ao body
    body.workspaceId = user.activeWorkspaceId;

    // Validar com Zod
    const validatedData = createBudgetSchema.parse(body);

    // Criar orçamento
    const budget = await createBudget(validatedData, user.id);

    return NextResponse.json(
      { budget, message: "Orçamento criado com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);

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
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    );
  }
}
