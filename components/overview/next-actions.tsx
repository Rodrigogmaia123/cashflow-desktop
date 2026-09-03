import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type NextActionsProps = {
  hasOffers: boolean;
  hasExpenses: boolean;
  hasManualIncomes: boolean;
  hasFeeConfig: boolean;
  workspaceId: string;
  personal?: boolean;
};

export function NextActions({
  hasOffers,
  hasExpenses,
  hasManualIncomes,
  hasFeeConfig,
  workspaceId,
  personal = false,
}: NextActionsProps) {
  const actions: Array<{
    title: string;
    description: string;
    href: string;
    buttonLabel: string;
  }> = [];

  if (!personal && !hasOffers) {
    actions.push({
      title: "Crie sua primeira oferta",
      description: "Comece registrando suas ofertas para acompanhar o desempenho financeiro",
      href: "/app/offers?new=1",
      buttonLabel: "Criar oferta"
    });
  }

  if (!hasExpenses) {
    actions.push({
      title: "Cadastre despesas fixas",
      description: "Registre despesas para ter uma visão completa do fluxo de caixa",
      href: "/app/cashflow",
      buttonLabel: "Adicionar despesa"
    });
  }

  if (!hasManualIncomes && (personal || hasOffers)) {
    actions.push({
      title: personal ? "Adicionar entrada" : "Adicionar entrada manual",
      description: personal
        ? "Registre salários, freelance ou qualquer dinheiro que entrou."
        : "Registre receitas que não vêm de ofertas para um controle completo",
      href: "/app/cashflow",
      buttonLabel: "Adicionar receita"
    });
  }

  if (!personal && !hasFeeConfig) {
    actions.push({
      title: "Configurar taxas do workspace",
      description: "Configure as taxas padrão do workspace para cálculos automáticos",
      href: "/app/settings/fees",
      buttonLabel: "Configurar taxas"
    });
  }

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold">Próximas Ações</h3>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Você já configurou os principais elementos do workspace. Continue monitorando os dashboards para insights.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold">Próximas Ações Sugeridas</h3>
        <p className="mt-1 text-xs text-muted-foreground">Recomendações baseadas no estado atual</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-card-secondary/50 p-4 transition-colors hover:border-white/10 hover:bg-card-secondary">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{action.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.description}</div>
              </div>
              <Link href={action.href}>
                <Button size="sm" variant="outline" className="flex-shrink-0">
                  {action.buttonLabel}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
