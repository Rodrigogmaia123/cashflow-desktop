/**
 * Integração Stripe isolada - SERVER ONLY
 * NUNCA importar este arquivo no client
 */

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import type { Plan } from "./plans";
import { stripePriceIdToPlan, DEFAULT_PLAN } from "./plans";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_desktop_local_not_used";

export const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

/**
 * Cria ou retorna um customer no Stripe
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  // Verifica se já existe um customer no nosso DB
  const existingCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId },
  });

  if (existingCustomer) {
    return existingCustomer.stripeCustomerId;
  }

  // Cria customer no Stripe
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Salva no nosso DB
  await prisma.stripeCustomer.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
      email,
    },
  });

  // Atualiza User com stripeCustomerId
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Cria uma sessão de checkout
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  plan: Plan
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
  });

  if (!session.url) {
    throw new Error("Falha ao criar sessão de checkout");
  }

  return session.url;
}

/**
 * Cria uma sessão do billing portal
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Obtém a subscription ativa de um customer
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

/**
 * Mapeia o status da subscription do Stripe para o enum SubscriptionStatus do Prisma
 * Status não mapeados (como "paused") são convertidos para "incomplete"
 */
function mapStripeStatusToPrismaStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid" {
  const statusMap: Record<string, "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid"> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    unpaid: "unpaid",
  };

  return statusMap[stripeStatus] || "incomplete";
}

/**
 * Sincroniza subscription do Stripe com nosso DB
 * 
 * IMPORTANTE: Esta função converte dados do Stripe (gateway) para nossos
 * planos internos (fonte de verdade).
 * 
 * Estratégia de resolução de plano:
 * 1. Tenta obter do metadata.plan (para compatibilidade retroativa)
 * 2. Se não houver, resolve via price_id → plano interno (sistema canônico)
 * 3. Se price_id não estiver no mapa, falha de forma segura
 * 
 * Isso permite que o sistema funcione mesmo se:
 * - Metadata não foi setado
 * - Subscription foi criada manualmente no Stripe
 * - Gateway de pagamento for trocado no futuro
 */
export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription
): Promise<void> {
  const userId = stripeSubscription.metadata?.userId;
  if (!userId) {
    throw new Error("Subscription sem userId no metadata");
  }

  // Obtém o price_id da subscription
  const stripePriceId = stripeSubscription.items.data[0]?.price.id;
  if (!stripePriceId) {
    throw new Error("Subscription sem price ID");
  }

  // SISTEMA CANÔNICO: Converte Stripe Price ID → Plano Interno
  // Estratégia: tenta metadata primeiro (compatibilidade), depois usa mapa (canônico)
  let plan: Plan | null = null;

  // 1. Tenta obter do metadata (compatibilidade com subscriptions antigas)
  const metadataPlan = stripeSubscription.metadata?.plan;
  if (metadataPlan && (metadataPlan === "PRO" || metadataPlan === "BUSINESS")) {
    plan = metadataPlan as Plan;
    console.log(
      `[stripe] Plano obtido do metadata: ${plan} (subscription: ${stripeSubscription.id})`
    );
  }

  // 2. Se não houver metadata, usa o sistema canônico (price_id → plano)
  if (!plan) {
    plan = stripePriceIdToPlan(stripePriceId);

    if (!plan) {
      // FAIL-SAFE: Price ID desconhecido, não processa
      console.error(
        `[stripe] Price ID "${stripePriceId}" não reconhecido. ` +
          `Subscription ${stripeSubscription.id} será ignorada. ` +
          `Verifique se STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS estão corretos.`
      );
      throw new Error(
        `Price ID "${stripePriceId}" não está mapeado para nenhum plano interno`
      );
    }

    console.log(
      `[stripe] Plano resolvido via mapa canônico: ${stripePriceId} → ${plan}`
    );
  }

  // Valida que o plano é pago (FREE não tem subscription)
  if (plan !== "PRO" && plan !== "BUSINESS") {
    throw new Error(`Plano "${plan}" inválido para subscription paga`);
  }

  // Busca StripeCustomer (por stripeCustomerId ou, como fallback, por userId)
  const stripeCustomerId = stripeSubscription.customer as string;
  let stripeCustomer = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId },
  });

  if (!stripeCustomer) {
    stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId },
    });
    if (stripeCustomer) {
      // Atualiza stripeCustomerId se estiver desatualizado (ex.: race no primeiro checkout)
      if (stripeCustomer.stripeCustomerId !== stripeCustomerId) {
        await prisma.stripeCustomer.update({
          where: { id: stripeCustomer.id },
          data: { stripeCustomerId, updatedAt: new Date() },
        });
        stripeCustomer = { ...stripeCustomer, stripeCustomerId };
      }
      console.log(
        `[stripe] StripeCustomer encontrado por userId (fallback): ${userId}`
      );
    }
  }

  if (!stripeCustomer) {
    throw new Error(
      `StripeCustomer não encontrado (customerId: ${stripeCustomerId}, userId: ${userId})`
    );
  }

  // Busca subscription existente
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  // Prepara dados para salvar no DB
  // IMPORTANTE: Salvamos tanto o plano interno (plan) quanto o stripePriceId
  // - plan: fonte de verdade, usado pela lógica de negócio
  // - stripePriceId: referência ao gateway, útil para auditoria/debug
  const subscriptionData = {
    userId,
    stripeCustomerDbId: stripeCustomer.id,
    stripeSubscriptionId: stripeSubscription.id,
    stripePriceId, // Salva price_id do Stripe (referência ao gateway)
    status: mapStripeStatusToPrismaStatus(stripeSubscription.status),
    plan, // Salva plano interno (fonte de verdade)
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    canceledAt: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : null,
    updatedAt: new Date(),
  };

  if (existingSubscription) {
    // Atualiza subscription existente
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: subscriptionData,
    });
  } else {
    // Cria nova subscription
    await prisma.subscription.create({
      data: subscriptionData,
    });
  }

  // Atualiza plano do usuário baseado no status da subscription
  // IMPORTANTE: Usa plano interno (plan), não price_id do Stripe
  if (stripeSubscription.status === "active") {
    await prisma.user.update({
      where: { id: userId },
      data: { plan }, // Atualiza para plano pago (PRO ou BUSINESS)
    });
    console.log(`[stripe] Usuário ${userId} atualizado para plano ${plan}`);
  } else if (
    stripeSubscription.status === "canceled" ||
    stripeSubscription.status === "unpaid"
  ) {
    // Se cancelada ou não paga, volta para plano padrão (FREE)
    await prisma.user.update({
      where: { id: userId },
      data: { plan: DEFAULT_PLAN },
    });
    console.log(
      `[stripe] Usuário ${userId} voltou para plano ${DEFAULT_PLAN} (status: ${stripeSubscription.status})`
    );
  }
}

