import { prisma } from "@/lib/db";
import {
  CreateNotificationInput,
  UpdateNotificationStatusInput,
  NotificationFilters,
  BudgetNotificationWithBudget,
  NotificationStats,
} from "@/types/notification";
import { NotificationType, NotificationStatus } from "@/lib/prisma-enums";

// ==================== CRUD OPERATIONS ====================

export async function createNotification(
  input: CreateNotificationInput
): Promise<BudgetNotificationWithBudget> {
  const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

  const notification = await prisma.budgetNotification.create({
    data: {
      workspaceId: input.workspaceId,
      budgetId: input.budgetId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: metadataJson,
    },
    include: {
      budget: {
        include: {
          category: true,
        },
      },
    },
  });

  return notification as BudgetNotificationWithBudget;
}

export async function listNotifications(
  filters: NotificationFilters
): Promise<BudgetNotificationWithBudget[]> {
  const where: any = {
    workspaceId: filters.workspaceId,
  };

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const notifications = await prisma.budgetNotification.findMany({
    where,
    include: {
      budget: {
        include: {
          category: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // UNREAD primeiro
      { createdAt: "desc" },
    ],
    take: filters.limit,
    skip: filters.offset,
  });

  return notifications as BudgetNotificationWithBudget[];
}

export async function getNotificationById(
  notificationId: string,
  workspaceId: string
): Promise<BudgetNotificationWithBudget | null> {
  const notification = await prisma.budgetNotification.findFirst({
    where: {
      id: notificationId,
      workspaceId,
    },
    include: {
      budget: {
        include: {
          category: true,
        },
      },
    },
  });

  return notification as BudgetNotificationWithBudget | null;
}

export async function updateNotificationStatus(
  notificationId: string,
  workspaceId: string,
  input: UpdateNotificationStatusInput
): Promise<BudgetNotificationWithBudget> {
  const data: any = {
    status: input.status,
  };

  if (input.status === "READ") {
    data.readAt = new Date();
  }

  if (input.status === "DISMISSED") {
    data.dismissedAt = new Date();
  }

  const notification = await prisma.budgetNotification.update({
    where: {
      id: notificationId,
      workspaceId,
    },
    data,
    include: {
      budget: {
        include: {
          category: true,
        },
      },
    },
  });

  return notification as BudgetNotificationWithBudget;
}

export async function deleteNotification(
  notificationId: string,
  workspaceId: string
): Promise<void> {
  await prisma.budgetNotification.delete({
    where: {
      id: notificationId,
      workspaceId,
    },
  });
}

export async function markAllAsRead(
  workspaceId: string,
  userId: string
): Promise<number> {
  const result = await prisma.budgetNotification.updateMany({
    where: {
      workspaceId,
      userId,
      status: "UNREAD",
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  return result.count;
}

// ==================== STATISTICS ====================

export async function getNotificationStats(
  workspaceId: string,
  userId?: string
): Promise<NotificationStats> {
  const where: any = {
    workspaceId,
  };

  if (userId) {
    where.userId = userId;
  }

  const [total, unread, read, dismissed, byTypeResults] = await Promise.all([
    prisma.budgetNotification.count({ where }),
    prisma.budgetNotification.count({ where: { ...where, status: "UNREAD" } }),
    prisma.budgetNotification.count({ where: { ...where, status: "READ" } }),
    prisma.budgetNotification.count({ where: { ...where, status: "DISMISSED" } }),
    prisma.budgetNotification.groupBy({
      by: ["type"],
      where,
      _count: true,
    }),
  ]);

  const byType = {
    warning75: 0,
    warning90: 0,
    exceeded100: 0,
    criticalExceeded: 0,
  };

  byTypeResults.forEach((result) => {
    if (result.type === "BUDGET_WARNING_75") {
      byType.warning75 = result._count;
    } else if (result.type === "BUDGET_WARNING_90") {
      byType.warning90 = result._count;
    } else if (result.type === "BUDGET_EXCEEDED_100") {
      byType.exceeded100 = result._count;
    } else if (result.type === "BUDGET_CRITICAL_EXCEEDED") {
      byType.criticalExceeded = result._count;
    }
  });

  return {
    total,
    unread,
    read,
    dismissed,
    byType,
  };
}

// ==================== UTILITIES ====================

export async function checkForDuplicateNotification(
  workspaceId: string,
  budgetId: string,
  type: NotificationType,
  hoursWindow: number = 24
): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursWindow);

  const existing = await prisma.budgetNotification.findFirst({
    where: {
      workspaceId,
      budgetId,
      type,
      createdAt: {
        gte: cutoffDate,
      },
    },
  });

  return !!existing;
}

export async function deleteOldNotifications(
  workspaceId: string,
  daysOld: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.budgetNotification.deleteMany({
    where: {
      workspaceId,
      status: {
        in: ["READ", "DISMISSED"],
      },
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

export async function getUnreadCount(
  workspaceId: string,
  userId: string
): Promise<number> {
  return await prisma.budgetNotification.count({
    where: {
      workspaceId,
      userId,
      status: "UNREAD",
    },
  });
}
