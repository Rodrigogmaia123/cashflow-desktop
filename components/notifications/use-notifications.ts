"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BudgetNotificationWithBudget,
  NotificationStats,
} from "@/types/notification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<
    BudgetNotificationWithBudget[]
  >([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar notificações");

      const data = await response.json();
      setNotifications(data.notifications);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/stats");
      if (!response.ok) throw new Error("Erro ao buscar estatísticas");

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READ" }),
      });

      if (!response.ok) throw new Error("Erro ao marcar como lida");

      await fetchNotifications();
      await fetchStats();
    } catch (err: any) {
      console.error("Error marking as read:", err);
    }
  }, [fetchNotifications, fetchStats]);

  const markAsDismissed = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
      });

      if (!response.ok) throw new Error("Erro ao descartar");

      await fetchNotifications();
      await fetchStats();
    } catch (err: any) {
      console.error("Error dismissing:", err);
    }
  }, [fetchNotifications, fetchStats]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erro ao marcar todas como lidas");

      await fetchNotifications();
      await fetchStats();
    } catch (err: any) {
      console.error("Error marking all as read:", err);
    }
  }, [fetchNotifications, fetchStats]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar notificação");

      await fetchNotifications();
      await fetchStats();
    } catch (err: any) {
      console.error("Error deleting notification:", err);
    }
  }, [fetchNotifications, fetchStats]);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  return {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAsDismissed,
    markAllAsRead,
    deleteNotification,
  };
}

// Hook simplificado para contar unread
export function useUnreadCount(autoRefresh = true, intervalMs = 30000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/stats");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.stats.unread);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();

    if (autoRefresh) {
      const interval = setInterval(fetchCount, intervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchCount, autoRefresh, intervalMs]);

  return { unreadCount, loading, refresh: fetchCount };
}
