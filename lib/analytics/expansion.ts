/**
 * Tracking de Expansão de Receita
 * 
 * Rastreia eventos relacionados a upgrades PRO → BUSINESS
 * e adoção de planos anuais.
 */

import { trackConversion, type ConversionEventData } from "./conversion";
import type { ExpansionTrigger } from "@/lib/expansion/triggers";

export type ExpansionEvent =
  | "business_trigger_detected"
  | "business_hint_shown"
  | "business_banner_shown"
  | "business_modal_opened"
  | "business_checkout_started"
  | "business_upgrade_completed"
  | "annual_plan_selected"
  | "annual_checkout_started"
  | "annual_upgrade_completed";

export interface ExpansionEventData extends Omit<ConversionEventData, "event" | "context"> {
  event: ExpansionEvent;
  context?: {
    trigger?: ExpansionTrigger;
    billingInterval?: "month" | "year";
    previousPlan?: "FREE" | "PRO" | "BUSINESS";
    newPlan?: "PRO" | "BUSINESS";
    savingsAmount?: number; // Para anual
    // Campos opcionais para compatibilidade com ConversionEventData quando necessário
    feature?: string;
    source?: string;
    targetPlan?: "PRO" | "BUSINESS";
  };
}

/**
 * Rastreia quando gatilho de BUSINESS é detectado
 */
export function trackBusinessTriggerDetected(params: {
  trigger: ExpansionTrigger;
  strength: "weak" | "medium" | "strong";
  userId?: string;
  plan: "PRO";
  context?: {
    workspacesCount?: number;
    monthlyTransactions?: number;
  };
}) {
  trackConversion({
    event: "preview_viewed", // Mapeado para evento de conversão equivalente
    userId: params.userId,
    plan: params.plan,
    context: {
      feature: params.trigger,
      source: "expansion_detection",
    },
    metadata: {
      strength: params.strength,
      ...params.context,
    },
  });
}

/**
 * Rastreia quando hint/banner de BUSINESS é mostrado
 */
export function trackBusinessHintShown(params: {
  trigger: ExpansionTrigger;
  type: "hint" | "banner";
  userId?: string;
  plan: "PRO";
}) {
  trackConversion({
    event: "preview_viewed", // Mapeado para evento de conversão equivalente
    userId: params.userId,
    plan: params.plan,
    context: {
      feature: params.trigger,
      source: `expansion_${params.type}`,
    },
  });
}

/**
 * Rastreia quando modal de BUSINESS é aberto
 */
export function trackBusinessModalOpened(params: {
  trigger: ExpansionTrigger;
  userId?: string;
  plan: "PRO";
}) {
  trackConversion({
    event: "upgrade_modal_opened",
    userId: params.userId,
    plan: params.plan,
    context: {
      feature: params.trigger,
      source: "business_modal",
      targetPlan: "BUSINESS",
    },
  });
}

/**
 * Rastreia quando checkout anual é iniciado
 */
export function trackAnnualCheckoutStarted(params: {
  plan: "PRO" | "BUSINESS";
  billingInterval: "year";
  savingsAmount: number;
  userId?: string;
}) {
  trackConversion({
    event: "checkout_started",
    userId: params.userId,
    plan: params.plan,
    context: {
      source: "annual_plan_selection",
      targetPlan: params.plan,
    },
    metadata: {
      billingInterval: params.billingInterval,
      savingsAmount: params.savingsAmount,
    },
  });
}

/**
 * Rastreia quando upgrade para BUSINESS é completado
 */
export function trackBusinessUpgradeCompleted(params: {
  trigger?: ExpansionTrigger;
  billingInterval: "month" | "year";
  previousPlan: "PRO";
  userId?: string;
}) {
  trackConversion({
    event: "upgrade_completed",
    userId: params.userId,
    plan: "BUSINESS",
    context: {
      source: "business_upgrade",
      targetPlan: "BUSINESS",
    },
    metadata: {
      previousPlan: params.previousPlan,
      billingInterval: params.billingInterval,
      trigger: params.trigger,
    },
  });
}

