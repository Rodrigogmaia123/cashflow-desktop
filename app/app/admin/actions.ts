"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Plan } from "@/lib/billing/plans";
import { stripe } from "@/lib/billing/stripe";
import { revalidatePath } from "next/cache";
import {
  editionLabel,
  licenseDurationLabel,
} from "@/lib/license/catalog";
import type { LicenseDuration, LicenseEdition } from "@/lib/prisma-enums";

/**
 * Verifica se o usuário é admin
 * Retorna null se não for admin (para evitar throw)
 */
async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    return null;
  }

  return user;
}

/**
 * Tipo de retorno padronizado para actions
 */
type ActionResult<T = void> = {
  success: boolean;
  reason?: string;
  data?: T;
};

export type AdminMetricsData = {
  totalLicenses: number;
  paidLicenses: number;
  activeLicenses: number;
  revokedLicenses: number;
  licensesByEdition: { pro: number; pessoal: number };
  licensesByDuration: Array<{
    duration: LicenseDuration;
    label: string;
    count: number;
  }>;
  paidOrders: number;
  revenueCents: number;
};

/**
 * Métricas da operação desktop: chaves, edições, prazos e receita da loja.
 */
export async function getAdminMetrics(): Promise<ActionResult<AdminMetricsData>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  try {
    const [licenses, paidOrdersCount, paidOrdersSum] = await Promise.all([
      prisma.license.findMany({
        select: {
          edition: true,
          duration: true,
          status: true,
        },
      }),
      prisma.licenseOrder.count({
        where: { status: "paid" },
      }),
      prisma.licenseOrder.aggregate({
        where: { status: "paid" },
        _sum: { amountCents: true },
      }),
    ]);

    const licensesByEdition = { pro: 0, pessoal: 0 };
    const durationCounts: Record<string, number> = {};
    let paidLicenses = 0;
    let activeLicenses = 0;
    let revokedLicenses = 0;

    for (const license of licenses) {
      if (license.edition === "pessoal") licensesByEdition.pessoal += 1;
      else licensesByEdition.pro += 1;

      durationCounts[license.duration] =
        (durationCounts[license.duration] ?? 0) + 1;

      if (license.status === "paid") paidLicenses += 1;
      if (license.status === "active") activeLicenses += 1;
      if (license.status === "revoked") revokedLicenses += 1;
    }

    const durationOrder: LicenseDuration[] = [
      "3m",
      "5m",
      "annual",
      "lifetime",
      "1d",
    ];
    const licensesByDuration = durationOrder
      .filter(
        (duration) =>
          duration !== "1d" || (durationCounts[duration] ?? 0) > 0
      )
      .map((duration) => ({
        duration,
        label: licenseDurationLabel(duration),
        count: durationCounts[duration] ?? 0,
      }));

    return {
      success: true,
      data: {
        totalLicenses: licenses.length,
        paidLicenses,
        activeLicenses,
        revokedLicenses,
        licensesByEdition,
        licensesByDuration,
        paidOrders: paidOrdersCount,
        revenueCents: paidOrdersSum._sum.amountCents ?? 0,
      },
    };
  } catch (error) {
    console.error("[getAdminMetrics] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Tipos para filtros de usuários
 */
export type UserFilters = {
  search?: string; // Busca por nome ou email
  plan?: Plan | "ALL"; // Filtro por plano
  status?: "ALL" | "PAID" | "FREE" | "LIFETIME"; // Filtro por status
  sortBy?: "NEWEST" | "OLDEST" | "PAID_FIRST"; // Ordenação
  page?: number;
  pageSize?: number;
};

/**
 * Lista usuários com paginação e filtros
 */
export async function getAdminUsers(
  filters: UserFilters = {}
): Promise<ActionResult<{
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    plan: Plan;
    isLifetime: boolean;
    isAdmin: boolean;
    createdAt: Date;
    stripeCustomerId: string | null;
    subscription: {
      id: string;
      status: string;
      stripeSubscriptionId: string;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    } | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  try {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const skip = (page - 1) * pageSize;

    // Constrói filtro where dinamicamente
    const where: {
      AND?: Array<Record<string, unknown>>;
      OR?: Array<Record<string, unknown>>;
    } = {};

    const conditions: Array<Record<string, unknown>> = [];

    // Filtro de busca (nome ou email)
    // SQLite não suporta mode: "insensitive", então usamos contains simples
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      conditions.push({
        OR: [
          {
            email: {
              contains: searchTerm,
            },
          },
          {
            name: {
              contains: searchTerm,
            },
          },
        ],
      });
    }

    // Filtro por plano
    if (filters.plan && filters.plan !== "ALL") {
      conditions.push({
        plan: filters.plan,
      });
    }

    // Filtro por status
    if (filters.status && filters.status !== "ALL") {
      switch (filters.status) {
        case "PAID":
          // Usuários com plano pago (PRO ou BUSINESS) e não lifetime
          conditions.push({
            plan: { in: ["PRO", "BUSINESS"] },
            isLifetime: false,
          });
          break;
        case "FREE":
          conditions.push({
            plan: "FREE",
            isLifetime: false,
          });
          break;
        case "LIFETIME":
          conditions.push({
            isLifetime: true,
          });
          break;
      }
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Ordenação
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "NEWEST":
          orderBy = { createdAt: "desc" };
          break;
        case "OLDEST":
          orderBy = { createdAt: "asc" };
          break;
        case "PAID_FIRST":
          // Ordena por: lifetime primeiro, depois planos pagos, depois FREE
          // Como o Prisma não suporta ordenação condicional facilmente,
          // vamos ordenar por createdAt desc como fallback
          // Em produção, isso pode ser otimizado com uma query raw se necessário
          orderBy = { createdAt: "desc" };
          break;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          isLifetime: true,
          isAdmin: true,
          createdAt: true,
          stripeCustomerId: true,
          stripeCustomer: {
            select: {
              subscriptions: {
                where: { status: "active" },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  stripeSubscriptionId: true,
                  currentPeriodEnd: true,
                  cancelAtPeriodEnd: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    // Se a ordenação é PAID_FIRST, ordena manualmente após buscar
    let sortedUsers = users;
    if (filters.sortBy === "PAID_FIRST") {
      sortedUsers = [...users].sort((a: typeof users[0], b: typeof users[0]) => {
        // Lifetime primeiro
        if (a.isLifetime && !b.isLifetime) return -1;
        if (!a.isLifetime && b.isLifetime) return 1;
        
        // Depois planos pagos
        const aIsPaid = a.plan === "PRO" || a.plan === "BUSINESS";
        const bIsPaid = b.plan === "PRO" || b.plan === "BUSINESS";
        if (aIsPaid && !bIsPaid) return -1;
        if (!aIsPaid && bIsPaid) return 1;
        
        // Por último, ordena por data (mais recentes primeiro)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return {
      success: true,
      data: {
        users: sortedUsers.map((user: typeof users[0]) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan as Plan,
          isLifetime: user.isLifetime,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          stripeCustomerId: user.stripeCustomerId,
          subscription: user.stripeCustomer?.subscriptions[0] || null,
        })),
        total,
        page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("[getAdminUsers] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

const updateUserPlanSchema = z.object({
  userId: z.string().cuid(),
  plan: z.enum(["FREE", "PRO", "BUSINESS"]),
});

/**
 * Atualiza plano de um usuário manualmente (override admin)
 * IMPORTANTE: Não cria checkout Stripe, apenas altera estado interno
 */
export async function updateUserPlan(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  const parsed = updateUserPlanSchema.safeParse({
    userId: formData.get("userId"),
    plan: formData.get("plan"),
  });

  if (!parsed.success) {
    return { success: false, reason: "Dados inválidos" };
  }

  try {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { plan: parsed.data.plan },
    });

    revalidatePath("/app/admin");
    return { success: true };
  } catch (error) {
    console.error("[updateUserPlan] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

const setUserLifetimeSchema = z.object({
  userId: z.string().cuid(),
  isLifetime: z.boolean(),
});

/**
 * Torna usuário lifetime ou remove status lifetime
 * IMPORTANTE: Quando tornar lifetime, define plan = "PRO" automaticamente
 * Não cria subscription no Stripe
 */
export async function setUserLifetime(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  const parsed = setUserLifetimeSchema.safeParse({
    userId: formData.get("userId"),
    isLifetime: formData.get("isLifetime") === "true",
  });

  if (!parsed.success) {
    return { success: false, reason: "Dados inválidos" };
  }

  try {
    // Se está tornando lifetime, define plan = PRO
    // Se está removendo lifetime, mantém o plan atual (pode ser FREE)
    const updateData = parsed.data.isLifetime
      ? { isLifetime: true, plan: "PRO" as Plan }
      : { isLifetime: false };

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: updateData,
    });

    revalidatePath("/app/admin");
    return { success: true };
  } catch (error) {
    console.error("[setUserLifetime] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

const cancelSubscriptionSchema = z.object({
  userId: z.string().cuid(),
});

/**
 * Cancela assinatura de um usuário via Stripe API
 * Atualiza banco e mantém histórico
 */
export async function cancelUserSubscription(
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  const parsed = cancelSubscriptionSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { success: false, reason: "Dados inválidos" };
  }

  try {
    // Busca subscription ativa do usuário
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      include: {
        stripeCustomer: {
          include: {
            subscriptions: {
              where: { status: "active" },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, reason: "Usuário não encontrado" };
    }

    const activeSubscription = user.stripeCustomer?.subscriptions[0];
    if (!activeSubscription) {
      return { success: false, reason: "Nenhuma assinatura ativa encontrada" };
    }

    // Cancela via Stripe API
    await stripe.subscriptions.update(activeSubscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Atualiza no banco (o webhook também atualizará, mas fazemos aqui para consistência)
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      },
    });

    // Atualiza o plano do usuário para FREE no final do período (ou imediatamente se necessário)
    // Por enquanto, deixamos o webhook cuidar disso quando o período terminar

    revalidatePath("/app/admin");
    return { success: true };
  } catch (error) {
    console.error("[cancelUserSubscription] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

const getStripeCustomerLinkSchema = z.object({
  userId: z.string().cuid(),
});

/**
 * Gera link para visualizar cliente no Stripe Dashboard
 */
export async function getStripeCustomerLink(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  const parsed = getStripeCustomerLinkSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { success: false, reason: "Dados inválidos" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return {
        success: false,
        reason: "Usuário não possui customer no Stripe",
      };
    }

    // URL do Stripe Dashboard para visualizar o customer
    const stripeUrl = `https://dashboard.stripe.com/customers/${user.stripeCustomerId}`;

    return {
      success: true,
      data: { url: stripeUrl },
    };
  } catch (error) {
    console.error("[getStripeCustomerLink] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastSixMonthKeys(from: Date) {
  const keys: string[] = [];
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(from);
    monthDate.setMonth(monthDate.getMonth() + i);
    keys.push(monthKey(monthDate));
  }
  return keys;
}

export type LicensesEvolutionDataPoint = {
  date: string;
  total: number;
  newLicenses: number;
};

export type RevenueEvolutionDataPoint = {
  month: string;
  revenue: number;
};

export type RevocationsDataPoint = {
  month: string;
  count: number;
};

export type EditionsDistributionDataPoint = {
  edition: LicenseEdition;
  label: string;
  count: number;
  percentage: number;
};

export type AdminChartsData = {
  licensesEvolution: LicensesEvolutionDataPoint[];
  revenueEvolution: RevenueEvolutionDataPoint[];
  revocations: RevocationsDataPoint[];
  editionsDistribution: EditionsDistributionDataPoint[];
};

/**
 * Gráficos da operação desktop: chaves, receita da loja, revogações e edições.
 */
export async function getAdminCharts(): Promise<ActionResult<AdminChartsData>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [licenses, paidOrders] = await Promise.all([
      prisma.license.findMany({
        select: {
          createdAt: true,
          edition: true,
          revokedAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.licenseOrder.findMany({
        where: { status: "paid" },
        select: {
          amountCents: true,
          paidAt: true,
          createdAt: true,
        },
      }),
    ]);

    const licensesEvolution: LicensesEvolutionDataPoint[] = [];
    let runningTotal = licenses.filter(
      (license) => license.createdAt < thirtyDaysAgo
    ).length;

    for (let i = 0; i <= 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const newLicenses = licenses.filter((license) => {
        return license.createdAt.toISOString().split("T")[0] === dateStr;
      }).length;
      runningTotal += newLicenses;
      licensesEvolution.push({
        date: dateStr,
        total: runningTotal,
        newLicenses,
      });
    }

    const monthKeys = lastSixMonthKeys(sixMonthsAgo);
    const revenueByMonth = new Map(monthKeys.map((key) => [key, 0]));
    for (const order of paidOrders) {
      const when = order.paidAt ?? order.createdAt;
      const key = monthKey(when);
      if (revenueByMonth.has(key)) {
        revenueByMonth.set(
          key,
          (revenueByMonth.get(key) ?? 0) + order.amountCents / 100
        );
      }
    }
    const revenueEvolution: RevenueEvolutionDataPoint[] = monthKeys.map(
      (month) => ({
        month,
        revenue: Math.round((revenueByMonth.get(month) ?? 0) * 100) / 100,
      })
    );

    const revocationsByMonth = new Map(monthKeys.map((key) => [key, 0]));
    for (const license of licenses) {
      if (!license.revokedAt || license.revokedAt < sixMonthsAgo) continue;
      const key = monthKey(license.revokedAt);
      if (revocationsByMonth.has(key)) {
        revocationsByMonth.set(key, (revocationsByMonth.get(key) ?? 0) + 1);
      }
    }
    const revocations: RevocationsDataPoint[] = monthKeys.map((month) => ({
      month,
      count: revocationsByMonth.get(month) ?? 0,
    }));

    const editionCounts: Record<LicenseEdition, number> = {
      pro: 0,
      pessoal: 0,
    };
    for (const license of licenses) {
      if (license.edition === "pessoal") editionCounts.pessoal += 1;
      else editionCounts.pro += 1;
    }
    const totalForDistribution = editionCounts.pro + editionCounts.pessoal;
    const editionsDistribution: EditionsDistributionDataPoint[] = (
      ["pro", "pessoal"] as const
    ).map((edition) => ({
      edition,
      label: editionLabel(edition),
      count: editionCounts[edition],
      percentage:
        totalForDistribution > 0
          ? Math.round((editionCounts[edition] / totalForDistribution) * 100)
          : 0,
    }));

    return {
      success: true,
      data: {
        licensesEvolution,
        revenueEvolution,
        revocations,
        editionsDistribution,
      },
    };
  } catch (error) {
    console.error("[getAdminCharts] Erro:", error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

