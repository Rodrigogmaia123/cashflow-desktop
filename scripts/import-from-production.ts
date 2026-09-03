/**
 * Cópia unidirecional: lê PostgreSQL (produção) e grava só no SQLite local.
 * Nunca faz INSERT/UPDATE/DELETE na origem.
 *
 * Uso:
 *   SOURCE_DATABASE_URL=... IMPORT_EMAIL=voce@email.com npx tsx scripts/import-from-production.ts
 *   SOURCE_DATABASE_URL=... npx tsx scripts/import-from-production.ts --list-users
 */
import "dotenv/config";
import { Client } from "pg";
import { prisma } from "../lib/db";
import { writeFileSync, readFileSync } from "fs";
import path from "path";

const SOURCE_URL = process.env.SOURCE_DATABASE_URL ?? "";
const IMPORT_EMAIL = (process.env.IMPORT_EMAIL ?? "").trim().toLowerCase();
const LIST_ONLY = process.argv.includes("--list-users");
const ROOT = path.join(__dirname, "..");

function assertSafety() {
  const dest = process.env.DATABASE_URL ?? "";
  if (!SOURCE_URL.startsWith("postgres")) {
    throw new Error("SOURCE_DATABASE_URL precisa ser PostgreSQL (somente leitura).");
  }
  if (!dest.startsWith("file:")) {
    throw new Error("DATABASE_URL de destino precisa ser SQLite local (file:...). Abortando para não gravar em produção.");
  }
  const lower = SOURCE_URL.toLowerCase();
  if (lower.includes("file:")) {
    throw new Error("Origem inválida.");
  }
}

function asDate(value: unknown): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function asDateRequired(value: unknown): Date {
  return asDate(value) ?? new Date();
}

function asDec(value: unknown): string {
  if (value == null) return "0";
  return String(value);
}

async function select<T extends Record<string, unknown>>(
  source: Client,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await source.query(sql, params);
  return result.rows as T[];
}

async function createInChunks<T extends object>(
  label: string,
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>
) {
  const size = 40;
  for (let i = 0; i < rows.length; i += size) {
    await insert(rows.slice(i, i + size));
  }
  console.log(`  ${label}: ${rows.length}`);
}

function setDesktopEmailInEnvFiles(email: string) {
  const files = [".env", ".env.development.local", ".env.production.local"];
  for (const name of files) {
    const filePath = path.join(ROOT, name);
    let text = "";
    try {
      text = readFileSync(filePath, "utf8");
    } catch {
      continue;
    }
    if (/^DESKTOP_USER_EMAIL=/m.test(text)) {
      text = text.replace(/^DESKTOP_USER_EMAIL=.*$/m, `DESKTOP_USER_EMAIL="${email}"`);
    } else {
      text += `\nDESKTOP_USER_EMAIL="${email}"\n`;
    }
    writeFileSync(filePath, text);
  }
}

async function wipeLocal() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  await prisma.budgetNotification.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.savedReport.deleteMany();
  await prisma.workspaceInvite.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.dailyPerformance.deleteMany();
  await prisma.periodPerformance.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.manualIncome.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.exchangeRateConfig.deleteMany();
  await prisma.feeProfile.deleteMany();
  await prisma.workspaceFeeConfig.deleteMany();
  await prisma.personalExpense.deleteMany();
  await prisma.userWorkspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.stripeCustomer.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.metricEvent.deleteMany();
  await prisma.user.updateMany({ data: { activeWorkspaceId: null } });
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

async function main() {
  assertSafety();

  const source = new Client({
    connectionString: SOURCE_URL,
    ssl: false,
    statement_timeout: 30000,
  });

  await source.connect();
  await source.query("SET default_transaction_read_only = on");

  try {
    if (LIST_ONLY) {
      const users = await select<{ email: string; name: string | null; plan: string }>(
        source,
        `SELECT email, name, plan FROM "User" ORDER BY "createdAt" ASC`
      );
      console.log("Contas na origem (somente leitura):");
      for (const user of users) {
        console.log(`- ${user.email} | ${user.name ?? "-"} | ${user.plan}`);
      }
      return;
    }

    if (!IMPORT_EMAIL) {
      throw new Error("Defina IMPORT_EMAIL com o e-mail da conta de produção.");
    }

    const usersFound = await select<{ id: string }>(
      source,
      `SELECT id FROM "User" WHERE lower(email) = $1 LIMIT 1`,
      [IMPORT_EMAIL]
    );
    const owner = usersFound[0];
    if (!owner) {
      throw new Error(`Conta não encontrada na origem: ${IMPORT_EMAIL}`);
    }

    const memberships = await select<{ userId: string; workspaceId: string; role: string }>(
      source,
      `SELECT "userId", "workspaceId", role FROM "UserWorkspace" WHERE "userId" = $1`,
      [owner.id]
    );
    const workspaceIds = memberships.map((m) => m.workspaceId);
    if (workspaceIds.length === 0) {
      throw new Error("Essa conta não tem workspace na origem.");
    }

    const inWs = `IN (${workspaceIds.map((_, i) => `$${i + 1}`).join(", ")})`;

    const allMemberships = await select<{ userId: string; workspaceId: string; role: string }>(
      source,
      `SELECT "userId", "workspaceId", role FROM "UserWorkspace" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const userIds = [...new Set(allMemberships.map((m) => m.userId))];
    const inUsers = `IN (${userIds.map((_, i) => `$${i + 1}`).join(", ")})`;

    console.log(`Origem: leitura da conta ${IMPORT_EMAIL}`);
    console.log(`Workspaces: ${workspaceIds.length} | usuários relacionados: ${userIds.length}`);
    console.log("Destino: SQLite local (produção não será alterada)");

    const users = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "User" WHERE id ${inUsers}`,
      userIds
    );
    const workspaces = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "Workspace" WHERE id ${inWs}`,
      workspaceIds
    );
    const feeConfigs = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "WorkspaceFeeConfig" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const feeProfiles = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "FeeProfile" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const rates = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "ExchangeRateConfig" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const categories = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "Category" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const offers = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "Offer" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const offerIds = offers.map((o) => String(o.id));
    const inOffers =
      offerIds.length > 0
        ? `IN (${offerIds.map((_, i) => `$${i + 1}`).join(", ")})`
        : null;

    const dailies = inOffers
      ? await select<Record<string, unknown>>(
          source,
          `SELECT * FROM "DailyPerformance" WHERE "offerId" ${inOffers}`,
          offerIds
        )
      : [];
    const periods = inOffers
      ? await select<Record<string, unknown>>(
          source,
          `SELECT * FROM "PeriodPerformance" WHERE "offerId" ${inOffers}`,
          offerIds
        )
      : [];
    const expenses = await select<Record<string, unknown>>(
      source,
      `SELECT id, "workspaceId", date, tag AS description, amount, type, "categoryId", "createdAt" FROM "Expense" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const incomes = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "ManualIncome" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const investments = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "Investment" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const personal = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "PersonalExpense" WHERE "userId" ${inUsers}`,
      userIds
    );
    const apiKeys = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "ApiKey" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const invites = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "WorkspaceInvite" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const reports = await select<Record<string, unknown>>(
      source,
      `SELECT id, "workspaceId", name, description, type, filters_json AS filters, visualization, "createdBy", "createdAt", "updatedAt" FROM "SavedReport" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const budgets = await select<Record<string, unknown>>(
      source,
      `SELECT * FROM "Budget" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );
    const notifications = await select<Record<string, unknown>>(
      source,
      `SELECT id, "workspaceId", "budgetId", "userId", type, status, title, message, metadata_json AS metadata, "createdAt", "readAt", "dismissedAt" FROM "BudgetNotification" WHERE "workspaceId" ${inWs}`,
      workspaceIds
    );

    await wipeLocal();

    await createInChunks("users", users, (chunk) =>
      prisma.user.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          name: (row.name as string | null) ?? null,
          email: String(row.email),
          password: (row.password as string | null) ?? null,
          accountType: (row.accountType as string | null) ?? null,
          plan: String(row.plan ?? "BUSINESS"),
          isLifetime: Boolean(row.isLifetime),
          isAdmin: Boolean(row.isAdmin),
          resetPasswordToken: null,
          resetPasswordExpires: null,
          createdAt: asDateRequired(row.createdAt),
          emailVerified: asDate(row.emailVerified),
          image: (row.image as string | null) ?? null,
          onboardingCompleted: true,
          stripeCustomerId: null,
          activeWorkspaceId: null,
        })),
      })
    );

    await createInChunks("workspaces", workspaces, (chunk) =>
      prisma.workspace.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          name: String(row.name),
          baseCurrency: String(row.baseCurrency ?? "BRL"),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("memberships", allMemberships, (chunk) =>
      prisma.userWorkspace.createMany({
        data: chunk.map((row) => ({
          userId: row.userId,
          workspaceId: row.workspaceId,
          role: String(row.role ?? "OWNER"),
        })),
      })
    );

    for (const row of users) {
      const active = row.activeWorkspaceId ? String(row.activeWorkspaceId) : null;
      if (active && workspaceIds.includes(active)) {
        await prisma.user.update({
          where: { id: String(row.id) },
          data: { activeWorkspaceId: active },
        });
      } else if (String(row.id) === owner.id && workspaceIds[0]) {
        await prisma.user.update({
          where: { id: String(row.id) },
          data: { activeWorkspaceId: workspaceIds[0] },
        });
      }
    }

    await createInChunks("feeConfigs", feeConfigs, (chunk) =>
      prisma.workspaceFeeConfig.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          checkoutPercentage: asDec(row.checkoutPercentage),
          gatewayFeePerSale: asDec(row.gatewayFeePerSale),
          taxPercentage: asDec(row.taxPercentage),
          currency: String(row.currency ?? "BRL"),
        })),
      })
    );

    await createInChunks("feeProfiles", feeProfiles, (chunk) =>
      prisma.feeProfile.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          name: String(row.name),
          checkoutPercentage: asDec(row.checkoutPercentage),
          gatewayFeePerSale: asDec(row.gatewayFeePerSale),
          taxPercentage: asDec(row.taxPercentage),
          currency: String(row.currency ?? "BRL"),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("exchangeRates", rates, (chunk) =>
      prisma.exchangeRateConfig.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          fromCurrency: String(row.fromCurrency),
          toCurrency: String(row.toCurrency),
          rate: asDec(row.rate),
          updatedAt: asDateRequired(row.updatedAt),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("categories", categories, (chunk) =>
      prisma.category.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          name: String(row.name),
          type: String(row.type),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("offers", offers, (chunk) =>
      prisma.offer.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          name: String(row.name),
          status: String(row.status ?? "ACTIVE"),
          country: (row.country as string | null) ?? null,
          currency: String(row.currency ?? "BRL"),
          createdAt: asDateRequired(row.createdAt),
          feeProfileId: (row.feeProfileId as string | null) ?? null,
        })),
      })
    );

    await createInChunks("dailyPerformances", dailies, (chunk) =>
      prisma.dailyPerformance.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          offerId: String(row.offerId),
          date: asDateRequired(row.date),
          investment: asDec(row.investment),
          revenue: asDec(row.revenue),
          sales: Number(row.sales ?? 0),
          comment: (row.comment as string | null) ?? null,
          createdAt: asDateRequired(row.createdAt),
          checkoutPercentageSnapshot: asDec(row.checkoutPercentageSnapshot),
          gatewayFeePerSaleSnapshot: asDec(row.gatewayFeePerSaleSnapshot),
          taxPercentageSnapshot: asDec(row.taxPercentageSnapshot),
          currency: String(row.currency ?? "BRL"),
          exchangeRateSnapshot: asDec(row.exchangeRateSnapshot ?? 1),
        })),
      })
    );

    await createInChunks("periodPerformances", periods, (chunk) =>
      prisma.periodPerformance.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          offerId: String(row.offerId),
          startDate: asDateRequired(row.startDate),
          endDate: asDateRequired(row.endDate),
          investment: asDec(row.investment),
          revenue: asDec(row.revenue),
          sales: Number(row.sales ?? 0),
          fee: asDec(row.fee),
          roi: asDec(row.roi),
          profit: asDec(row.profit),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("expenses", expenses, (chunk) =>
      prisma.expense.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          date: asDateRequired(row.date),
          description: String(row.description ?? ""),
          amount: asDec(row.amount),
          type: String(row.type ?? "VARIABLE"),
          categoryId: (row.categoryId as string | null) ?? null,
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("manualIncomes", incomes, (chunk) =>
      prisma.manualIncome.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          description: String(row.description ?? ""),
          amount: asDec(row.amount),
          date: asDateRequired(row.date),
          categoryId: (row.categoryId as string | null) ?? null,
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("investments", investments, (chunk) =>
      prisma.investment.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          description: String(row.description ?? ""),
          amount: asDec(row.amount),
          date: asDateRequired(row.date),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("personalExpenses", personal, (chunk) =>
      prisma.personalExpense.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          userId: String(row.userId),
          tag: String(row.tag ?? ""),
          amount: asDec(row.amount),
          date: asDateRequired(row.date),
        })),
      })
    );

    await createInChunks("apiKeys", apiKeys, (chunk) =>
      prisma.apiKey.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          name: String(row.name),
          key: String(row.key),
          keyPrefix: String(row.keyPrefix),
          lastUsedAt: asDate(row.lastUsedAt),
          createdAt: asDateRequired(row.createdAt),
          expiresAt: asDate(row.expiresAt),
        })),
      })
    );

    await createInChunks("invites", invites, (chunk) =>
      prisma.workspaceInvite.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          email: String(row.email),
          role: String(row.role),
          status: String(row.status ?? "PENDING"),
          token: String(row.token),
          invitedBy: String(row.invitedBy),
          expiresAt: asDateRequired(row.expiresAt),
          acceptedAt: asDate(row.acceptedAt),
          createdAt: asDateRequired(row.createdAt),
        })),
      })
    );

    await createInChunks("savedReports", reports, (chunk) =>
      prisma.savedReport.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          name: String(row.name),
          description: (row.description as string | null) ?? null,
          type: String(row.type ?? "CASHFLOW"),
          filters: String(row.filters ?? "{}"),
          visualization: String(row.visualization ?? "TABLE"),
          createdBy: String(row.createdBy),
          createdAt: asDateRequired(row.createdAt),
          updatedAt: asDateRequired(row.updatedAt),
        })),
      })
    );

    await createInChunks("budgets", budgets, (chunk) =>
      prisma.budget.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          categoryId: String(row.categoryId),
          name: String(row.name),
          amount: asDec(row.amount),
          periodType: String(row.periodType ?? "MONTHLY"),
          startDate: asDateRequired(row.startDate),
          endDate: asDateRequired(row.endDate),
          createdBy: String(row.createdBy),
          createdAt: asDateRequired(row.createdAt),
          updatedAt: asDateRequired(row.updatedAt),
        })),
      })
    );

    await createInChunks("budgetNotifications", notifications, (chunk) =>
      prisma.budgetNotification.createMany({
        data: chunk.map((row) => ({
          id: String(row.id),
          workspaceId: String(row.workspaceId),
          budgetId: String(row.budgetId),
          userId: String(row.userId),
          type: String(row.type),
          status: String(row.status ?? "UNREAD"),
          title: String(row.title),
          message: String(row.message),
          metadata: (row.metadata as string | null) ?? null,
          createdAt: asDateRequired(row.createdAt),
          readAt: asDate(row.readAt),
          dismissedAt: asDate(row.dismissedAt),
        })),
      })
    );

    setDesktopEmailInEnvFiles(IMPORT_EMAIL);
    console.log("Importação concluída. Produção não foi alterada.");
    console.log(`Desktop vai abrir como: ${IMPORT_EMAIL}`);
  } finally {
    await source.end();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
