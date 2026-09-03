"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Plan } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/config";
import { stripe } from "@/lib/billing/stripe";
import { revalidatePath } from "next/cache";

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

/**
 * Obtém métricas gerais do sistema
 */
export async function getAdminMetrics(): Promise<ActionResult<{
  totalUsers: number;
  activeUsers: number;
  usersByPlan: Record<string, number>;
  lifetimeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  mrr: number;
}>> {
  const admin = await requireAdmin();
  if (!admin) {
    return { success: false, reason: "Acesso negado: apenas administradores" };
  }

  try {
    const [
      totalUsers,
      usersByPlan,
      lifetimeUsers,
      totalSubscriptions,
      activeSubscriptions,
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),

      // Distribuição por plano
      prisma.user.groupBy({
        by: ["plan"],
        _count: true,
      }),

      // Usuários lifetime
      prisma.user.count({
        where: { isLifetime: true },
      }),

      // Total de subscriptions
      prisma.subscription.count(),

      // Subscriptions ativas
      prisma.subscription.count({
        where: { status: "active" },
      }),
    ]);

    // Usuários ativos = usuários com plano pago (PRO/BUSINESS) ou lifetime
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          { plan: { in: ["PRO", "BUSINESS"] } },
          { isLifetime: true },
        ],
      },
    });

    // Calcula MRR (Monthly Recurring Revenue) usando valores do config
    const activeSubs = await prisma.subscription.findMany({
      where: { status: "active" },
      select: { plan: true },
    });

    const mrr = activeSubs.reduce((acc: number, sub: { plan: string }) => {
      // Converte de centavos para reais
      if (sub.plan === "PRO") return acc + PLANS.PRO.amount / 100;
      if (sub.plan === "BUSINESS") return acc + PLANS.BUSINESS.amount / 100;
      return acc;
    }, 0);

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        usersByPlan: usersByPlan.reduce(
          (acc: Record<string, number>, item: { plan: string; _count: number }) => {
            acc[item.plan] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        lifetimeUsers,
        totalSubscriptions,
        activeSubscriptions,
        mrr: Math.round(mrr * 100) / 100,
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

/**
 * Tipos de dados para gráficos
 */
export type UsersEvolutionDataPoint = {
  date: string; // YYYY-MM-DD
  total: number; // Total acumulado
  newUsers: number; // Novos usuários no dia
};

export type MRREvolutionDataPoint = {
  month: string; // YYYY-MM
  mrr: number; // Receita mensal recorrente
};

export type CancellationsDataPoint = {
  month: string; // YYYY-MM
  count: number; // Quantidade de cancelamentos
};

export type PlansDistributionDataPoint = {
  plan: "FREE" | "PRO" | "BUSINESS";
  count: number;
  percentage: number; // 0-100
};

export type AdminChartsData = {
  usersEvolution: UsersEvolutionDataPoint[];
  mrrEvolution: MRREvolutionDataPoint[];
  cancellations: CancellationsDataPoint[];
  plansDistribution: PlansDistributionDataPoint[];
};

/**
 * Obtém dados agregados para gráficos do painel admin
 * Todos os cálculos são feitos no servidor usando Prisma
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
    // Primeiro dia do mês há 6 meses
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 1. Evolução de usuários (últimos 30 dias, acumulado)
    const allUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          lte: now,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calcula total acumulado por dia
    const usersEvolution: UsersEvolutionDataPoint[] = [];
    let runningTotal = 0;
    
    // Primeiro, conta usuários criados antes do período de 30 dias
    const usersBeforePeriod = allUsers.filter(
      (u: typeof allUsers[0]) => u.createdAt < thirtyDaysAgo
    ).length;
    runningTotal = usersBeforePeriod;

    // Agora itera pelos dias e acumula
    for (let i = 0; i <= 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      
      // Conta novos usuários neste dia
      const newUsersOnDay = allUsers.filter((u: typeof allUsers[0]) => {
        const userDateStr = u.createdAt.toISOString().split("T")[0];
        return userDateStr === dateStr;
      }).length;

      runningTotal += newUsersOnDay;

      usersEvolution.push({
        date: dateStr,
        total: runningTotal,
        newUsers: newUsersOnDay,
      });
    }

    // 2. Evolução de MRR (últimos 6 meses)
    // Busca todas as subscriptions (ativas ou canceladas) criadas há mais de 6 meses
    const allRelevantSubscriptions = await prisma.subscription.findMany({
      select: {
        createdAt: true,
        plan: true,
        canceledAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Gera meses dos últimos 6 meses
    const mrrByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      mrrByMonth.set(monthStr, 0);
    }

    // Para cada mês, calcula o MRR baseado nas subscriptions ativas naquele mês
    for (let i = 0; i < 6; i++) {
      const checkMonthStart = new Date(sixMonthsAgo);
      checkMonthStart.setMonth(checkMonthStart.getMonth() + i);
      checkMonthStart.setDate(1);
      checkMonthStart.setHours(0, 0, 0, 0);
      
      const checkMonthEnd = new Date(checkMonthStart);
      checkMonthEnd.setMonth(checkMonthEnd.getMonth() + 1);
      checkMonthEnd.setDate(0); // Último dia do mês
      checkMonthEnd.setHours(23, 59, 59, 999);

      const monthStr = `${checkMonthStart.getFullYear()}-${String(checkMonthStart.getMonth() + 1).padStart(2, "0")}`;
      
      let monthMRR = 0;
      
      // Para cada subscription, verifica se estava ativa neste mês
      allRelevantSubscriptions.forEach((sub: typeof allRelevantSubscriptions[0]) => {
        // Subscription deve ter sido criada antes ou durante este mês
        if (sub.createdAt <= checkMonthEnd) {
          // Se não foi cancelada ou foi cancelada após este mês, estava ativa
          if (!sub.canceledAt || sub.canceledAt > checkMonthEnd) {
            const planPrice =
              sub.plan === "PRO"
                ? PLANS.PRO.amount / 100
                : PLANS.BUSINESS.amount / 100;
            monthMRR += planPrice;
          }
        }
      });
      
      mrrByMonth.set(monthStr, Math.round(monthMRR * 100) / 100);
    }

    const mrrEvolution: MRREvolutionDataPoint[] = Array.from(mrrByMonth.entries())
      .map(([month, mrr]) => ({
        month,
        mrr,
      }))
      .sort((a: MRREvolutionDataPoint, b: MRREvolutionDataPoint) => a.month.localeCompare(b.month));

    // 3. Cancelamentos (últimos 6 meses)
    const canceledSubscriptions = await prisma.subscription.findMany({
      where: {
        canceledAt: {
          gte: sixMonthsAgo,
          not: null,
        },
      },
      select: {
        canceledAt: true,
      },
    });

    const cancellationsByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(sixMonthsAgo);
      monthDate.setMonth(monthDate.getMonth() + i);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      cancellationsByMonth.set(monthStr, 0);
    }

    canceledSubscriptions.forEach((sub: typeof canceledSubscriptions[0]) => {
      if (sub.canceledAt) {
        const cancelMonth = new Date(sub.canceledAt);
        const monthStr = `${cancelMonth.getFullYear()}-${String(cancelMonth.getMonth() + 1).padStart(2, "0")}`;
        cancellationsByMonth.set(monthStr, (cancellationsByMonth.get(monthStr) || 0) + 1);
      }
    });

    const cancellations: CancellationsDataPoint[] = Array.from(cancellationsByMonth.entries())
      .map(([month, count]) => ({
        month,
        count,
      }))
      .sort((a: CancellationsDataPoint, b: CancellationsDataPoint) => a.month.localeCompare(b.month));

    // 4. Distribuição de planos (snapshot atual)
    const usersByPlan = await prisma.user.groupBy({
      by: ["plan"],
      _count: true,
    });

    const totalUsersForDistribution = usersByPlan.reduce(
      (acc: number, item: { plan: string; _count: number }) => acc + item._count,
      0
    );

    const plansDistribution: PlansDistributionDataPoint[] = usersByPlan
      .map((item: { plan: string; _count: number }) => ({
        plan: item.plan as "FREE" | "PRO" | "BUSINESS",
        count: item._count,
        percentage:
          totalUsersForDistribution > 0
            ? Math.round((item._count / totalUsersForDistribution) * 100)
            : 0,
      }))
      .sort((a: PlansDistributionDataPoint, b: PlansDistributionDataPoint) => {
        // Ordena: FREE, PRO, BUSINESS
        const order = { FREE: 0, PRO: 1, BUSINESS: 2 };
        return order[a.plan] - order[b.plan];
      });

    return {
      success: true,
      data: {
        usersEvolution,
        mrrEvolution,
        cancellations,
        plansDistribution,
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

