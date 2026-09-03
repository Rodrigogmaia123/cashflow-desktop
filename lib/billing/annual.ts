/**
 * Sistema de Planos Anuais
 * 
 * Gerenciamento de planos anuais com desconto psicológico
 * e incentivos para aumentar LTV.
 */

import type { Plan } from "./plans";

export type BillingInterval = "month" | "year";

export interface AnnualPlanConfig {
  monthlyPrice: number; // Preço mensal em centavos
  annualPrice: number; // Preço anual em centavos
  discountPercentage: number; // Desconto (ex: 17 = 17% ou 2 meses grátis)
  savingsAmount: number; // Economia em centavos
  monthlyEquivalent: number; // Equivalente mensal (annualPrice / 12)
}

/**
 * Configuração de planos anuais
 * 
 * Estratégia: ~17% de desconto (2 meses grátis)
 * Pro: R$ 49/mês → R$ 490/ano (equivalente a R$ 40,83/mês)
 * Business: R$ 99/mês → R$ 990/ano (equivalente a R$ 82,50/mês)
 */
export const ANNUAL_PLANS: Record<Plan, AnnualPlanConfig> = {
  FREE: {
    monthlyPrice: 0,
    annualPrice: 0,
    discountPercentage: 0,
    savingsAmount: 0,
    monthlyEquivalent: 0,
  },
  PRO: {
    monthlyPrice: 4900, // R$ 49,00
    annualPrice: 49000, // R$ 490,00 (equivalente a 10 meses)
    discountPercentage: 17, // ~17% ou "2 meses grátis"
    savingsAmount: 9800, // R$ 98,00 economizados
    monthlyEquivalent: 4083, // R$ 40,83/mês
  },
  BUSINESS: {
    monthlyPrice: 9900, // R$ 99,00
    annualPrice: 99000, // R$ 990,00 (equivalente a 10 meses)
    discountPercentage: 17, // ~17% ou "2 meses grátis"
    savingsAmount: 19800, // R$ 198,00 economizados
    monthlyEquivalent: 8250, // R$ 82,50/mês
  },
};

/**
 * Obtém configuração anual de um plano
 */
export function getAnnualPlanConfig(plan: Plan): AnnualPlanConfig {
  return ANNUAL_PLANS[plan];
}

/**
 * Calcula desconto anual automaticamente
 */
export function calculateAnnualDiscount(
  monthlyPrice: number,
  monthsFree: number = 2
): AnnualPlanConfig {
  const annualPrice = monthlyPrice * (12 - monthsFree);
  const discountPercentage = Math.round((monthsFree / 12) * 100);
  const savingsAmount = monthlyPrice * monthsFree;
  const monthlyEquivalent = Math.round(annualPrice / 12);

  return {
    monthlyPrice,
    annualPrice,
    discountPercentage,
    savingsAmount,
    monthlyEquivalent,
  };
}

/**
 * Formata preço mensal equivalente
 */
export function formatMonthlyEquivalent(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
}

/**
 * Formata economia anual
 */
export function formatAnnualSavings(savings: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(savings / 100);
}

/**
 * Retorna mensagem de desconto anual
 */
export function getAnnualDiscountMessage(plan: Plan): string {
  const config = ANNUAL_PLANS[plan];
  if (plan === "FREE" || config.discountPercentage === 0) {
    return "";
  }

  // Opções de mensagem:
  // 1. "2 meses grátis"
  // 2. "17% de desconto"
  // 3. "Economize R$ 98/ano"
  
  return `Economize ${formatAnnualSavings(config.savingsAmount)}/ano`;
  // Ou: "2 meses grátis" (mais psicológico)
}

