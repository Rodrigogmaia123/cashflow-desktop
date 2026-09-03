/**
 * Sistema de Tracking de Conversão
 * 
 * Rastreia eventos críticos para análise de conversão e otimização de funil.
 * Integrado com Google Analytics e pronto para PostHog.
 */

export type ConversionEvent =
  | "limit_reached"
  | "feature_locked"
  | "preview_viewed"
  | "upgrade_modal_opened"
  | "checkout_started"
  | "upgrade_completed"
  | "upgrade_abandoned";

export interface ConversionEventData {
  event: ConversionEvent;
  userId?: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  context?: {
    feature?: string;
    limitType?: "workspaces" | "transactions" | "categories" | "exports";
    currentValue?: number;
    limitValue?: number;
    source?: string; // Onde o evento foi acionado
    targetPlan?: "PRO" | "BUSINESS";
  };
  metadata?: Record<string, unknown>;
}

/**
 * Rastreia um evento de conversão
 * 
 * @example
 * trackConversion({
 *   event: "limit_reached",
 *   plan: "FREE",
 *   context: {
 *     limitType: "transactions",
 *     currentValue: 100,
 *     limitValue: 100,
 *     source: "create_expense",
 *   },
 * });
 */
export function trackConversion(data: ConversionEventData) {
  // Client-side: Envia para Google Analytics / PostHog
  if (typeof window !== "undefined") {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag("event", data.event, {
        event_category: "conversion",
        event_label: data.context?.feature || data.context?.limitType,
        value: data.context?.targetPlan === "PRO" ? 49 : data.context?.targetPlan === "BUSINESS" ? 99 : 0,
        currency: "BRL",
        user_plan: data.plan,
        ...data.context,
        ...data.metadata,
      });
    }

    // PostHog (se configurado)
    if (window.posthog) {
      window.posthog.capture(data.event, {
        plan: data.plan,
        ...data.context,
        ...data.metadata,
      });
    }

    // Log para debug
    if (process.env.NODE_ENV === "development") {
      console.log("[Conversion] Event tracked:", data);
    }
  }
}

/**
 * Rastreia quando um limite é atingido
 */
export function trackLimitReached(params: {
  limitType: "workspaces" | "transactions" | "categories";
  currentValue: number;
  limitValue: number;
  source: string;
  userId?: string;
  plan: "FREE" | "PRO" | "BUSINESS";
}) {
  trackConversion({
    event: "limit_reached",
    userId: params.userId,
    plan: params.plan,
    context: {
      limitType: params.limitType,
      currentValue: params.currentValue,
      limitValue: params.limitValue,
      source: params.source,
      targetPlan: "PRO",
    },
  });
}

/**
 * Rastreia quando uma feature é bloqueada
 */
export function trackFeatureLocked(params: {
  feature: string;
  source: string;
  userId?: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  requiredPlan?: "PRO" | "BUSINESS";
}) {
  trackConversion({
    event: "feature_locked",
    userId: params.userId,
    plan: params.plan,
    context: {
      feature: params.feature,
      source: params.source,
      targetPlan: params.requiredPlan || "PRO",
    },
  });
}

/**
 * Rastreia quando preview premium é visualizado
 */
export function trackPreviewViewed(params: {
  feature: string;
  source: string;
  userId?: string;
  plan: "FREE" | "PRO" | "BUSINESS";
}) {
  trackConversion({
    event: "preview_viewed",
    userId: params.userId,
    plan: params.plan,
    context: {
      feature: params.feature,
      source: params.source,
    },
  });
}

/**
 * Rastreia quando modal de upgrade é aberto
 */
export function trackUpgradeModalOpened(params: {
  feature?: string;
  limitType?: "workspaces" | "transactions" | "categories" | "exports";
  source: string;
  userId?: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  targetPlan: "PRO" | "BUSINESS";
}) {
  trackConversion({
    event: "upgrade_modal_opened",
    userId: params.userId,
    plan: params.plan,
    context: {
      feature: params.feature,
      limitType: params.limitType,
      source: params.source,
      targetPlan: params.targetPlan,
    },
  });
}

/**
 * Rastreia quando checkout é iniciado
 */
export function trackCheckoutStarted(params: {
  targetPlan: "PRO" | "BUSINESS";
  source: string;
  userId?: string;
  plan: "FREE" | "PRO" | "BUSINESS";
}) {
  trackConversion({
    event: "checkout_started",
    userId: params.userId,
    plan: params.plan,
    context: {
      targetPlan: params.targetPlan,
      source: params.source,
    },
  });
}

/**
 * Rastreia quando upgrade é completado
 */
export function trackUpgradeCompleted(params: {
  targetPlan: "PRO" | "BUSINESS";
  source: string;
  userId?: string;
  previousPlan: "FREE" | "PRO" | "BUSINESS";
}) {
  trackConversion({
    event: "upgrade_completed",
    userId: params.userId,
    plan: params.targetPlan,
    context: {
      targetPlan: params.targetPlan,
      source: params.source,
    },
    metadata: {
      previousPlan: params.previousPlan,
    },
  });
}

// Tipos globais para TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

