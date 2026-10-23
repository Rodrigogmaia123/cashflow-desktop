import Link from "next/link";
import { Button } from "@/components/ui/button";
import { surface } from "@/lib/ui/screen";
import { cn } from "@/lib/utils";

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
  personal = false
}: NextActionsProps) {
  const actions: Array<{ title: string; description: string; href: string; buttonLabel: string }> = [];

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

  return (
    <section className={cn(surface, "p-5")}>
      <h2 className="font-display text-base font-semibold">Próximas ações sugeridas</h2>
      <p className="mt-1 text-xs text-[#64706a]">Recomendações baseadas no estado atual</p>
      {actions.length === 0 ? (
        <p className="mt-4 text-sm text-[#9ca9a1]">
          Você já configurou os principais elementos do workspace. Continue monitorando os dashboards para insights.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {actions.map((action) => (
            <div key={action.title} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{action.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-[#9ca9a1]">{action.description}</p>
              </div>
              <Button asChild size="sm" variant="accent" className="shrink-0">
                <Link href={action.href}>{action.buttonLabel}</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
