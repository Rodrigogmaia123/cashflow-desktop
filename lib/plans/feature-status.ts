/**
 * Sistema de Status de Features
 * 
 * Define o status de cada feature (ativa, em desenvolvimento, desativada)
 */

import type { Feature } from "./features";

export type FeatureStatus = "active" | "coming_soon" | "disabled";

export interface FeatureStatusInfo {
  status: FeatureStatus;
  reason?: string;
  message?: string;
}

/**
 * Status de features especiais
 * Features que estão visíveis mas não ativas
 */
const FEATURE_STATUS: Record<Feature, FeatureStatusInfo> = {
  workspaces_unlimited: { status: "active" },
  exports_pdf: { status: "active" },
  exports_excel: { status: "active" },
  categories_custom: { status: "active" },
  automations: { status: "active" },
  api_access: {
    status: "coming_soon",
    reason: "coming_soon",
    message: "Estamos construindo uma API poderosa para integrações avançadas. Em breve.",
  },
  advanced_reports: { status: "active" },
  historical_analysis: { status: "active" },
  multi_user: { status: "active" },
  permissions_control: { status: "active" },
  custom_reports: { status: "active" },
  priority_support: { status: "active" },
};

/**
 * Obtém o status de uma feature
 */
export function getFeatureStatus(feature: Feature): FeatureStatusInfo {
  return FEATURE_STATUS[feature] || { status: "active" };
}

/**
 * Verifica se uma feature está ativa (não apenas disponível no plano, mas realmente funcional)
 */
export function isFeatureActive(feature: Feature): boolean {
  const status = getFeatureStatus(feature);
  return status.status === "active";
}

/**
 * Verifica se uma feature está em desenvolvimento
 */
export function isFeatureComingSoon(feature: Feature): boolean {
  const status = getFeatureStatus(feature);
  return status.status === "coming_soon";
}

