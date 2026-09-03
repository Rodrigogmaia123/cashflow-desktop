"use client";

import { Bell } from "lucide-react";
import { useUnreadCount } from "./use-notifications";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  onClick?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export function NotificationBadge({
  onClick,
  autoRefresh = true,
  refreshInterval = 30000,
  className,
}: NotificationBadgeProps) {
  const { unreadCount, loading } = useUnreadCount(autoRefresh, refreshInterval);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        className
      )}
      aria-label={`Notificações (${unreadCount} não lidas)`}
    >
      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      {loading && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
