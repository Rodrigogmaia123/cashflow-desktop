/**
 * Helper canônico para obter o preço visível na UI
 * 
 * ESTRATÉGIA "Mostrar preço da assinatura ativa":
 * 
 * ✅ Se usuário tem subscription.stripePriceId → usar ele (preço contratado)
 * ✅ Caso contrário → usar fallbackPriceId (preço atual do .env)
 * 
 * Isso garante:
 * - Usuários com assinatura veem o preço que realmente contrataram
 * - Usuários sem assinatura veem o preço atual do Stripe
 * - Sistema pronto para grandfathering e mudanças de preço
 * 
 * SERVER ONLY - nunca importar no client
 */

import { stripe } from "./stripe";
import type { Plan } from "./plans";

/**
 * Informações do preço formatado para UI
 */
export interface VisiblePrice {
  amount: number; // em centavos
  currency: string; // "BRL", "USD", etc
  interval: "month" | "year";
  formatted: string; // formato "R$ 49,00"
}

/**
 * Obtém o preço visível para um plano específico
 * 
 * @param plan - Plano interno (PRO ou BUSINESS)
 * @param subscriptionPriceId - Price ID da subscription ativa (se houver)
 * @param fallbackPriceId - Price ID do .env (preço atual)
 * @returns Preço formatado ou null se não disponível
 * 
 * LÓGICA:
 * 1. Se subscriptionPriceId existe → busca ele (preço contratado)
 * 2. Senão → busca fallbackPriceId (preço atual)
 * 3. Se nenhum estiver disponível → retorna null
 */
export async function getVisiblePrice(
  plan: Plan,
  subscriptionPriceId: string | null | undefined,
  fallbackPriceId: string | undefined
): Promise<VisiblePrice | null> {
  // Decide qual price_id usar
  const priceIdToUse = subscriptionPriceId || fallbackPriceId;

  if (!priceIdToUse) {
    console.warn(`[getVisiblePrice] Nenhum price_id disponível para plano ${plan}`);
    return null;
  }

  try {
    // Busca o preço no Stripe
    const price = await stripe.prices.retrieve(priceIdToUse);

    if (!price.unit_amount) {
      console.warn(`[getVisiblePrice] Price ${priceIdToUse} não tem unit_amount`);
      return null;
    }

    // Extrai intervalo (month ou year)
    const interval = price.recurring?.interval || "month";
    if (interval !== "month" && interval !== "year") {
      console.warn(`[getVisiblePrice] Intervalo inválido: ${interval}`);
      return null;
    }

    // Formata o preço em BRL
    const currency = price.currency.toUpperCase();
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(price.unit_amount / 100);

    return {
      amount: price.unit_amount,
      currency: currency,
      interval: interval as "month" | "year",
      formatted: formatted,
    };
  } catch (error) {
    console.error(`[getVisiblePrice] Erro ao buscar preço ${priceIdToUse}:`, error);
    return null;
  }
}

/**
 * Formata um preço em centavos para string formatada
 * 
 * @param amount - Valor em centavos
 * @param currency - Código da moeda (default: "BRL")
 * @returns String formatada (ex: "R$ 49,00")
 */
export function formatPrice(amount: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
  }).format(amount / 100);
}

