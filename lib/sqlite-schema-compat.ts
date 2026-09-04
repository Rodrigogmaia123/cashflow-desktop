import { prisma } from "@/lib/db";

type ColumnRow = { name: string };
type TableRow = { name: string };

async function tableExists(name: string) {
  const rows = await prisma.$queryRawUnsafe<TableRow[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${name}'`
  );
  return rows.length > 0;
}

async function columnNames(table: string) {
  const rows = await prisma.$queryRawUnsafe<ColumnRow[]>(`PRAGMA table_info("${table}")`);
  return new Set(rows.map((row) => row.name));
}

async function ensureColumn(table: string, column: string, definition: string) {
  if (!(await tableExists(table))) return;
  const cols = await columnNames(table);
  if (cols.has(column)) return;
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "${table}" ADD COLUMN ${definition}`
  );
}

async function ensureTable(sql: string) {
  await prisma.$executeRawUnsafe(sql);
}

/**
 * Atualiza o SQLite na primeira abertura de cada versão.
 * Só adiciona tabela/coluna/índice que faltam — nunca apaga lançamentos.
 * Builds futuras: incluir o CREATE/ALTER aqui (IF NOT EXISTS / ensureColumn).
 */
export async function ensureSqliteSchema() {
  if (!process.env.DATABASE_URL?.startsWith("file:")) return;

  await ensureColumn("Expense", "recurringExpenseId", `"recurringExpenseId" TEXT`);
  await ensureColumn("Expense", "paymentMethod", `"paymentMethod" TEXT`);
  await ensureColumn("Expense", "paymentBrand", `"paymentBrand" TEXT`);

  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "RecurringExpense" (
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

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "RecurringExpense_workspaceId_isActive_idx" ON "RecurringExpense"("workspaceId", "isActive")`
  );
  if (await tableExists("Expense")) {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Expense_recurringExpenseId_date_idx" ON "Expense"("recurringExpenseId", "date")`
    );
  }

  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "SpendPlan" (
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
  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "SpendPlanGroup" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "planId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "SpendPlanGroup_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SpendPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "SpendPlanItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "groupId" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "plannedAmount" DECIMAL NOT NULL,
      "actualAmount" DECIMAL,
      "paidAt" DATETIME,
      "skipped" BOOLEAN NOT NULL DEFAULT false,
      "repeatable" BOOLEAN NOT NULL DEFAULT false,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "categoryId" TEXT,
      "expenseId" TEXT,
      CONSTRAINT "SpendPlanItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "SpendPlanGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SpendPlanItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "SpendPlanItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

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

  await ensureColumn(
    "SpendPlanItem",
    "repeatable",
    `"repeatable" BOOLEAN NOT NULL DEFAULT false`
  );

  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "SpendPlanEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "itemId" TEXT NOT NULL,
      "expenseId" TEXT NOT NULL,
      "amount" DECIMAL NOT NULL,
      "note" TEXT,
      "date" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SpendPlanEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SpendPlanItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "SpendPlanEntry_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "SpendPlanEntry_expenseId_key" ON "SpendPlanEntry"("expenseId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "SpendPlanEntry_itemId_date_idx" ON "SpendPlanEntry"("itemId", "date")`
  );

  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "SpendPlanEntry" ("id", "itemId", "expenseId", "amount", "note", "date", "createdAt")
      SELECT "expenseId", "id", "expenseId", COALESCE("actualAmount", "plannedAmount"), NULL,
             COALESCE("paidAt", CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
      FROM "SpendPlanItem"
      WHERE "expenseId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "SpendPlanEntry" e WHERE e."expenseId" = "SpendPlanItem"."expenseId"
        )
    `);
  } catch (error) {
    console.error("Backfill SpendPlanEntry:", error);
  }

  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "License" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "serialHash" TEXT NOT NULL,
      "serialCipher" TEXT,
      "serialEmailedAt" DATETIME,
      "edition" TEXT NOT NULL,
      "duration" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'paid',
      "stripeSessionId" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "activatedAt" DATETIME,
      "expiresAt" DATETIME,
      "machineId" TEXT,
      "revokedAt" DATETIME,
      "revokedByUserId" TEXT,
      "revokedByEmail" TEXT,
      "revokeReason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "License_serialHash_key" ON "License"("serialHash")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "License_stripeSessionId_key" ON "License"("stripeSessionId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "License_email_idx" ON "License"("email")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "License_status_idx" ON "License"("status")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "License_machineId_idx" ON "License"("machineId")`
  );
  await ensureColumn("License", "serialCipher", `"serialCipher" TEXT`);
  await ensureColumn("License", "serialEmailedAt", `"serialEmailedAt" DATETIME`);
  await ensureColumn("License", "revokedAt", `"revokedAt" DATETIME`);
  await ensureColumn("License", "revokedByUserId", `"revokedByUserId" TEXT`);
  await ensureColumn("License", "revokedByEmail", `"revokedByEmail" TEXT`);
  await ensureColumn("License", "revokeReason", `"revokeReason" TEXT`);

  await ensureTable(`
    CREATE TABLE IF NOT EXISTS "LicenseOrder" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "stripeSessionId" TEXT NOT NULL,
      "stripePaymentIntentId" TEXT,
      "email" TEXT,
      "edition" TEXT NOT NULL,
      "duration" TEXT NOT NULL,
      "amountCents" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'brl',
      "status" TEXT NOT NULL DEFAULT 'generated',
      "failureReason" TEXT,
      "utmSource" TEXT,
      "utmMedium" TEXT,
      "utmCampaign" TEXT,
      "licenseId" TEXT,
      "paidAt" DATETIME,
      "failedAt" DATETIME,
      "canceledAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "LicenseOrder_stripeSessionId_key" ON "LicenseOrder"("stripeSessionId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "LicenseOrder_status_idx" ON "LicenseOrder"("status")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "LicenseOrder_email_idx" ON "LicenseOrder"("email")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "LicenseOrder_createdAt_idx" ON "LicenseOrder"("createdAt")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "LicenseOrder_stripePaymentIntentId_idx" ON "LicenseOrder"("stripePaymentIntentId")`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "LicenseOrder_licenseId_idx" ON "LicenseOrder"("licenseId")`
  );
}

let ensuring: Promise<void> | null = null;

export function ensureSqliteSchemaOnce() {
  if (!ensuring) {
    ensuring = ensureSqliteSchema().catch((error) => {
      ensuring = null;
      throw error;
    });
  }
  return ensuring;
}
