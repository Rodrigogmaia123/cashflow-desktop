"use client";

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Check, Trash2, AlertCircle } from "lucide-react";
import { BudgetNotificationWithBudget } from "@/types/notification";
import {
  getNotificationIcon,
  getNotificationColor,
  parseNotificationMetadata,
} from "@/types/notification";
import { cn } from "@/lib/utils";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

interface NotificationItemProps {
  notification: BudgetNotificationWithBudget;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
  currency?: CurrencyCode;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onDelete,
  currency = "BRL",
}: NotificationItemProps) {
  const metadata = parseNotificationMetadata(notification.metadata);
  const isUnread = notification.status === "UNREAD";
  const color = getNotificationColor(notification.type);
  const icon = getNotificationIcon(notification.type);

  const colorClasses = {
    yellow: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
    orange: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
    red: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    gray: "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800",
  };

  const badgeClasses = {
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200",
  };

  return (
    <div
      className={cn(
        "relative border rounded-lg p-4 transition-all",
        colorClasses[color as keyof typeof colorClasses],
        isUnread ? "shadow-md" : "opacity-75"
      )}
    >
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {notification.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isUnread && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
              title="Marcar como lida"
            >
              <Check className="w-4 h-4 text-green-600" />
            </button>
          )}
          <button
            onClick={() => onDismiss(notification.id)}
            className="p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
            title="Descartar"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(notification.id)}
            className="p-1 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
            title="Deletar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        {notification.message}
      </p>

      {/* Metadata */}
      {metadata && (
        <div className="flex items-center gap-4 text-xs">
          <span
            className={cn(
              "px-2 py-1 rounded-full font-medium",
              badgeClasses[color as keyof typeof badgeClasses]
            )}
          >
            {metadata.categoryName}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {metadata.percentUsed.toFixed(1)}% usado
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {formatMoney(metadata.spent, currency)} / {formatMoney(metadata.amount, currency)}
          </span>
        </div>
      )}

      {/* Budget link */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <a
          href={`/app/budgets?budget=${notification.budgetId}`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Ver orçamento →
        </a>
      </div>
    </div>
  );
}

interface NotificationListProps {
  notifications: BudgetNotificationWithBudget[];
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onDismiss,
  onDelete,
  loading,
  currency = "BRL",
}: NotificationListProps & { currency?: CurrencyCode }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Nenhuma notificação
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Você não tem notificações no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
          onDelete={onDelete}
          currency={currency}
        />
      ))}
    </div>
  );
}
