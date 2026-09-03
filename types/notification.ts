import { BudgetNotification } from "@prisma/client";
import type { NotificationType, NotificationStatus } from "@/lib/prisma-enums";
import { z } from "zod";

// ==================== SCHEMAS ====================

export const createNotificationSchema = z.object({
  workspaceId: z.string().min(1),
  budgetId: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum([
    "BUDGET_WARNING_75",
    "BUDGET_WARNING_90",
    "BUDGET_EXCEEDED_100",
    "BUDGET_CRITICAL_EXCEEDED",
  ]),
  title: z.string().min(1),
  message: z.string().min(1),
  metadata: z.object({
    percentUsed: z.number(),
    spent: z.number(),
    amount: z.number(),
    categoryName: z.string(),
  }).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const updateNotificationStatusSchema = z.object({
  status: z.enum(["UNREAD", "READ", "DISMISSED"]),
});

export type UpdateNotificationStatusInput = z.infer<typeof updateNotificationStatusSchema>;

export const notificationFiltersSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().optional(),
  status: z.enum(["UNREAD", "READ", "DISMISSED"]).optional(),
  type: z.enum([
    "BUDGET_WARNING_75",
    "BUDGET_WARNING_90",
    "BUDGET_EXCEEDED_100",
    "BUDGET_CRITICAL_EXCEEDED",
  ]).optional(),
  limit: z.number().positive().optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;

// ==================== INTERFACES ====================

export interface BudgetNotificationWithBudget extends BudgetNotification {
  budget: {
    id: string;
    name: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
  };
}

export interface NotificationMetadata {
  percentUsed: number;
  spent: number;
  amount: number;
  categoryName: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  dismissed: number;
  byType: {
    warning75: number;
    warning90: number;
    exceeded100: number;
    criticalExceeded: number;
  };
}

// ==================== UTILS ====================

export function parseNotificationMetadata(metadata: string | null): NotificationMetadata | null {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata) as NotificationMetadata;
  } catch {
    return null;
  }
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "BUDGET_WARNING_75":
      return "⚠️";
    case "BUDGET_WARNING_90":
      return "🔔";
    case "BUDGET_EXCEEDED_100":
      return "🚨";
    case "BUDGET_CRITICAL_EXCEEDED":
      return "❌";
    default:
      return "📢";
  }
}

export function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "BUDGET_WARNING_75":
      return "yellow";
    case "BUDGET_WARNING_90":
      return "orange";
    case "BUDGET_EXCEEDED_100":
      return "red";
    case "BUDGET_CRITICAL_EXCEEDED":
      return "red";
    default:
      return "gray";
  }
}

export function getNotificationPriority(type: NotificationType): number {
  switch (type) {
    case "BUDGET_CRITICAL_EXCEEDED":
      return 4;
    case "BUDGET_EXCEEDED_100":
      return 3;
    case "BUDGET_WARNING_90":
      return 2;
    case "BUDGET_WARNING_75":
      return 1;
    default:
      return 0;
  }
}
