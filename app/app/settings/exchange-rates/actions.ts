"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { requireWorkspacePermission } from "@/lib/rbac/workspace-permissions";
import { CURRENCIES } from "@/lib/domain/currency";

const currencySchema = z.enum(CURRENCIES);

const upsertSchema = z
  .object({
    fromCurrency: currencySchema,
    toCurrency: currencySchema,
    rate: z.coerce.number().positive("A taxa deve ser maior que zero.")
  })
  .refine((d) => d.fromCurrency !== d.toCurrency, {
    message: "Moedas de origem e destino devem ser diferentes.",
    path: ["toCurrency"]
  });

const deleteSchema = z.object({
  id: z.string().cuid()
});

export async function listExchangeRates() {
  const workspaceId = await requireActiveWorkspaceId();
  return prisma.exchangeRateConfig.findMany({
    where: { workspaceId },
    orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }]
  });
}

export async function upsertExchangeRate(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    await requireWorkspacePermission(workspaceId, "edit");

    const parsed = upsertSchema.safeParse({
      fromCurrency: formData.get("fromCurrency"),
      toCurrency: formData.get("toCurrency"),
      rate: formData.get("rate")
    });

    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join(", ");
      throw new Error(msg || "Dados inválidos para taxa de câmbio.");
    }

    const { fromCurrency, toCurrency, rate } = parsed.data;

    await prisma.exchangeRateConfig.upsert({
      where: {
        workspaceId_fromCurrency_toCurrency: {
          workspaceId,
          fromCurrency,
          toCurrency
        }
      },
      create: {
        workspaceId,
        fromCurrency,
        toCurrency,
        rate: new Decimal(rate)
      },
      update: {
        rate: new Decimal(rate)
      }
    });

    revalidatePath("/app/settings/exchange-rates");
    revalidatePath("/app/dashboard");
    revalidatePath("/app/cashflow");
    revalidatePath("/app/overview");
  } catch (error) {
    console.error("Erro ao salvar taxa de câmbio:", error);
    throw new Error(
      error instanceof Error ? error.message : "Falha ao salvar taxa de câmbio."
    );
  }
}

export async function deleteExchangeRate(formData: FormData) {
  try {
    const workspaceId = await requireActiveWorkspaceId();
    await requireWorkspacePermission(workspaceId, "edit");

    const parsed = deleteSchema.safeParse({
      id: formData.get("id")
    });

    if (!parsed.success) {
      throw new Error("ID de taxa inválido.");
    }

    const existing = await prisma.exchangeRateConfig.findFirst({
      where: { id: parsed.data.id, workspaceId }
    });

    if (!existing) {
      throw new Error("Taxa de câmbio não encontrada neste workspace.");
    }

    await prisma.exchangeRateConfig.delete({
      where: { id: existing.id }
    });

    revalidatePath("/app/settings/exchange-rates");
  } catch (error) {
    console.error("Erro ao excluir taxa de câmbio:", error);
    throw new Error(
      error instanceof Error ? error.message : "Falha ao excluir taxa de câmbio."
    );
  }
}
