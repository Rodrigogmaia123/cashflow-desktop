/**
 * Sistema de Copy de Conversão
 * 
 * Textos otimizados para conversão, específicos por contexto e feature.
 * Linguagem direta, orientada a valor e benefício imediato.
 */

import type { Feature } from "@/lib/plans/features";

export interface ConversionCopy {
  title: string;
  description: string;
  cta: string;
  benefit: string; // Benefício imediato
  urgency?: string; // Texto de urgência (opcional)
}

/**
 * Copy específico por feature bloqueada
 */
export const FEATURE_COPY: Record<Feature, ConversionCopy> = {
  workspaces_unlimited: {
    title: "Gerencie múltiplos projetos",
    description: "Crie workspaces separados para cada negócio ou cliente e organize tudo em um só lugar.",
    cta: "Upgrade para Pro",
    benefit: "Ilimitado",
    urgency: "Organize seus projetos agora",
  },
  exports_pdf: {
    title: "Exporte relatórios profissionais",
    description: "Gere PDFs prontos para apresentar aos clientes, sócios ou para sua própria análise.",
    cta: "Desbloquear Exportação PDF",
    benefit: "PDFs profissionais em 1 clique",
  },
  exports_excel: {
    title: "Exporte seus dados",
    description: "Baixe tudo em Excel/CSV para análises avançadas, relatórios personalizados ou backup.",
    cta: "Desbloquear Exportação Excel",
    benefit: "Análise seus dados onde quiser",
  },
  categories_custom: {
    title: "Organize do seu jeito",
    description: "Crie categorias personalizadas que fazem sentido para seu negócio e tenha controle total.",
    cta: "Desbloquear Categorias",
    benefit: "Organização que funciona para você",
  },
  automations: {
    title: "Automatize tarefas repetitivas",
    description: "Ganhe tempo com automações inteligentes e foque no que realmente importa.",
    cta: "Upgrade para Business",
    benefit: "Economize horas toda semana",
  },
  api_access: {
    title: "Integre com seus sistemas",
    description: "Conecte o Cashflow Pro com suas ferramentas favoritas e sincronize tudo automaticamente.",
    cta: "Upgrade para Business",
    benefit: "Integração completa com sua stack",
  },
  advanced_reports: {
    title: "Análises profundas do seu negócio",
    description: "Acesse relatórios detalhados, insights acionáveis e métricas que realmente importam.",
    cta: "Desbloquear Relatórios",
    benefit: "Entenda seu negócio de verdade",
  },
  historical_analysis: {
    title: "Compare períodos e evolua",
    description: "Veja sua evolução ao longo do tempo, compare meses e identifique tendências.",
    cta: "Desbloquear Análise Histórica",
    benefit: "Tome decisões baseadas em dados",
  },
  multi_user: {
    title: "Colabore com sua equipe",
    description: "Compartilhe workspaces com colegas, clientes ou parceiros e trabalhe juntos.",
    cta: "Upgrade para Business",
    benefit: "Trabalho em equipe sem complicação",
  },
  permissions_control: {
    title: "Controle total de acesso",
    description: "Defina quem pode ver e editar o quê, com permissões granulares e seguras.",
    cta: "Upgrade para Business",
    benefit: "Segurança e controle profissional",
  },
  custom_reports: {
    title: "Relatórios do seu jeito",
    description: "Crie dashboards personalizados com exatamente as métricas que você precisa.",
    cta: "Upgrade para Business",
    benefit: "Vista seu negócio do seu jeito",
  },
  priority_support: {
    title: "Suporte quando você precisa",
    description: "Respostas em até 4 horas, prioridade no atendimento e ajuda dedicada.",
    cta: "Upgrade para Business",
    benefit: "Ajuda rápida quando importa",
  },
};

/**
 * Copy específico por limite atingido
 */
export const LIMIT_COPY: Record<
  "workspaces" | "transactions" | "categories",
  ConversionCopy
> = {
  workspaces: {
    title: "Você atingiu o limite de workspaces",
    description: "O plano FREE permite apenas 1 workspace. Com o Pro, gerencie quantos projetos quiser.",
    cta: "Upgrade para Pro",
    benefit: "Workspaces ilimitados",
    urgency: "Crie seu segundo workspace agora",
  },
  transactions: {
    title: "Limite de lançamentos atingido",
    description: "Você já registrou 100 lançamentos este mês. Com o Pro, não há limites.",
    cta: "Desbloquear Lançamentos Ilimitados",
    benefit: "Continue trabalhando sem limites",
    urgency: "Você ainda tem dados para registrar",
  },
  categories: {
    title: "Categorias personalizadas bloqueadas",
    description: "Organize suas finanças do seu jeito. Crie categorias que fazem sentido para seu negócio.",
    cta: "Desbloquear Categorias",
    benefit: "Organização que funciona para você",
  },
};

/**
 * Copy genérico para upgrade
 */
export const UPGRADE_COPY: ConversionCopy = {
  title: "Desbloqueie todo o potencial",
  description: "Acesse funcionalidades avançadas que vão transformar como você gerencia suas finanças.",
  cta: "Fazer Upgrade",
  benefit: "Recursos profissionais ao seu alcance",
};

/**
 * Obtém copy específico para uma feature
 */
export function getFeatureCopy(feature: Feature): ConversionCopy {
  return FEATURE_COPY[feature];
}

/**
 * Obtém copy específico para um limite
 */
export function getLimitCopy(
  limitType: "workspaces" | "transactions" | "categories"
): ConversionCopy {
  return LIMIT_COPY[limitType];
}

/**
 * Gera mensagem personalizada com contexto
 */
export function generatePersonalizedMessage(
  copy: ConversionCopy,
  context?: {
    userName?: string;
    currentValue?: number;
    limitValue?: number;
    daysLeftInMonth?: number;
  }
): string {
  let message = copy.description;

  if (context?.userName) {
    message = `Olá ${context.userName}, ${message.toLowerCase()}`;
  }

  if (context?.currentValue !== undefined && context?.limitValue !== undefined) {
    const percentage = Math.round((context.currentValue / context.limitValue) * 100);
    if (percentage >= 80) {
      message += ` Você já usou ${context.currentValue} de ${context.limitValue} (${percentage}%).`;
    }
  }

  if (context?.daysLeftInMonth && context.daysLeftInMonth > 0) {
    message += ` Ainda faltam ${context.daysLeftInMonth} dias no mês.`;
  }

  return message;
}

