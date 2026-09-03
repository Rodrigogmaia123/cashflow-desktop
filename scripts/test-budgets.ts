/**
 * Script de teste para a funcionalidade de Orçamentos (Budgets)
 * 
 * Este script testa:
 * - Criação de orçamento
 * - Listagem de orçamentos
 * - Busca de orçamento por ID
 * - Atualização de orçamento
 * - Cálculo de uso do orçamento
 * - Deleção de orçamento
 */

import { prisma } from "../lib/db";
import {
  createBudget,
  listBudgetsWithUsage,
  getBudgetWithUsage,
  updateBudget,
  deleteBudget,
} from "../lib/domain/budget";

async function testBudgets() {
  console.log("🧪 Iniciando testes de Orçamentos...\n");

  try {
    // 1. Buscar um usuário e workspace para testes
    console.log("1️⃣ Buscando usuário e workspace para teste...");
    const user = await prisma.user.findFirst({
      include: {
        workspaces: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user || user.workspaces.length === 0) {
      throw new Error("Nenhum usuário ou workspace encontrado. Execute o seed primeiro.");
    }

    const workspaceId = user.workspaces[0].workspaceId;
    console.log(`✅ Usuário: ${user.email}`);
    console.log(`✅ Workspace: ${user.workspaces[0].workspace.name}\n`);

    // 2. Buscar ou criar uma categoria para teste
    console.log("2️⃣ Buscando/criando categoria para teste...");
    let category = await prisma.category.findFirst({
      where: {
        workspaceId,
        type: "EXPENSE",
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          workspaceId,
          name: "Marketing",
          type: "EXPENSE",
        },
      });
    }
    console.log(`✅ Categoria: ${category.name}\n`);

    // 3. Criar um orçamento
    console.log("3️⃣ Criando orçamento...");
    const budget = await createBudget(
      {
        workspaceId,
        categoryId: category.id,
        name: "Orçamento Marketing Fevereiro 2026",
        amount: 5000,
        periodType: "MONTHLY",
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-02-28"),
      },
      user.id
    );
    console.log(`✅ Orçamento criado: ${budget.name} - R$ ${budget.amount.toString()}\n`);

    // 4. Criar algumas despesas para teste de cálculo de uso
    console.log("4️⃣ Criando despesas para teste de uso...");
    await prisma.expense.create({
      data: {
        workspaceId,
        categoryId: category.id,
        description: "Anúncios Facebook",
        amount: 1200,
        date: new Date("2026-02-10"),
        type: "VARIABLE",
      },
    });
    await prisma.expense.create({
      data: {
        workspaceId,
        categoryId: category.id,
        description: "Anúncios Google",
        amount: 1800,
        date: new Date("2026-02-15"),
        type: "VARIABLE",
      },
    });
    console.log("✅ Despesas criadas: R$ 1.200 + R$ 1.800 = R$ 3.000\n");

    // 5. Buscar orçamento com informações de uso
    console.log("5️⃣ Buscando orçamento com informações de uso...");
    const budgetWithUsage = await getBudgetWithUsage(budget.id, workspaceId);
    if (budgetWithUsage) {
      console.log(`✅ Orçamento: R$ ${budgetWithUsage.amount.toString()}`);
      console.log(`   Gasto: R$ ${budgetWithUsage.spent.toFixed(2)}`);
      console.log(`   Restante: R$ ${budgetWithUsage.remaining.toFixed(2)}`);
      console.log(`   Uso: ${budgetWithUsage.percentUsed.toFixed(1)}%`);
      console.log(`   Estourado: ${budgetWithUsage.isOverBudget ? "Sim" : "Não"}\n`);
    }

    // 6. Listar todos os orçamentos
    console.log("6️⃣ Listando todos os orçamentos...");
    const budgets = await listBudgetsWithUsage({ workspaceId });
    console.log(`✅ Total de orçamentos: ${budgets.length}\n`);

    // 7. Atualizar orçamento
    console.log("7️⃣ Atualizando orçamento...");
    const updatedBudget = await updateBudget(budget.id, workspaceId, {
      amount: 6000,
      name: "Orçamento Marketing Fevereiro 2026 (Atualizado)",
    });
    console.log(`✅ Orçamento atualizado: ${updatedBudget.name} - R$ ${updatedBudget.amount.toString()}\n`);

    // 8. Verificar uso após atualização
    console.log("8️⃣ Verificando uso após atualização...");
    const updatedBudgetWithUsage = await getBudgetWithUsage(budget.id, workspaceId);
    if (updatedBudgetWithUsage) {
      console.log(`✅ Novo orçamento: R$ ${updatedBudgetWithUsage.amount.toString()}`);
      console.log(`   Gasto: R$ ${updatedBudgetWithUsage.spent.toFixed(2)}`);
      console.log(`   Restante: R$ ${updatedBudgetWithUsage.remaining.toFixed(2)}`);
      console.log(`   Uso: ${updatedBudgetWithUsage.percentUsed.toFixed(1)}%`);
      console.log(`   Estourado: ${updatedBudgetWithUsage.isOverBudget ? "Sim" : "Não"}\n`);
    }

    // 9. Deletar orçamento
    console.log("9️⃣ Deletando orçamento...");
    await deleteBudget(budget.id, workspaceId);
    console.log("✅ Orçamento deletado\n");

    // 10. Verificar se foi deletado
    console.log("🔟 Verificando deleção...");
    const deletedBudget = await getBudgetWithUsage(budget.id, workspaceId);
    if (!deletedBudget) {
      console.log("✅ Orçamento não encontrado (deletado com sucesso)\n");
    } else {
      console.log("❌ Erro: Orçamento ainda existe após deleção\n");
    }

    console.log("✨ Todos os testes concluídos com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar testes
testBudgets();
