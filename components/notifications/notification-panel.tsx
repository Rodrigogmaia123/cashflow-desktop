"use client";

import { useEffect } from "react";
import { CheckCheck } from "lucide-react";
import { useNotifications } from "./use-notifications";
import { NotificationList } from "./notification-list";
import { SimpleAlert } from "@/components/ui/simple-alert";
import { Button } from "@/components/ui/button";
import { prefKey, useLocalPref } from "@/lib/ui/local-prefs";
import { field, pageLead, pageTitle, surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  initialFilter?: "UNREAD" | "ALL";
}

export function NotificationPanel({
  initialFilter = "ALL",
}: NotificationPanelProps) {
  const [filter, setFilter] = useLocalPref<"ALL" | "UNREAD" | "READ" | "DISMISSED">(
    prefKey("notifications", "filter"),
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

  useEffect(() => {
    if (filter === "ALL") {
      fetchNotifications();
    } else {
      fetchNotifications({ status: filter });
    }
  }, [filter, fetchNotifications]);

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  const filteredNotifications =
    filter === "ALL"
      ? notifications
      : notifications.filter((n) => n.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className={pageTitle}>Notificações</h1>
          <p className={pageLead}>Acompanhe alertas e avisos sobre seus orçamentos.</p>
        </div>
        {stats && stats.unread > 0 && (
          <Button onClick={markAllAsRead} size="sm" variant="outline">
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {stats && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total" value={stats.total} />
          <Stat label="Não lidas" value={stats.unread} />
          <Stat label="Lidas" value={stats.read} />
          <Stat label="Descartadas" value={stats.dismissed} />
        </div>
      )}

      <div className={cn(surface, "flex flex-wrap items-center gap-3 px-4 py-3")}>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">Filtros</span>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as typeof filter)}
          className={cn(field, "h-9 w-auto")}
        >
          <option value="ALL">Todas</option>
          <option value="UNREAD">Não lidas</option>
          <option value="READ">Lidas</option>
          <option value="DISMISSED">Descartadas</option>
        </select>
      </div>

      {error && (
        <SimpleAlert type="error" message={error} details="Tente recarregar a página ou entre em contato com o suporte" />
      )}

      {!loading && stats && stats.total === 0 ? (
        <div className="space-y-4">
          <section className={cn(surface, "flex flex-col items-center px-6 py-14 text-center")}>
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-white/10 text-[#ac93ff]">◇</span>
            <h2 className="font-display text-lg font-semibold">Nenhuma notificação ainda</h2>
            <p className="mt-2 max-w-md text-sm text-[#9ca9a1]">
              As notificações são geradas automaticamente quando você atinge limites de gastos nos seus orçamentos.
            </p>
            <p className="mt-3 text-sm text-[#9ca9a1]">
              Registre despesas em <a href="/app/cashflow" className="text-[#ac93ff] hover:underline">Cashflow</a> para começar a acompanhar.
            </p>
          </section>
          <div>
            <h3 className="mb-3 font-display text-base font-semibold">Como funciona</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Threshold mark="75%" text="Do orçamento = alerta amarelo" tone="text-[#c9a227]" />
              <Threshold mark="90%" text="Do orçamento = alerta laranja" tone="text-[#f0b35a]" />
              <Threshold mark="100%" text="Do orçamento = alerta vermelho" tone="text-[#f08a7a]" />
              <Threshold mark=">110%" text="Acima do orçamento = alerta crítico" tone="text-[#f08a7a]" />
            </div>
          </div>
        </div>
      ) : (
        <NotificationList
          notifications={filteredNotifications}
          onMarkAsRead={markAsRead}
          onDismiss={markAsDismissed}
          onDelete={deleteNotification}
          loading={loading}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn(surface, "px-4 py-3")}>
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Threshold({ mark, text, tone }: { mark: string; text: string; tone: string }) {
  return (
    <div className={cn(surface, "px-4 py-3")}>
      <div className={cn("font-display text-lg font-semibold", tone)}>{mark}</div>
      <p className="mt-1 text-xs text-[#9ca9a1]">{text}</p>
    </div>
  );
}
