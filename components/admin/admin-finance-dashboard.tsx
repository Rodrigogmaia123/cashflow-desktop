"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAdminFinance,
  resendFinanceLicenseEmail,
  type AdminFinanceOrderRow,
  type AdminFinanceResult,
  type FinanceStatusFilter,
} from "@/app/app/admin/finance-actions";

const SPEND_KEY = "ops-finance-ad-spend";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

function parseSpendReais(raw: string) {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function statusLabel(status: string) {
  switch (status) {
    case "generated":
      return "Aberto";
    case "paid":
      return "Pago";
    case "failed":
      return "Falha";
    case "canceled":
      return "Cancelado";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "failed":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "canceled":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    default:
      return "bg-white/5 text-muted-foreground border-white/10";
  }
}

function licenseStatusLabel(status: string | null) {
  switch (status) {
    case "paid":
      return "Aguardando ativação";
    case "active":
      return "Ativada";
    case "revoked":
      return "Revogada";
    case "expired":
      return "Expirada";
    default:
      return "Sem licença";
  }
}

function isoDate(daysAgo: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

type PeriodPreset = "7d" | "30d" | "all";

export function AdminFinanceDashboard({
  initialData,
}: {
  initialData: AdminFinanceResult;
}) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState<FinanceStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PeriodPreset>("30d");
  const [from, setFrom] = useState(isoDate(29));
  const [to, setTo] = useState(isoDate(0));
  const [spendRaw, setSpendRaw] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSpendRaw(window.localStorage.getItem(SPEND_KEY) ?? "");
  }, []);

  const spendReais = parseSpendReais(spendRaw);
  const revenueReais = data.summary.revenueCents / 100;
  const paidCount = data.summary.paid;
  const roas = spendReais > 0 ? revenueReais / spendReais : null;
  const roiPct =
    spendReais > 0 ? ((revenueReais - spendReais) / spendReais) * 100 : null;
  const cpa = spendReais > 0 && paidCount > 0 ? spendReais / paidCount : null;

  const guidance = useMemo(() => {
    const { generated, paid, failed, canceled, open, conversionPct } =
      data.summary;
    if (generated === 0) {
      return "Ainda não há pedidos neste período. Assim que o tráfego gerar checkouts, o funil aparece aqui.";
    }
    if (roiPct != null && roiPct < 0) {
      return "O gasto em ads está maior que a receita paga. Ajuste criativo, público ou o preço antes de escalar.";
    }
    if (roiPct != null && roiPct >= 0 && paid > 0) {
      return "Há ROI positivo neste recorte: a receita dos pagos cobre o gasto informado. Confira se o CPA cabe na margem.";
    }
    if ((conversionPct ?? 0) < 5 && generated >= 10) {
      return "Muitos checkouts e poucos pagamentos. Vale olhar preço, página de planos e qualidade do tráfego.";
    }
    if (failed > paid && failed > 0) {
      return "Há mais falhas que pagamentos. Cartão recusado ou sessão incompleta — suporte pode orientar outro meio.";
    }
    if (canceled > paid && canceled > 0) {
      return "Muita gente abre o checkout e desiste. Teste oferta, prova social e o valor percebido do anúncio.";
    }
    if (open > 0 && paid === 0) {
      return "Há pedidos abertos aguardando pagamento. Ainda não dá para cravar ROI — acompanhe a conversão.";
    }
    return "Use o gasto em ads para calcular ROI. Os pagos abaixo são quem precisa de serial e suporte.";
  }, [data.summary, roiPct]);

  function rangeForPeriod(next: PeriodPreset) {
    if (next === "all") return { from: undefined, to: undefined };
    const days = next === "7d" ? 6 : 29;
    return { from: isoDate(days), to: isoDate(0) };
  }

  function refresh(next?: {
    status?: FinanceStatusFilter;
    query?: string;
    period?: PeriodPreset;
    from?: string;
    to?: string;
  }) {
    const nextStatus = next?.status ?? status;
    const nextQuery = next?.query ?? query;
    const nextPeriod = next?.period ?? period;
    const nextFrom = next?.from ?? from;
    const nextTo = next?.to ?? to;
    startTransition(async () => {
      const result = await getAdminFinance({
        status: nextStatus,
        query: nextQuery || undefined,
        from: nextPeriod === "all" ? undefined : nextFrom,
        to: nextPeriod === "all" ? undefined : nextTo,
      });
      if (result.success && result.data) {
        setData(result.data);
        setMessage(null);
      } else {
        setMessage(result.reason ?? "Não foi possível carregar o financeiro.");
      }
    });
  }

  function applyPeriod(next: PeriodPreset) {
    const range = rangeForPeriod(next);
    setPeriod(next);
    if (range.from) setFrom(range.from);
    if (range.to) setTo(range.to);
    refresh({ period: next, from: range.from, to: range.to });
  }

  function resend(licenseId: string) {
    setPendingId(licenseId);
    startTransition(async () => {
      const result = await resendFinanceLicenseEmail(licenseId);
      setPendingId(null);
      if (result.success) {
        setMessage("Serial reenviado para o e-mail do pedido.");
        refresh();
      } else {
        setMessage(result.reason ?? "Não foi possível reenviar o serial.");
      }
    });
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setMessage(`E-mail copiado: ${email}`);
    } catch {
      setMessage("Não foi possível copiar o e-mail.");
    }
  }

  const tabs: { id: FinanceStatusFilter; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: data.summary.generated },
    { id: "generated", label: "Abertos", count: data.summary.open },
    { id: "paid", label: "Pagos", count: data.summary.paid },
    { id: "failed", label: "Falhas", count: data.summary.failed },
    { id: "canceled", label: "Cancelados", count: data.summary.canceled },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as PeriodPreset[]).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={period === item ? "default" : "outline"}
              onClick={() => applyPeriod(item)}
              disabled={isPending}
            >
              {item === "7d" ? "7 dias" : item === "30d" ? "30 dias" : "Tudo"}
            </Button>
          ))}
        </div>
        {period !== "all" ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-auto"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-auto"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => refresh({ from, to })}
            >
              Filtrar
            </Button>
          </div>
        ) : null}
        <form
          className="flex flex-1 min-w-[220px] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            refresh({ query });
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar e-mail, campanha ou sessão…"
          />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            Buscar
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pedidos gerados"
          hint="Checkouts abertos neste período"
          value={String(data.summary.generated)}
        />
        <MetricCard
          title="Pagos"
          hint={
            data.summary.conversionPct == null
              ? "Ainda sem conversão"
              : `${data.summary.conversionPct.toFixed(1)}% do funil pagou`
          }
          value={String(data.summary.paid)}
        />
        <MetricCard
          title="Falhas + cancelados"
          hint={`${data.summary.failed} falhas · ${data.summary.canceled} cancelados · ${data.summary.open} abertos`}
          value={String(data.summary.failed + data.summary.canceled)}
        />
        <MetricCard
          title="Receita paga"
          hint="Só pedidos com pagamento confirmado"
          value={formatMoney(data.summary.revenueCents)}
        />
      </div>

      <Card className="border-white/10">
        <CardHeader>
          Tráfego pago e ROI
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,240px)_1fr]">
            <label className="space-y-1.5 text-sm">
              <span className="text-muted-foreground">
                Gasto em ads no período (R$)
              </span>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={spendRaw}
                onChange={(e) => {
                  const next = e.target.value;
                  setSpendRaw(next);
                  window.localStorage.setItem(SPEND_KEY, next);
                }}
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                label="ROAS"
                value={roas == null ? "—" : `${roas.toFixed(2)}x`}
              />
              <MiniStat
                label="ROI"
                value={
                  roiPct == null
                    ? "—"
                    : `${roiPct >= 0 ? "+" : ""}${roiPct.toFixed(0)}%`
                }
              />
              <MiniStat
                label="CPA"
                value={cpa == null ? "—" : formatMoney(Math.round(cpa * 100))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {guidance}
          </p>
        </CardContent>
      </Card>

      {message ? (
        <p className="text-sm text-amber-400">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={status === tab.id ? "default" : "outline"}
            disabled={isPending}
            onClick={() => {
              setStatus(tab.id);
              refresh({ status: tab.id });
            }}
          >
            {tab.label}
            <span className="ml-1.5 text-[11px] opacity-70">{tab.count}</span>
          </Button>
        ))}
      </div>

      <Card className="border-white/5 overflow-hidden">
        <CardHeader>
          Pedidos
        </CardHeader>
        <CardContent className="px-0 py-0">
          {data.orders.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">
              Nenhum pedido neste filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3 font-medium">Quando</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Oferta</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Licença / suporte</th>
                    <th className="px-6 py-3 font-medium">Tráfego</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      pending={pendingId === order.licenseId && isPending}
                      onCopyEmail={copyEmail}
                      onResend={resend}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  hint,
  value,
}: {
  title: string;
  hint: string;
  value: string;
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:border-white/10">
      <CardHeader className="space-y-1 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground/80">{hint}</p>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-card-secondary/40 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function OrderRow({
  order,
  pending,
  onCopyEmail,
  onResend,
}: {
  order: AdminFinanceOrderRow;
  pending: boolean;
  onCopyEmail: (email: string) => void;
  onResend: (licenseId: string) => void;
}) {
  const when =
    order.status === "paid"
      ? order.paidAt
      : order.status === "failed"
        ? order.failedAt
        : order.status === "canceled"
          ? order.canceledAt
          : order.createdAt;

  const traffic = [order.utmSource, order.utmMedium, order.utmCampaign]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
        {formatWhen(when)}
      </td>
      <td className="px-4 py-3">
        {order.email ? (
          <button
            type="button"
            className="text-left hover:text-primary"
            onClick={() => onCopyEmail(order.email!)}
          >
            {order.email}
          </button>
        ) : (
          <span className="text-muted-foreground">Sem e-mail ainda</span>
        )}
      </td>
      <td className="px-4 py-3">
        {order.editionLabel}
        <span className="block text-xs text-muted-foreground">
          {order.durationLabel}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {formatMoney(order.amountCents)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${statusClass(order.status)}`}
        >
          {statusLabel(order.status)}
        </span>
        {order.failureReason ? (
          <span className="block text-[11px] text-destructive/80 mt-1">
            {order.failureReason}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <p>{licenseStatusLabel(order.licenseStatus)}</p>
          {order.status === "paid" && order.licenseActivatedAt ? (
            <p className="text-[11px] text-muted-foreground">
              Ativou em {formatWhen(order.licenseActivatedAt)}
            </p>
          ) : null}
          {order.status === "paid" && !order.licenseActivatedAt && order.licenseId ? (
            <p className="text-[11px] text-muted-foreground">
              Pagou e ainda não ativou o serial
            </p>
          ) : null}
          {order.licenseId ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={pending}
                onClick={() => onResend(order.licenseId!)}
              >
                Reenviar serial
              </Button>
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-6 py-3 text-xs text-muted-foreground">
        {traffic || "—"}
      </td>
    </tr>
  );
}
