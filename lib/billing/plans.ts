/**
 * Sistema canônico de planos internos
 * 
 * IMPORTANTE: Este é o sistema de VERDADE dos planos.
 * Stripe (ou qualquer outro gateway) é apenas um meio de pagamento.
 * 
 * Os planos internos são a fonte de verdade e definem:
 * - Funcionalidades disponíveis
 * - Permissões do usuário
 * - Lógica de negócio
 * 
 * Gateways de pagamento apenas processam pagamentos e são
 * mapeados para nossos planos internos através de STRIPE_PLAN_MAP.
 */

/**
 * Enum canônico de planos
 * Esta é a única fonte de verdade para planos no sistema
 */
export type Plan = "FREE" | "PRO" | "BUSINESS";

/**
 * Plano padrão para novos usuários
 */
export const DEFAULT_PLAN: Plan = "FREE";

/**
 * Verifica se um plano é pago (requer billing)
 */
export function isPaidPlan(plan: Plan): boolean {
  return plan !== "FREE";
}

/**
 * Valida se uma string é um plano válido
 */
export function isValidPlan(value: string): value is Plan {
  return value === "FREE" || value === "PRO" || value === "BUSINESS";
}

/**
 * Converte plano para string segura
 */
export function planToString(plan: Plan): string {
  return plan;
}

/**
 * Tenta converter string para plano, retorna DEFAULT_PLAN se inválido
 */
export function stringToPlan(value: string): Plan {
  if (isValidPlan(value)) {
    return value;
  }
  console.warn(
    `[plans] Plano inválido "${value}", usando plano padrão "${DEFAULT_PLAN}"`
  );
  return DEFAULT_PLAN;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAPEAMENTO STRIPE → PLANO INTERNO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Obtém Price IDs do Stripe das variáveis de ambiente
 * Valida que estão configurados corretamente
 */
function getStripePriceIds() {
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO;
  const businessPriceId = process.env.STRIPE_PRICE_ID_BUSINESS;

  if (!proPriceId || !businessPriceId) {
    throw new Error(
      "STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS devem estar configurados nas variáveis de ambiente"
    );
  }

  return { proPriceId, businessPriceId };
}

/**
 * Mapa de conversão: Stripe Price ID → Plano Interno
 * 
 * Este mapa é a ponte entre o gateway de pagamento (Stripe)
 * e nossos planos internos.
 * 
 * IMPORTANTE:
 * - Se você trocar de gateway (ex: Paddle, Mercado Pago),
 *   basta criar um novo mapa similar
 * - Nossos planos internos (FREE, PRO, BUSINESS) não mudam
 * - O resto do sistema não precisa saber qual gateway está sendo usado
 */
export function getStripePlanMap(): Record<string, Plan> {
  const { proPriceId, businessPriceId } = getStripePriceIds();

  return {
    [proPriceId]: "PRO",
    [businessPriceId]: "BUSINESS",
  };
}

/**
 * Converte Stripe Price ID para Plano Interno
 * 
 * @param stripePriceId - Price ID retornado pelo Stripe
 * @returns Plano interno correspondente ou null se não encontrado
 * 
 * @example
 * const plan = stripePriceIdToPlan("price_1234..."); // "PRO"
 */
export function stripePriceIdToPlan(stripePriceId: string): Plan | null {
  try {
    const map = getStripePlanMap();
    const plan = map[stripePriceId];

    if (!plan) {
      console.warn(
        `[plans] Price ID "${stripePriceId}" não encontrado no mapa de planos. ` +
          `Price IDs conhecidos: ${Object.keys(map).join(", ")}`
      );
      return null;
    }

    return plan;
  } catch (error) {
    console.error("[plans] Erro ao mapear price ID:", error);
    return null;
  }
}

/**
 * Obtém o Stripe Price ID de um plano interno
 * 
 * @param plan - Plano interno
 * @returns Stripe Price ID correspondente ou null se não for plano pago
 * 
 * @example
 * const priceId = planToStripePriceId("PRO"); // "price_1234..."
 */
export function planToStripePriceId(plan: Plan): string | null {
  if (!isPaidPlan(plan)) {
    return null;
  }

  try {
    const { proPriceId, businessPriceId } = getStripePriceIds();

    switch (plan) {
      case "PRO":
        return proPriceId;
      case "BUSINESS":
        return businessPriceId;
      default:
        return null;
    }
  } catch (error) {
    console.error("[plans] Erro ao obter price ID:", error);
    return null;
  }
}

/**
 * Valida se um Price ID está configurado no sistema
 */
export function isValidStripePriceId(stripePriceId: string): boolean {
  try {
    const map = getStripePlanMap();
    return stripePriceId in map;
  } catch {
    return false;
  }
}

