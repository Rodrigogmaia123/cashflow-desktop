import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type FinancialHealthStatus = "healthy" | "neutral" | "risk";

export function getFinancialHealth(netProfit: number | Decimal) {
  const value = typeof netProfit === "number" ? netProfit : netProfit.toNumber();

  if (value > 0) return { status: "healthy" as const, label: "Saudável" };
  if (value === 0) return { status: "neutral" as const, label: "Atenção" };
  return { status: "risk" as const, label: "Risco" };
}


