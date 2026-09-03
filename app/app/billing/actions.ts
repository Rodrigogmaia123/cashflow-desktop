"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createBillingPortalSession,
} from "@/lib/billing/stripe";
import { getPlanConfig } from "@/lib/billing/config";
import { isValidPlan, type Plan } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";

export type BillingActionResult =
  | { success: true; url: string }
  | { success: false; error: string };

/**
 * Cria uma sessão de checkout para upgrade/change de plano
 */
export async function createCheckout(
  plan: string
): Promise<BillingActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Valida plano
    if (!isValidPlan(plan)) {
      return { success: false, error: "Plano inválido" };
    }

    // Se já é lifetime, não precisa de checkout
    if (user.isLifetime) {
      return { success: false, error: "Usuário com acesso vitalício" };
    }

    // Se já está no mesmo plano, não precisa de checkout
    if (user.plan === plan) {
      return { success: false, error: "Você já está neste plano" };
    }

    const planConfig = getPlanConfig(plan);

    // Valida se tem priceId configurado
    if (!planConfig.priceId) {
      return { success: false, error: "Plano não configurado corretamente" };
    }

    // Obtém ou cria customer no Stripe
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name
    );

    // Cria sessão de checkout
    const checkoutUrl = await createCheckoutSession(
      customerId,
      planConfig.priceId,
      user.id,
      plan
    );

    return { success: true, url: checkoutUrl };
  } catch (error) {
    console.error("[createCheckout] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Cria uma sessão do billing portal do Stripe
 */
export async function openBillingPortal(): Promise<BillingActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Se é lifetime, não tem billing portal
    if (user.isLifetime) {
      return { success: false, error: "Usuário com acesso vitalício" };
    }

    // Busca customer no Stripe
    const stripeCustomer = await prisma.stripeCustomer.findUnique({
      where: { userId: user.id },
    });

    if (!stripeCustomer) {
      return {
        success: false,
        error: "Nenhuma assinatura encontrada",
      };
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`;

    const portalUrl = await createBillingPortalSession(
      stripeCustomer.stripeCustomerId,
      returnUrl
    );

    return { success: true, url: portalUrl };
  } catch (error) {
    console.error("[openBillingPortal] Erro:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Obtém informações da assinatura atual do usuário
 */
export async function getSubscriptionInfo() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    // Se é lifetime, retorna info especial
    if (user.isLifetime) {
      return {
        plan: user.plan,
        isLifetime: true,
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripePriceId: null, // Lifetime não tem subscription
      };
    }

    // Busca subscription ativa
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return {
        plan: user.plan,
        isLifetime: false,
        status: "none",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripePriceId: null, // Sem subscription ativa
      };
    }

    return {
      plan: subscription.plan as Plan,
      isLifetime: false,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      stripePriceId: subscription.stripePriceId || null, // Price ID contratado
    };
  } catch (error) {
    console.error("[getSubscriptionInfo] Erro:", error);
    return null;
  }
}

