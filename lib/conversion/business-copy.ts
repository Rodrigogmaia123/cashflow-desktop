/**
 * Copy Específico para Upgrade PRO → BUSINESS
 * 
 * Focado em escala, time e recursos empresariais.
 * Nunca bloqueia, apenas sugere com base em necessidade real.
 */

import type { ExpansionTrigger } from "@/lib/expansion/triggers";

export interface BusinessCopy {
  title: string;
  headline: string; // Headline principal
  description: string;
  benefits: string[]; // Lista de benefícios específicos
  cta: string;
  urgency?: string;
  socialProof?: string;
}

/**
 * Copy por gatilho de expansão
 */
export const TRIGGER_COPY: Record<ExpansionTrigger, BusinessCopy> = {
  multiple_workspaces: {
    title: "Gerencie múltiplos projetos com sua equipe",
    headline: "Você está gerenciando vários projetos",
    description:
      "Colabore com sua equipe compartilhando workspaces, controle permissões e trabalhe em conjunto nos seus projetos.",
    benefits: [
      "Multi-usuário por workspace",
      "Controle de permissões granular",
      "Colaboração em tempo real",
      "Gestão centralizada de equipe",
    ],
    cta: "Upgrade para Business",
    urgency: "Otimize sua gestão agora",
  },
  high_transaction_volume: {
    title: "Escale seu negócio com recursos avançados",
    headline: "Você está processando muitos dados",
    description:
      "Com o Business, automatize tarefas repetitivas, integre com suas ferramentas e tenha insights ainda mais profundos.",
    benefits: [
      "Automações inteligentes",
      "Integração via API",
      "Relatórios agendados",
      "Exportações automáticas",
    ],
    cta: "Escalar para Business",
    urgency: "Ganhe tempo e eficiência",
  },
  frequent_exports: {
    title: "Automatize suas exportações",
    headline: "Você exporta relatórios frequentemente",
    description:
      "Configure exportações automáticas, relatórios agendados e integre seus dados com outras ferramentas.",
    benefits: [
      "Exportações automáticas",
      "Relatórios agendados por email",
      "Integração via API",
      "Webhooks para sincronização",
    ],
    cta: "Automatizar Exportações",
    urgency: "Poupe tempo toda semana",
  },
  api_requests_detected: {
    title: "Integre com sua stack",
    headline: "Você precisa de integrações",
    description:
      "Acesse a API completa do Cashflow Pro e integre com suas ferramentas favoritas de forma programática.",
    benefits: [
      "API REST completa",
      "Webhooks em tempo real",
      "Documentação dedicada",
      "Suporte para integrações",
    ],
    cta: "Desbloquear API",
    urgency: "Conecte seus sistemas",
  },
  multi_user_workspace_needed: {
    title: "Colabore com sua equipe",
    headline: "Seu time precisa colaborar",
    description:
      "Compartilhe workspaces com sua equipe, defina permissões específicas e trabalhe em conjunto de forma segura.",
    benefits: [
      "Usuários ilimitados por workspace",
      "Controle de permissões avançado",
      "Histórico de atividades",
      "Gestão de acessos centralizada",
    ],
    cta: "Ativar Multi-usuário",
    urgency: "Trabalhe junto com sua equipe",
  },
  advanced_reporting_needed: {
    title: "Relatórios personalizados para seu negócio",
    headline: "Você precisa de análises mais profundas",
    description:
      "Crie relatórios totalmente personalizados, agende envios automáticos e tenha insights acionáveis para decisões estratégicas.",
    benefits: [
      "Relatórios customizados",
      "Agendamento automático",
      "Dashboards personalizados",
      "Métricas sob medida",
    ],
    cta: "Desbloquear Relatórios Avançados",
    urgency: "Tome decisões baseadas em dados",
  },
  team_collaboration_signals: {
    title: "Potencialize seu time",
    headline: "Colaboração faz diferença",
    description:
      "Permita que sua equipe trabalhe junto, com segurança, controle e eficiência. Gestão financeira colaborativa.",
    benefits: [
      "Multi-usuário ilimitado",
      "Permissões granulares",
      "Auditoria completa",
      "Gestão de equipe",
    ],
    cta: "Ativar Colaboração",
    urgency: "Trabalhe melhor em equipe",
  },
  enterprise_features_usage: {
    title: "Você está pronto para o próximo nível",
    headline: "Seu negócio está crescendo",
    description:
      "Acesse recursos empresariais que vão transformar como você gerencia suas finanças: API, automações, multi-usuário e muito mais.",
    benefits: [
      "Todos os recursos do Business",
      "API completa",
      "Multi-usuário ilimitado",
      "Suporte prioritário",
    ],
    cta: "Fazer Upgrade para Business",
    urgency: "Escale seu negócio agora",
  },
};

/**
 * Copy genérico para BUSINESS
 */
export const GENERIC_BUSINESS_COPY: BusinessCopy = {
  title: "Recursos empresariais para escalar",
  headline: "Potencialize seu negócio",
  description:
    "Acesse recursos avançados para equipes e empresas que precisam de mais: API, automações, multi-usuário e suporte prioritário.",
  benefits: [
    "API completa para integrações",
    "Multi-usuário ilimitado",
    "Automações e agendamentos",
    "Suporte prioritário (4h)",
  ],
  cta: "Fazer Upgrade para Business",
};

/**
 * Obtém copy específico por gatilho
 */
export function getBusinessCopyByTrigger(
  trigger: ExpansionTrigger
): BusinessCopy {
  return TRIGGER_COPY[trigger] || GENERIC_BUSINESS_COPY;
}

/**
 * Gera mensagem personalizada baseada em contexto
 */
export function generateBusinessMessage(
  copy: BusinessCopy,
  context?: {
    workspacesCount?: number;
    monthlyTransactions?: number;
    userName?: string;
  }
): string {
  let message = copy.description;

  if (context?.userName) {
    message = `${context.userName}, ${message.toLowerCase()}`;
  }

  if (context?.workspacesCount && context.workspacesCount >= 3) {
    message += ` Você já gerencia ${context.workspacesCount} projetos diferentes.`;
  }

  if (context?.monthlyTransactions && context.monthlyTransactions >= 500) {
    message += ` Processando ${context.monthlyTransactions}+ transações por mês, recursos de automação podem fazer diferença.`;
  }

  return message;
}

