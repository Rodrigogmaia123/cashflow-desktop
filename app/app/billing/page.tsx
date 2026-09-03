import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSubscriptionInfo } from "./actions";
import { getPlanConfig, PLANS } from "@/lib/billing/config";
import { BillingStatus } from "@/components/billing/billing-status";
import { PlanSelector } from "@/components/billing/plan-selector";
import { getVisiblePrice } from "@/lib/billing/get-visible-price";
import { planToStripePriceId, type Plan } from "@/lib/billing/plans";

/**
 * Página de Billing
 * 
 * LÓGICA DE PREÇOS (Estratégia "Mostrar preço da assinatura ativa"):
 * 
 * Para cada plano (PRO/BUSINESS):
 * - Se usuário está nesse plano E tem subscription.stripePriceId → usa preço contratado
 * - Caso contrário → usa preço atual do Stripe (fallback do .env)
 * 
 * Isso garante:
 * ✅ Usuários veem o preço que realmente contrataram
 * ✅ Novos usuários veem o preço atual
 * ✅ Sistema pronto para grandfathering
 */
export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const subscriptionInfo = await getSubscriptionInfo();
  const currentPlanConfig = getPlanConfig(user.plan);

  // Busca preços dinâmicos para cada plano
  // LÓGICA: Se usuário está no plano E tem subscription.stripePriceId → usa preço contratado
  //         Senão → usa preço atual do Stripe (fallback)
  const proSubscriptionPriceId = user.plan === "PRO" && subscriptionInfo?.stripePriceId
    ? subscriptionInfo.stripePriceId
    : null;

  const businessSubscriptionPriceId = user.plan === "BUSINESS" && subscriptionInfo?.stripePriceId
    ? subscriptionInfo.stripePriceId
    : null;

  // Busca preços em paralelo
  const [proPrice, businessPrice] = await Promise.all([
    getVisiblePrice("PRO", proSubscriptionPriceId, planToStripePriceId("PRO") || undefined),
    getVisiblePrice("BUSINESS", businessSubscriptionPriceId, planToStripePriceId("BUSINESS") || undefined),
  ]);

  // Prepara planos com preços dinâmicos
  const plansWithPrices = Object.values(PLANS).map((plan) => {
    if (plan.id === "FREE") {
      return plan; // FREE não tem preço
    }

    if (plan.id === "PRO" && proPrice) {
      return {
        ...plan,
        amount: proPrice.amount, // Atualiza amount com valor dinâmico
        displayPrice: proPrice.formatted, // Preço formatado
        displayInterval: `/${proPrice.interval === "month" ? "mês" : "ano"}`, // Intervalo
      };
    }

    if (plan.id === "BUSINESS" && businessPrice) {
      return {
        ...plan,
        amount: businessPrice.amount, // Atualiza amount com valor dinâmico
        displayPrice: businessPrice.formatted, // Preço formatado
        displayInterval: `/${businessPrice.interval === "month" ? "mês" : "ano"}`, // Intervalo
      };
    }

    return plan; // Fallback para valores do config
  });

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Assinatura
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu plano e assinatura
        </p>
      </div>

      {/* Status atual */}
      <BillingStatus
        user={user}
        subscriptionInfo={subscriptionInfo}
        currentPlanConfig={currentPlanConfig}
      />

      {/* Seleção de planos */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Planos disponíveis</h2>
          <p className="text-xs text-muted-foreground">
            Escolha o plano ideal para suas necessidades
          </p>
        </div>
        <PlanSelector
          currentPlan={user.plan}
          isLifetime={user.isLifetime}
          plans={plansWithPrices}
        />
      </div>
    </section>
  );
}

