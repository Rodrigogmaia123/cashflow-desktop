import { PrismaClient } from "@prisma/client";

const isServer = typeof window === "undefined";

const DEFAULT_SQLITE_URL = "file:../data/cashflow-desktop.db";

function isDesktopRuntime() {
  return (
    process.env.DESKTOP_MODE === "true" ||
    process.env.NEXT_PUBLIC_DESKTOP_MODE === "true"
  );
}

function assertLocalSqliteOnly() {
  let url = process.env.DATABASE_URL ?? "";
  const lower = url.toLowerCase();
  const looksRemote =
    lower.startsWith("postgresql://") ||
    lower.startsWith("postgres://") ||
    lower.includes("187.77.42.155") ||
    lower.includes("cashflow-database");

  if (!isDesktopRuntime()) {
    if (!url.startsWith("file:") || looksRemote) {
      process.env.DATABASE_URL = DEFAULT_SQLITE_URL;
    }
    return;
  }

  if (looksRemote || lower.includes("getcashflow.pro")) {
    throw new Error(
      "Esta cópia desktop recusou uma conexão PostgreSQL/produção. Use só SQLite local (DATABASE_URL começando com file:)."
    );
  }

  if (!url.startsWith("file:")) {
    throw new Error(
      "Esta cópia desktop exige DATABASE_URL SQLite no formato file:../data/cashflow-desktop.db"
    );
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma() {
  assertLocalSqliteOnly();
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient = isServer
  ? (globalForPrisma.prisma ?? createPrisma())
  : (null as unknown as PrismaClient);

if (isServer && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
