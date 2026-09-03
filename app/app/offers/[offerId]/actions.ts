"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  calculateDailyMetrics,
  calculateRoiAndProfit
} from "@/lib/domain/finance";
import { persistDailyPerformance } from "@/lib/domain/persist-daily-performance";
import {
  formatUtcShort,
  utcDateFromKey,
  utcKey
} from "@/lib/utils/date-utc";
import { measure } from "@/lib/observability/measure";
import { checkTransactionLimit, requireAdvancedReports, requireHistoricalAnalysis } from "@/lib/plans/authorization";
import { requireWorkspacePermission } from "@/lib/rbac/workspace-permissions";

const createDailyPerformanceSchema = z.object({
  offerId: z.string().cuid(),
  date: z.coerce.date(),
  investment: z.coerce.number().nonnegative(),
  revenue: z.coerce.number().nonnegative(),
  sales: z.coerce.number().int().nonnegative(),
  comment: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(2000).optional()
  )
});

const updateDailyPerformanceSchema = z.object({
  id: z.string().cuid(),
  offerId: z.string().cuid(),
  date: z.coerce.date(),
  investment: z.coerce.number().nonnegative(),
  revenue: z.coerce.number().nonnegative(),
  sales: z.coerce.number().int().nonnegative(),
  comment: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().max(2000).optional()
  )
});

const deleteDailyPerformanceSchema = z.object({
  id: z.string().cuid(),
  offerId: z.string().cuid()
});

const updateOfferFeeProfileSchema = z.object({
  offerId: z.string().cuid(),
  feeProfileId: z.string().cuid()
});

const analyzeOfferPeriodSchema = z
  .object({
    offerId: z.string().cuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  })
  .refine(
    (data) => data.startDate <= data.endDate,
    "Data inicial deve ser menor ou igual à data final."
  );

export async function createDailyPerformance(formData: FormData) {
  return measure(
    "action.createDailyPerformance",
    async () => {
      try {
        const workspaceId = await requireActiveWorkspaceId();
        
        // Verifica permissão de criar
        await requireWorkspacePermission(workspaceId, "create");
        
        // Verifica limite de transações mensais
        const transactionCheck = await checkTransactionLimit();
        if (!transactionCheck.allowed) {
          throw new Error(transactionCheck.reason || "Limite de lançamentos mensais atingido. Faça upgrade para continuar.");
        }

        const parsed = createDailyPerformanceSchema.safeParse({
          offerId: formData.get("offerId"),
          date: formData.get("date"),
          investment: formData.get("investment"),
          revenue: formData.get("revenue"),
          sales: formData.get("sales"),
          comment: formData.get("comment")
        });

        if (!parsed.success) {
          throw new Error("Dados inválidos para performance diária.");
        }

        const { offerId } = await persistDailyPerformance({
          workspaceId,
          offerId: parsed.data.offerId,
          date: parsed.data.date,
          investment: parsed.data.investment,
          revenue: parsed.data.revenue,
          sales: parsed.data.sales,
          comment: parsed.data.comment ?? null,
          ifExists: "update"
        });

        revalidatePath(`/app/offers/${offerId}`);
        revalidatePath(`/app/offers/${offerId}/dashboard`);
        revalidatePath("/app/dashboard");
        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao criar performance diária:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao criar lançamento diário.");
      }
    },
    {}
  );
}

export async function updateDailyPerformance(formData: FormData) {
  return measure(
    "action.updateDailyPerformance",
    async () => {
      try {
    const workspaceId = await requireActiveWorkspaceId();
    
    // Verifica permissão de editar
    await requireWorkspacePermission(workspaceId, "edit");

    const parsed = updateDailyPerformanceSchema.safeParse({
      id: formData.get("id"),
      offerId: formData.get("offerId"),
      date: formData.get("date"),
      investment: formData.get("investment"),
      revenue: formData.get("revenue"),
      sales: formData.get("sales"),
      comment: formData.get("comment")
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para atualização de performance diária.");
    }

    const { id, offerId, date, investment, revenue, sales, comment } = parsed.data;

    const daily = await prisma.dailyPerformance.findFirst({
      where: {
        id,
        offer: {
          id: offerId,
          workspaceId
        }
      }
    });

    if (!daily) {
      throw new Error("Lançamento diário não encontrado para esta oferta.");
    }

    const updated = await prisma.dailyPerformance.update({
      where: { id: daily.id },
      data: {
        date,
        investment: new Decimal(investment),
        revenue: new Decimal(revenue),
        sales,
        comment: comment ?? null
      }
    });

    // Não recalcular métricas se apenas o comentário mudou.
    const investmentChanged = daily.investment.equals(updated.investment) === false;
    const revenueChanged = daily.revenue.equals(updated.revenue) === false;
    const salesChanged = daily.sales !== updated.sales;

    if (investmentChanged || revenueChanged || salesChanged) {
      const metrics = calculateDailyMetrics({
        investment: updated.investment,
        revenue: updated.revenue,
        sales: updated.sales,
        checkoutPercentage: updated.checkoutPercentageSnapshot,
        gatewayFeePerSale: updated.gatewayFeePerSaleSnapshot,
        taxPercentage: updated.taxPercentageSnapshot
      });

      void metrics;
    }

        revalidatePath(`/app/offers/${offerId}`);
        revalidatePath(`/app/offers/${offerId}/dashboard`);
        revalidatePath("/app/dashboard");
        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao atualizar performance diária:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao atualizar lançamento diário.");
      }
    },
    {}
  );
}

export async function deleteDailyPerformance(formData: FormData) {
  return measure(
    "action.deleteDailyPerformance",
    async () => {
      try {
    const workspaceId = await requireActiveWorkspaceId();
    
    // Verifica permissão de excluir
    await requireWorkspacePermission(workspaceId, "delete");

    const parsed = deleteDailyPerformanceSchema.safeParse({
      id: formData.get("id"),
      offerId: formData.get("offerId")
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para exclusão de performance diária.");
    }

    const { id, offerId } = parsed.data;

    const daily = await prisma.dailyPerformance.findFirst({
      where: {
        id,
        offer: {
          id: offerId,
          workspaceId
        }
      }
    });

    if (!daily) {
      throw new Error("Lançamento diário não encontrado para esta oferta.");
    }

    await prisma.dailyPerformance.delete({
      where: { id: daily.id }
    });

        revalidatePath(`/app/offers/${offerId}`);
        revalidatePath(`/app/offers/${offerId}/dashboard`);
        revalidatePath("/app/dashboard");
        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao excluir performance diária:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao excluir lançamento diário.");
      }
    },
    {}
  );
}

export async function analyzeOfferPeriod(formData: FormData) {
  return measure(
    "action.analyzeOfferPeriod",
    async () => {
      try {
    const workspaceId = await requireActiveWorkspaceId();

    const parsed = analyzeOfferPeriodSchema.safeParse({
      offerId: formData.get("offerId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate")
    });

    if (!parsed.success) {
      throw new Error("Dados inválidos para análise de período.");
    }

    const { offerId, startDate, endDate } = parsed.data;

    // Bloqueio: Análise de período requer relatórios avançados (PRO+)
    const advancedReportsCheck = await requireAdvancedReports();
    if (!advancedReportsCheck.allowed) {
      throw new Error(advancedReportsCheck.reason || "Relatórios avançados não disponíveis no seu plano.");
    }

    // Bloqueio: Verifica limite de 30 dias para FREE
    const historicalCheck = await requireHistoricalAnalysis({
      startDate,
      endDate
    });
    if (!historicalCheck.allowed) {
      throw new Error(historicalCheck.reason || "Análise histórica acima de 30 dias não disponível no plano FREE.");
    }

    // Garante que a oferta pertence ao workspace ativo
    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        workspaceId
      }
    });

    if (!offer) {
      throw new Error("Oferta não encontrada no workspace atual.");
    }

  const daily = await prisma.dailyPerformance.findMany({
    where: {
      offerId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  if (daily.length === 0) {
    throw new Error("Nenhum lançamento diário encontrado no período.");
  }

  const totalInvestment = daily.reduce(
    (sum, d) => sum.add(d.investment),
    new Decimal(0)
  );

  const totalRevenue = daily.reduce(
    (sum, d) => sum.add(d.revenue),
    new Decimal(0)
  );

  const totalSales = daily.reduce((sum, d) => sum + d.sales, 0);

  // Usa snapshots diários para calcular fee total e métricas agregadas
  const totalFee = daily.reduce(
    (sum, d) =>
      sum.add(
        calculateDailyMetrics({
          investment: d.investment,
          revenue: d.revenue,
          sales: d.sales,
          checkoutPercentage: d.checkoutPercentageSnapshot,
          gatewayFeePerSale: d.gatewayFeePerSaleSnapshot,
          taxPercentage: d.taxPercentageSnapshot
        }).fee
      ),
    new Decimal(0)
  );

  const totalCost = totalInvestment.add(totalFee);
  const roi =
    totalCost.equals(0) === false
      ? totalRevenue.div(totalCost)
      : new Decimal(0);
  const profit = totalRevenue.sub(totalCost);

  // Evita duplicidade: atualiza snapshot se já existir para o mesmo período
  const existing = await prisma.periodPerformance.findFirst({
    where: {
      offerId,
      startDate,
      endDate
    }
  });

  const snapshot = existing
    ? await prisma.periodPerformance.update({
        where: { id: existing.id },
        data: {
          investment: totalInvestment,
          revenue: totalRevenue,
          sales: totalSales,
          fee: totalFee,
          roi,
          profit
        }
      })
    : await prisma.periodPerformance.create({
        data: {
          offerId,
          startDate,
          endDate,
          investment: totalInvestment,
          revenue: totalRevenue,
          sales: totalSales,
          fee: totalFee,
          roi,
          profit
        }
      });

        revalidatePath(`/app/offers/${offerId}/analysis`);
        revalidatePath(`/app/offers/${offerId}/dashboard`);
      } catch (error) {
        console.error("Erro ao analisar período:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao analisar período.");
      }
    },
    {}
  );
}

export async function updateOfferFeeProfile(formData: FormData) {
  return measure(
    "action.updateOfferFeeProfile",
    async () => {
      try {
        const workspaceId = await requireActiveWorkspaceId();
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

        const membership = await prisma.userWorkspace.findUnique({
          where: {
            userId_workspaceId: {
              userId: user.id,
              workspaceId
            }
          }
        });

        // OWNER tem todas as permissões (incluindo as de ADMIN)
        if (!membership || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
          throw new Error(
            "Apenas administradores podem alterar o perfil de taxas da oferta."
          );
        }

        const parsed = updateOfferFeeProfileSchema.safeParse({
          offerId: formData.get("offerId"),
          feeProfileId: formData.get("feeProfileId")
        });

        if (!parsed.success) {
          throw new Error("Dados inválidos para atualização do perfil de taxas.");
        }

        const { offerId, feeProfileId } = parsed.data;

        const [offer, feeProfile] = await Promise.all([
          prisma.offer.findFirst({
            where: { id: offerId, workspaceId }
          }),
          prisma.feeProfile.findFirst({
            where: { id: feeProfileId, workspaceId }
          })
        ]);

        if (!offer) {
          throw new Error("Oferta não encontrada no workspace atual.");
        }

        if (!feeProfile) {
          throw new Error("Perfil de taxas não encontrado neste workspace.");
        }

        if (feeProfile.currency !== offer.currency) {
          throw new Error(
            `O perfil de taxas está em ${feeProfile.currency}, mas a oferta está em ${offer.currency}.`
          );
        }

        await prisma.offer.update({
          where: { id: offer.id },
          data: {
            feeProfileId: feeProfile.id
          }
        });

        revalidatePath(`/app/offers/${offerId}`);
        revalidatePath(`/app/offers/${offerId}/dashboard`);
      } catch (error) {
        console.error("Erro ao atualizar perfil de taxas:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao atualizar perfil de taxas.");
      }
    },
    {}
  );
}

const periodCloseSchema = z.object({
  offerId: z.string().cuid(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  investment: z.coerce.number().nonnegative(),
  revenue: z.coerce.number().nonnegative(),
  sales: z.coerce.number().int().nonnegative()
});

const MAX_PERIOD_DAYS = 31;

function resolvePeriodRange(startRaw: string, endRaw: string) {
  const start = utcDateFromKey(startRaw);
  const end = utcDateFromKey(endRaw);
  if (end.getTime() < start.getTime()) {
    throw new Error("A data final precisa ser igual ou depois da inicial.");
  }
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (days > MAX_PERIOD_DAYS) {
    throw new Error(`O período pode ter no máximo ${MAX_PERIOD_DAYS} dias.`);
  }
  return { start, end };
}

export async function getOfferPeriodStatus(
  offerId: string,
  periodStart: string,
  periodEnd: string
) {
  const workspaceId = await requireActiveWorkspaceId();
  await requireWorkspacePermission(workspaceId, "create");

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, workspaceId },
    select: { id: true }
  });
  if (!offer) {
    throw new Error("Oferta não encontrada no workspace atual.");
  }

  const { start, end } = resolvePeriodRange(periodStart, periodEnd);
  const existing = await prisma.dailyPerformance.findMany({
    where: {
      offerId,
      date: { gte: start, lte: end }
    },
    select: { date: true },
    orderBy: { date: "asc" }
  });

  return {
    periodStart: utcKey(start),
    periodEnd: utcKey(end),
    existingDates: existing.map((row) => utcKey(row.date)),
    blocked: existing.length > 0
  };
}

export async function getYesterdayPerformance(offerId: string) {
  const workspaceId = await requireActiveWorkspaceId();
  const yesterday = utcDateFromKey(utcKey(new Date()));
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, workspaceId },
    select: { id: true }
  });
  if (!offer) return null;

  const row = await prisma.dailyPerformance.findUnique({
    where: {
      offerId_date: {
        offerId,
        date: yesterday
      }
    },
    select: {
      investment: true,
      revenue: true,
      sales: true
    }
  });

  if (!row) return null;

  return {
    date: utcKey(yesterday),
    investment: row.investment.toString(),
    revenue: row.revenue.toString(),
    sales: row.sales
  };
}

export async function closeOfferWeek(formData: FormData) {
  return measure(
    "action.closeOfferWeek",
    async () => {
      try {
        const workspaceId = await requireActiveWorkspaceId();
        await requireWorkspacePermission(workspaceId, "create");

        const transactionCheck = await checkTransactionLimit();
        if (!transactionCheck.allowed) {
          throw new Error(transactionCheck.reason || "Limite de lançamentos mensais atingido. Faça upgrade para continuar.");
        }

        const parsed = periodCloseSchema.safeParse({
          offerId: formData.get("offerId"),
          periodStart: formData.get("periodStart"),
          periodEnd: formData.get("periodEnd"),
          investment: formData.get("investment"),
          revenue: formData.get("revenue"),
          sales: formData.get("sales")
        });

        if (!parsed.success) {
          throw new Error("Dados inválidos para fechamento do período.");
        }

        const { start, end } = resolvePeriodRange(
          parsed.data.periodStart,
          parsed.data.periodEnd
        );
        const existing = await prisma.dailyPerformance.findMany({
          where: {
            offerId: parsed.data.offerId,
            date: { gte: start, lte: end }
          },
          select: { date: true },
          orderBy: { date: "asc" }
        });

        if (existing.length > 0) {
          const days = existing.map((row) => formatUtcShort(row.date)).join(", ");
          throw new Error(
            `Esse período já tem lançamento diário (${days}). Continue no diário ou apague esses dias para fechar em lote.`
          );
        }

        await persistDailyPerformance({
          workspaceId,
          offerId: parsed.data.offerId,
          date: end,
          investment: parsed.data.investment,
          revenue: parsed.data.revenue,
          sales: parsed.data.sales,
          comment: `Fechamento ${formatUtcShort(start)}–${formatUtcShort(end)}`,
          ifExists: "fail"
        });

        revalidatePath(`/app/offers/${parsed.data.offerId}`);
        revalidatePath(`/app/offers/${parsed.data.offerId}/dashboard`);
        revalidatePath("/app/dashboard");
        revalidatePath("/app/cashflow");
      } catch (error) {
        console.error("Erro ao fechar semana:", error);
        throw new Error(error instanceof Error ? error.message : "Falha ao registrar o período.");
      }
    },
    {}
  );
}
