"use client";

import { useState } from "react";
import { CheckCheck, Filter, Bell, CheckCircle, Eye, XCircle } from "lucide-react";
import { useNotifications } from "./use-notifications";
import { NotificationList } from "./notification-list";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SimpleAlert } from "@/components/ui/simple-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NotificationPanelProps {
  initialFilter?: "UNREAD" | "ALL";
}

export function NotificationPanel({
  initialFilter = "ALL",
}: NotificationPanelProps) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ" | "DISMISSED">(
    initialFilter
  );
  const {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAsDismissed,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    if (newFilter === "ALL") {
      fetchNotifications();
    } else {
      fetchNotifications({ status: newFilter });
    }
  };

  const filteredNotifications =
    filter === "ALL"
      ? notifications
      : notifications.filter((n) => n.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Notificações</h2>
          <p className="text-xs text-muted-foreground">Acompanhe alertas e avisos sobre seus orçamentos</p>
        </div>
        {stats && stats.unread > 0 && (
          <Button
            onClick={markAllAsRead}
            size="sm"
            variant="default"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <DashboardSection>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total"
              value={stats.total}
              icon={<Bell className="h-4 w-4" />}
            />
            <MetricCard
              label="Não Lidas"
              value={stats.unread}
              icon={<Eye className="h-4 w-4" />}
            />
            <MetricCard
              label="Lidas"
              value={stats.read}
              icon={<CheckCircle className="h-4 w-4" />}
            />
            <MetricCard
              label="Descartadas"
              value={stats.dismissed}
              icon={<XCircle className="h-4 w-4" />}
            />
          </div>
        </DashboardSection>
      )}

      {/* Filters */}
      <DashboardSection>
        <Card className="border-white/5 bg-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filtros:</span>
              </div>

              <select
                value={filter}
                onChange={(e) =>
                  handleFilterChange(e.target.value as typeof filter)
                }
                className="text-sm border border-white/10 rounded-lg px-3 py-2 bg-background text-foreground focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Todas</option>
                <option value="UNREAD">Não lidas</option>
                <option value="READ">Lidas</option>
                <option value="DISMISSED">Descartadas</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Error */}
      {error && (
        <SimpleAlert
          type="error"
          message={error}
          details="Tente recarregar a página ou entre em contato com o suporte"
        />
      )}

      {/* Notification List */}
      <DashboardSection>
        {!loading && stats && stats.total === 0 ? (
          <Card className="border-white/5 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma notificação ainda
              </h3>
              <div className="text-sm text-muted-foreground text-center max-w-md space-y-2">
                <p>
                  As notificações são geradas automaticamente quando você atinge limites de gastos nos seus orçamentos.
                </p>
                <p className="font-medium text-foreground pt-2">
                  Como funciona:
                </p>
                <ul className="text-left space-y-1 inline-block">
                  <li>• 75% do orçamento = Alerta amarelo ⚠️</li>
                  <li>• 90% do orçamento = Alerta laranja 🔶</li>
                  <li>• 100% do orçamento = Alerta vermelho 🔴</li>
                  <li>• Acima de 110% = Alerta crítico ⛔</li>
                </ul>
                <p className="pt-3">
                  Registre despesas em <a href="/app/cashflow" className="text-primary hover:underline">Cashflow</a> para começar a acompanhar!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onDismiss={markAsDismissed}
            onDelete={deleteNotification}
            loading={loading}
          />
        )}
      </DashboardSection>
    </div>
  );
}
