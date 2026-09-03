import { Budget } from "@prisma/client";
import type { BudgetPeriodType } from "@/lib/prisma-enums";
import { z } from "zod";

/**
 * Tipos e validações para Orçamentos (Budgets)
 */

// Schema de validação para criação de orçamento
export const createBudgetSchema = z.object({
  workspaceId: z.string().min(1, "Workspace é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  amount: z.number().positive("Valor deve ser positivo"),
  periodType: z.enum(["MONTHLY", "CUSTOM"]).default("MONTHLY"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Schema de validação para atualização de orçamento
export const updateBudgetSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo").optional(),
  amount: z.number().positive("Valor deve ser positivo").optional(),
  periodType: z.enum(["MONTHLY", "CUSTOM"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória").optional(),
});

// Tipos derivados dos schemas
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// Tipo estendido do Budget com informações da categoria
export interface BudgetWithCategory extends Budget {
  category: {
    id: string;
    name: string;
    type: string;
  };
}

// Tipo para resposta da API com informações de uso
export interface BudgetWithUsage extends BudgetWithCategory {
  spent: number; // Valor já gasto no período
  remaining: number; // Valor restante
  percentUsed: number; // Percentual usado (0-100)
  isOverBudget: boolean; // Se ultrapassou o orçamento
}

// Tipo para listagem de orçamentos
export interface BudgetListItem {
  id: string;
  name: string;
  amount: number;
  periodType: BudgetPeriodType;
  startDate: Date;
  endDate: Date;
  category: {
    id: string;
    name: string;
    type: string;
  };
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

// Tipo para filtros de busca
export interface BudgetFilters {
  workspaceId: string;
  categoryId?: string;
  periodType?: BudgetPeriodType;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean; // Se está dentro do período atual
  activeOnly?: boolean; // Alias para isActive
}
