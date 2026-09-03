/**
 * Sistema de Feature Flags por Plano
 * 
 * Define quais funcionalidades estão disponíveis em cada plano.
 * Esta é a fonte de verdade para permissões de features.
 */

import type { Plan } from "@/lib/billing/plans";

export type Feature = 
  | "workspaces_unlimited"
  | "exports_pdf"
  | "exports_excel"
  | "categories_custom"
  | "automations"
  | "api_access"
  | "advanced_reports"
  | "historical_analysis"
  | "multi_user"
  | "permissions_control"
  | "custom_reports"
  | "priority_support";

/**
 * Mapa de features por plano
 * FREE tem acesso apenas ao essencial
 * PRO tem recursos profissionais
 * BUSINESS tem tudo + recursos empresariais
 */
const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [
    // FREE não tem nenhuma feature premium
  ],
  PRO: [
    "workspaces_unlimited",
    "exports_pdf",
    "exports_excel",
    "categories_custom",
    "advanced_reports",
    "historical_analysis",
  ],
  BUSINESS: [
    "workspaces_unlimited",
    "exports_pdf",
    "exports_excel",
    "categories_custom",
    "automations",
    // "api_access", // Desativado - Em desenvolvimento
    "advanced_reports",
    "historical_analysis",
    "multi_user",
    "permissions_control",
    "custom_reports",
    "priority_support",
  ],
};

/**
 * Verifica se um plano tem acesso a uma feature específica
 */
export function hasFeature(plan: Plan, feature: Feature): boolean {
  const features = PLAN_FEATURES[plan];
  return features.includes(feature);
}

/**
 * Retorna todas as features de um plano
 */
export function getPlanFeatures(plan: Plan): Feature[] {
  return PLAN_FEATURES[plan];
}

/**
 * Retorna o plano mínimo necessário para acessar uma feature
 */
export function getRequiredPlanForFeature(feature: Feature): Plan {
  if (PLAN_FEATURES.PRO.includes(feature)) {
    return "PRO";
  }
  if (PLAN_FEATURES.BUSINESS.includes(feature)) {
    return "BUSINESS";
  }
  return "FREE";
}

/**
 * Mensagens amigáveis para cada feature bloqueada
 */
export const FEATURE_MESSAGES: Record<Feature, { title: string; description: string; requiredPlan: Plan }> = {
  workspaces_unlimited: {
    title: "Workspaces Ilimitados",
    description: "Gerencie múltiplos projetos e negócios em workspaces separados.",
    requiredPlan: "PRO",
  },
  exports_pdf: {
    title: "Exportação PDF",
    description: "Exporte seus relatórios e análises em formato PDF profissional.",
    requiredPlan: "PRO",
  },
  exports_excel: {
    title: "Exportação Excel",
    description: "Exporte seus dados para Excel/CSV para análise avançada.",
    requiredPlan: "PRO",
  },
  categories_custom: {
    title: "Categorias Personalizadas",
    description: "Crie categorias personalizadas para organizar suas receitas e despesas.",
    requiredPlan: "PRO",
  },
  automations: {
    title: "Automações",
    description: "Automatize tarefas repetitivas e ganhe tempo no seu dia a dia.",
    requiredPlan: "BUSINESS",
  },
  api_access: {
    title: "Acesso à API",
    description: "Integre o Cashflow Pro com seus sistemas e automações.",
    requiredPlan: "BUSINESS",
  },
  advanced_reports: {
    title: "Relatórios Avançados",
    description: "Acesse análises detalhadas e insights profundos sobre seu negócio.",
    requiredPlan: "PRO",
  },
  historical_analysis: {
    title: "Análise Histórica",
    description: "Compare períodos e acompanhe a evolução do seu negócio ao longo do tempo.",
    requiredPlan: "PRO",
  },
  multi_user: {
    title: "Multi-usuário",
    description: "Colabore com sua equipe compartilhando workspaces com outros usuários.",
    requiredPlan: "BUSINESS",
  },
  permissions_control: {
    title: "Controle de Permissões",
    description: "Defina permissões granulares para cada membro da equipe.",
    requiredPlan: "BUSINESS",
  },
  custom_reports: {
    title: "Relatórios Personalizados",
    description: "Crie relatórios personalizados com as métricas mais importantes para você.",
    requiredPlan: "BUSINESS",
  },
  priority_support: {
    title: "Suporte Prioritário",
    description: "Receba atendimento prioritário com resposta garantida em até 4 horas.",
    requiredPlan: "BUSINESS",
  },
};

