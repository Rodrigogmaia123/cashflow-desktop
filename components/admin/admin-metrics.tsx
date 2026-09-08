import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KeyRound, TrendingUp, Package, CalendarClock } from "lucide-react";
import type { AdminMetricsData } from "@/app/app/admin/actions";

interface AdminMetricsProps {
  metrics: AdminMetricsData;
}

export function AdminMetrics({ metrics }: AdminMetricsProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all duration-200 hover:shadow-lg hover:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total de chaves
            </p>
            <p className="text-xs text-muted-foreground/80">
              {metrics.activeLicenses} ativas · {metrics.paidLicenses}{" "}
              aguardando ativação
              {metrics.revokedLicenses > 0
                ? ` · ${metrics.revokedLicenses} revogadas`
                : ""}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-blue-400">
            <KeyRound className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {metrics.totalLicenses}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-lg hover:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Receita da loja
            </p>
            <p className="text-xs text-muted-foreground/80">
              {metrics.paidOrders} pedido
              {metrics.paidOrders === 1 ? "" : "s"} pago
              {metrics.paidOrders === 1 ? "" : "s"} (não inclui chave criada no
              admin)
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-green-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(metrics.revenueCents)}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-lg hover:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Edição
            </p>
            <p className="text-xs text-muted-foreground/80">
              Cashflow Pro · Cashflow Pessoal
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-purple-400">
            <Package className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pro</span>
              <span className="font-semibold text-primary">
                {metrics.licensesByEdition.pro}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pessoal</span>
              <span className="font-semibold text-purple-400">
                {metrics.licensesByEdition.pessoal}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-lg hover:border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Prazo</p>
            <p className="text-xs text-muted-foreground/80">
              Validade da chave (a partir da ativação)
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 text-yellow-400">
            <CalendarClock className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.licensesByDuration.map((item) => (
              <div
                key={item.duration}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
