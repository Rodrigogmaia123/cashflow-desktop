import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { hasFeature } from "@/lib/plans/features";
import { analyzeOfferPeriod } from "../actions";
import { Button } from "@/components/ui/button";
import { FeatureLock } from "@/components/plans/feature-lock";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

type OfferAnalysisPageProps = {
  params: Promise<{
    offerId: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function OfferAnalysisPage({
  params
}: OfferAnalysisPageProps) {
  const workspaceId = await requireActiveWorkspaceId();
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const offer = await prisma.offer.findFirst({
    where: {
      id: resolvedParams.offerId,
      workspaceId
    }
  });

  if (!offer) {
    notFound();
  }

  const hasAdvancedReports = hasFeature(user.plan, "advanced_reports");

  const periods = await prisma.periodPerformance.findMany({
    where: {
      offerId: offer.id,
      offer: {
        workspaceId
      }
    },
    orderBy: {
      startDate: "desc"
    },
    take: 10
  });

  const currency = offer.currency as CurrencyCode;
  const money = (value: number) => formatMoney(value, currency);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Análise por período - {offer.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Gera um snapshot financeiro agregado de {offer.name} para um intervalo
          de datas, com base nos lançamentos diários existentes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.3fr,1.2fr]">
        {hasAdvancedReports ? (
          <div className="space-y-3 rounded-md border bg-card p-4">
            <h2 className="text-sm font-semibold">Analisar período</h2>
            <p className="text-xs text-muted-foreground">
              Escolha um intervalo de datas. O servidor irá somar investimento,
              faturamento e vendas dos lançamentos diários e calcular Fee, ROI e
              lucro usando as regras financeiras centralizadas.
            </p>
            <form
              action={analyzeOfferPeriod}
              className="mt-3 grid gap-3 text-xs sm:text-sm md:grid-cols-2"
            >
              <input type="hidden" name="offerId" value={offer.id} />

              <div className="space-y-1">
                <label
                  htmlFor="startDate"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Data início
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="endDate"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Data fim
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" size="sm" className="w-full">
                  Analisar período
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <FeatureLock
            feature="advanced_reports"
            requiredPlan="PRO"
            title="Análise de Período"
            description="Escolha um intervalo de datas. O servidor irá somar investimento, faturamento e vendas dos lançamentos diários e calcular Fee, ROI e lucro usando as regras financeiras centralizadas. Disponível no plano PRO."
            workspaceId={workspaceId}
          />
        )}

        <div className="space-y-3 rounded-md border bg-card p-4 text-xs sm:text-sm">
          <h2 className="text-sm font-semibold">Snapshots de período</h2>
          <div className="mt-3 space-y-2">
            {periods.map((p) => {
              // Converter Decimal para números antes de usar no JSX
              const investment = p.investment.toNumber();
              const revenue = p.revenue.toNumber();
              const fee = p.fee.toNumber();
              const profit = p.profit.toNumber();
              const roi = p.roi.toNumber();

              return (
                <div
                  key={p.id}
                  className="rounded-md border px-3 py-2 text-[11px] sm:text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {p.startDate.toISOString().split("T")[0]} →{" "}
                      {p.endDate.toISOString().split("T")[0]}
                    </span>
                    <span className="text-muted-foreground">
                      ROI:{" "}
                      <span className="font-medium">
                        {(roi * 100).toFixed(2)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <span className="text-muted-foreground">
                      Investimento total:{" "}
                      <span className="font-medium">
                        {money(investment)}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Faturamento total:{" "}
                      <span className="font-medium">
                        {money(revenue)}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Vendas totais:{" "}
                      <span className="font-medium">{p.sales}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Fee total:{" "}
                      <span className="font-medium">{money(fee)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Lucro:{" "}
                      <span className="font-medium">
                        {money(profit)}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}

            {periods.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                Nenhuma análise de período ainda para esta oferta.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


