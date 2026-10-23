import Link from "next/link";

type PeriodEquationProps = {
  revenue: string;
  investment: string;
  fees: string;
  profit: string;
  roi: string;
  sales: number;
  profitDeltaPct: number | null;
  roiDeltaPct: number | null;
  topOffer?: { name: string; revenue: string; sharePct: number } | null;
  offersHref: string;
};

function DeltaPill({ value }: { value: number | null }) {
  if (value == null || Number.isNaN(value)) return null;
  const down = value < 0;
  const label = `${down ? "↓" : "↑"} ${Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return (
    <span
      className={
        down
          ? "mt-1.5 inline-block rounded-full bg-[rgba(240,138,122,0.12)] px-2 py-0.5 font-mono text-[11px] font-medium text-[#f08a7a]"
          : "mt-1.5 inline-block rounded-full bg-[rgba(143,211,122,0.12)] px-2 py-0.5 font-mono text-[11px] font-medium text-[#8fd37a]"
      }
    >
      {label} vs período anterior
    </span>
  );
}

export function PeriodEquation({
  revenue,
  investment,
  fees,
  profit,
  roi,
  sales,
  profitDeltaPct,
  roiDeltaPct,
  topOffer,
  offersHref,
}: PeriodEquationProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-5 md:p-[22px]">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
          A conta do período · Faturamento − Investimento − Taxas
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <Term label="Faturamento" value={revenue} hint="Receita total das vendas" />
          <Op>−</Op>
          <Term label="Investimento" value={investment} hint="Tráfego/mídia, sem taxas" />
          <Op>−</Op>
          <Term label="Taxas" value={fees} hint="Checkout + gateway + impostos" />
          <Op>=</Op>
          <div className="flex-1 rounded-[14px] border border-accent/30 bg-accent/10 px-4 py-3 shadow-[0_0_60px_-22px_rgba(199,241,86,0.55)] lg:flex-[1.25]">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-accent">
              O que sobrou
            </div>
            <div className="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight text-accent md:text-4xl">
              {profit}
            </div>
            <DeltaPill value={profitDeltaPct} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3.5 border-t border-white/10 pt-4">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            ROI real (ponderado)
          </span>
          <b className="font-display text-xl font-semibold">{roi}</b>
          {roiDeltaPct != null && (
            <span className={roiDeltaPct < 0 ? "font-mono text-[11px] text-[#f08a7a]" : "font-mono text-[11px] text-[#8fd37a]"}>
              {roiDeltaPct < 0 ? "↓" : "↑"} {Math.abs(roiDeltaPct).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </span>
          )}
          <span className="text-xs text-muted">
            Faturamento ÷ (Investimento + Taxas) · {sales.toLocaleString("pt-BR")} vendas no período
          </span>
        </div>
      </section>

      {topOffer && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-[13px] text-[#c9c0e8]">
          <span>
            <b className="font-medium text-foreground">Melhor oferta do período</b> “{topOffer.name}” gerou {topOffer.revenue} ({topOffer.sharePct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total).
          </span>
          <Link href={offersHref} className="ml-auto font-medium text-primary no-underline">
            Ver ofertas →
          </Link>
        </div>
      )}
    </div>
  );
}

function Term({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex-1 border-white/10 lg:border-l lg:px-4 lg:first:border-0 lg:first:pl-0">
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{label}</div>
      <div className="mt-1.5 whitespace-nowrap font-display text-2xl font-semibold leading-tight tracking-tight md:text-[30px]">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </div>
  );
}

function Op({ children }: { children: string }) {
  return (
    <div className="hidden self-center font-mono text-[22px] font-medium text-muted lg:block">{children}</div>
  );
}
