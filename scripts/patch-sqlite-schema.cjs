/**
 * Atualiza um cashflow-desktop.db antigo para o schema atual (recorrentes).
 * Uso: node scripts/patch-sqlite-schema.cjs "C:\caminho\cashflow-desktop.db"
 */
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const input = process.argv[2];
if (!input) {
  console.error("Informe o caminho do cashflow-desktop.db");
  process.exit(1);
}

const dbPath = path.resolve(input);
if (!fs.existsSync(dbPath)) {
  console.error("Arquivo não encontrado:", dbPath);
  process.exit(1);
}

process.env.DATABASE_URL = "file:" + dbPath.replace(/\\/g, "/");

async function main() {
  const prisma = new PrismaClient();
  try {
    const expenseCols = await prisma.$queryRawUnsafe(
      `PRAGMA table_info("Expense")`
    );
    const hasRecurringId = expenseCols.some(
      (col) => col.name === "recurringExpenseId"
    );
    if (!hasRecurringId) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "Expense" ADD COLUMN "recurringExpenseId" TEXT`
      );
      console.log("Coluna Expense.recurringExpenseId criada.");
    }

    const rec = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='RecurringExpense'`
    );
    if (!rec.length) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "RecurringExpense" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "workspaceId" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "amount" DECIMAL NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'FIXED',
          "categoryId" TEXT,
          "dayOfMonth" INTEGER NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "startDate" DATETIME NOT NULL,
          "endDate" DATETIME,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RecurringExpense_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);
      console.log("Tabela RecurringExpense criada.");
    }

    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "RecurringExpense_workspaceId_isActive_idx" ON "RecurringExpense"("workspaceId", "isActive")`
    );

    const spendPlan = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='SpendPlan'`
    );
    if (!spendPlan.length) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "SpendPlan" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "workspaceId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "notes" TEXT,
          "cap" DECIMAL,
          "status" TEXT NOT NULL DEFAULT 'OPEN',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SpendPlan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "SpendPlanGroup" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "planId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "SpendPlanGroup_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SpendPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "SpendPlanItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "groupId" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "plannedAmount" DECIMAL NOT NULL,
          "actualAmount" DECIMAL,
          "paidAt" DATETIME,
          "skipped" BOOLEAN NOT NULL DEFAULT false,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "categoryId" TEXT,
          "expenseId" TEXT,
          CONSTRAINT "SpendPlanItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SpendPlanGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "SpendPlanItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "SpendPlanItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);
      console.log("Tabelas de projetos criadas.");
    }
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SpendPlan_workspaceId_status_idx" ON "SpendPlan"("workspaceId", "status")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SpendPlanGroup_planId_sortOrder_idx" ON "SpendPlanGroup"("planId", "sortOrder")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "SpendPlanItem_groupId_sortOrder_idx" ON "SpendPlanItem"("groupId", "sortOrder")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "SpendPlanItem_expenseId_key" ON "SpendPlanItem"("expenseId")`
    );

    console.log("Schema atualizado:", dbPath);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
