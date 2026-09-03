import { PrismaClient } from "@prisma/client";

const isServer = typeof window === "undefined";

function assertLocalSqliteOnly() {
  const url = process.env.DATABASE_URL ?? "";
  const lower = url.toLowerCase();
  const forbidden = [
    "postgresql://",
    "postgres://",
    "187.77.42.155",
    "cashflow-database",
    "getcashflow.pro",
  ];

  if (forbidden.some((token) => lower.includes(token.toLowerCase()))) {
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
