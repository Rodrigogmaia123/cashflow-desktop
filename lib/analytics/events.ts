/**
 * Sistema de Analytics Events
 * 
 * Rastreia eventos importantes para análise de conversão e uso de features.
 */

import { prisma } from "@/lib/db";

export type AnalyticsEvent = 
  | "business_feature_locked"
  | "business_hint_shown"
  | "business_upgrade_started"
  | "business_upgrade_completed"
  | "api_key_created"
  | "api_key_revoked"
  | "api_feature_viewed"
  | "team_member_invited"
  | "team_member_added"
  | "custom_report_saved"
  | "custom_report_loaded"
  | "support_request_created";

interface EventData {
  userId?: string;
  workspaceId?: string;
  feature?: string;
  plan?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra um evento de analytics
 */
export async function trackEvent(
  event: AnalyticsEvent,
  data: EventData = {}
): Promise<void> {
  try {
    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${event}`, data);
    }

    // Em produção, você pode integrar com:
    // - PostHog
    // - Mixpanel
    // - Amplitude
    // - Google Analytics
    // - Ou salvar em uma tabela de eventos

    if (typeof window !== "undefined" || !prisma) {
      return;
    }

    await prisma.metricEvent.create({
      data: {
        name: event,
        durationMs: 0,
        level: "INFO",
        success: true,
        workspaceId: data.workspaceId || null,
        action: data.feature || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    // Não quebra o fluxo se analytics falhar
    console.error(`[Analytics] Erro ao registrar evento ${event}:`, error);
  }
}

