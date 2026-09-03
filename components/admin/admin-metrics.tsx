import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, TrendingUp, Package, Sparkles } from "lucide-react";

interface AdminMetricsProps {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    usersByPlan: Record<string, number>;
    lifetimeUsers: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    mrr: number;
  };
}

export function AdminMetrics({ metrics }: AdminMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const metricsCards = [
    {
      title: "Total de Usuários",
      description: `${metrics.activeUsers} ativos (planos pagos ou lifetime)`,
      value: metrics.totalUsers,
      icon: Users,
      iconColor: "text-blue-400",
    },
    {
      title: "Receita Mensal (MRR)",
      description: `${metrics.activeSubscriptions} assinaturas ativas`,
      value: formatCurrency(metrics.mrr),
      icon: TrendingUp,
      iconColor: "text-green-400",
    },
    {
      title: "Distribuição por Plano",
      description: "FREE • PRO • BUSINESS",
      value: null,
      icon: Package,
      iconColor: "text-purple-400",
      breakdown: {
        FREE: metrics.usersByPlan.FREE || 0,
        PRO: metrics.usersByPlan.PRO || 0,
        BUSINESS: metrics.usersByPlan.BUSINESS || 0,
      },
    },
    {
      title: "Usuários Lifetime",
      description: "Acesso vitalício",
      value: metrics.lifetimeUsers,
      icon: Sparkles,
      iconColor: "text-yellow-400",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricsCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className="transition-all duration-200 hover:shadow-lg hover:border-white/10"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {card.description}
                </p>
              </div>
              <div className={`rounded-lg bg-muted/50 p-2 ${card.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {card.value !== null ? (
                <div className="text-3xl font-bold tracking-tight">
                  {card.value}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">FREE</span>
                    <span className="font-semibold">{card.breakdown?.FREE || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">PRO</span>
                    <span className="font-semibold text-primary">
                      {card.breakdown?.PRO || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">BUSINESS</span>
                    <span className="font-semibold text-purple-400">
                      {card.breakdown?.BUSINESS || 0}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

