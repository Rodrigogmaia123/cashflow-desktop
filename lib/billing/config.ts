/**
 * Configuração centralizada de planos e preços
 * NUNCA hardcode valores no frontend - sempre use esta configuração
 * 
 * IMPORTANTE: Este arquivo contém a configuração de UI/apresentação dos planos.
 * O sistema canônico de planos está em ./plans.ts
 */

import type { Plan } from "./plans";

export interface PlanConfig {
  id: Plan;
  name: string;
  description: string;
  priceId: string; // Stripe Price ID
  amount: number; // Em centavos (BRL) - fallback se displayPrice não estiver disponível
  currency: "brl";
  interval: "month" | "year";
  features: string[];
  // Campos opcionais para preço dinâmico (preenchidos no server)
  displayPrice?: string; // Preço formatado (ex: "R$ 49,00")
  displayInterval?: string; // Intervalo para exibição (ex: "/mês" ou "/ano")
}

/**
 * Configuração de planos
 * IMPORTANTE: Configure os Price IDs do Stripe nas variáveis de ambiente
 */
export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Gratuito",
    description: "Ideal para testar",
    priceId: "", // Sem preço
    amount: 0,
    currency: "brl",
    interval: "month",
    features: [
      "1 workspace",
      "Até 100 lançamentos/mês",
      "Sem exportação",
      "Sem categorias personalizadas",
      "Sem relatórios avançados",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    description: "Para profissionais",
    priceId: process.env.STRIPE_PRICE_ID_PRO || "",
    amount: 990, // R$ 9,90 em centavos
    currency: "brl",
    interval: "month",
    features: [
      "Tudo do plano Gratuito",
      "Workspaces ilimitados",
      "Lançamentos ilimitados",
      "Exportação PDF/Excel",
      "Categorias personalizadas",
      "Relatórios avançados",
      "Análises históricas",
    ],
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    description: "Para empresas",
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS || "",
    amount: 1490, // R$ 14,90 em centavos
    currency: "brl",
    interval: "month",
    features: [
      "Tudo do plano Pro",
      "API access",
      "Multi-usuário por workspace",
      "Controle de permissões",
      "Relatórios personalizados",
      "Suporte prioritário",
    ],
  },
};

/**
 * Valida se um plano é válido
 * @deprecated Use isValidPlan de ./plans.ts (sistema canônico)
 */
export function isValidPlan(plan: string): plan is Plan {
  return plan === "FREE" || plan === "PRO" || plan === "BUSINESS";
}

/**
 * Obtém configuração de um plano
 */
export function getPlanConfig(plan: Plan): PlanConfig {
  return PLANS[plan];
}

/**
 * Verifica se um plano requer cobrança
 */
export function requiresBilling(plan: Plan): boolean {
  return plan !== "FREE";
}

/**
 * Obtém todos os planos pagos
 */
export function getPaidPlans(): PlanConfig[] {
  return [PLANS.PRO, PLANS.BUSINESS];
}

