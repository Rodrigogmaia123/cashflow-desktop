"use client";

import Link from "next/link";
import { formatCurrency, formatPercentage, getCategoryStatus } from "@/types/report";
import type { PeriodReport, CategoryBudgetReport } from "@/types/report";
import { cn } from "@/lib/utils";
import { surface } from "@/lib/ui/screen";
import { TrendingDown, TrendingUp } from "lucide-react";

interface PeriodReportViewProps {
  report: PeriodReport;
}

export function PeriodReportView({ report }: PeriodReportViewProps) {
  const isPositive = report.netDifference >= 0;
  const performanceRate =
    report.categoriesWithBudget > 0
      ? (report.categoriesOK / report.categoriesWithBudget) * 100
      : 0;

  return (
    <div className="space-y-4">
      <section className={cn(surface, "p-5")}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Relatório de fechamento</h2>
            <p className="text-xs text-[#64706a]">
              {new Date(report.startDate).toLocaleDateString("pt-BR")} – {new Date(report.endDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-medium",
            isPositive ? "bg-[rgba(143,211,122,0.12)] text-[#8fd37a]" : "bg-[rgba(240,138,122,0.12)] text-[#f08a7a]"
          )}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? "+" : ""}
            {formatCurrency(report.netDifference)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <StatCard label="Orçado total" value={formatCurrency(report.totalBudgeted)} tone="neutral" />
          <StatCard label="Gasto total" value={formatCurrency(report.totalSpent)} tone="neutral" />
          <StatCard label="Economizado" value={formatCurrency(report.totalSaved)} tone="good" />
          <StatCard label="Estourado" value={formatCurrency(report.totalExceeded)} tone="bad" />
        </div>
      </section>

      <section className={cn(surface, "p-5")}>
        <h3 className="mb-4 font-display text-base font-semibold">Performance geral</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric n={report.categoriesWithBudget} label="Com orçamento" />
          <Metric n={report.categoriesOK} label="OK" />
          <Metric n={report.categoriesExceeded} label="Estouraram" />
          <Metric n={report.categoriesWithoutBudget} label="Sem orçamento" />
        </div>
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#9ca9a1]">Taxa de sucesso</span>
            <span className="font-mono font-medium">{formatPercentage(performanceRate)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className={cn("h-1.5 rounded-full", performanceRate >= 80 ? "bg-[#8fd37a]" : performanceRate >= 50 ? "bg-[#c9a227]" : "bg-[#f08a7a]")}
              style={{ width: `${performanceRate}%` }}
            />
          </div>
        </div>
      </section>

      {report.recommendations.length > 0 && (
        <section className="rounded-2xl border border-[rgba(172,147,255,0.28)] bg-[rgba(172,147,255,0.08)] p-5">
          <h3 className="mb-3 font-display text-base font-semibold text-[#c9c0e8]">Recomendações</h3>
          <ul className="space-y-2 text-sm text-[#c9c0e8]">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-2">
                <span>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-3">
        <h3 className="font-display text-base font-semibold">Detalhes por categoria</h3>
        {report.categories.map((category) => (
          <CategoryReportCard key={category.categoryId} category={category} />
        ))}
      </div>
    </div>
  );
}

function Metric({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-semibold">{n}</div>
      <div className="text-xs text-[#64706a]">{label}</div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface StatCardProps {
  label: string;
  value: string;
  tone: "neutral" | "good" | "bad";
}

function StatCard({ label, value, tone }: StatCardProps) {
  const valueClass = tone === "good" ? "text-[#8fd37a]" : tone === "bad" ? "text-[#f08a7a]" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[#64706a]">{label}</div>
      <div className={cn("mt-1 font-display text-xl font-semibold", valueClass)}>{value}</div>
    </div>
  );
}

interface CategoryReportCardProps {
  category: CategoryBudgetReport;
}

function CategoryReportCard({ category }: CategoryReportCardProps) {
  const status = getCategoryStatus(category);

  const dot = {
    green: "bg-[#8fd37a]",
    red: "bg-[#f08a7a]",
    orange: "bg-[#f0b35a]",
    blue: "bg-[#6aa7ff]",
    gray: "bg-[#9ca9a1]"
  }[status.color as "green" | "red" | "orange" | "blue" | "gray"] ?? "bg-[#9ca9a1]";

  return (
    <div className={cn(surface, "p-4")}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
          <div>
            <h4 className="font-medium">{category.categoryName}</h4>
            {category.budgetName && <p className="text-xs text-[#64706a]">{category.budgetName}</p>}
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[#9ca9a1]">
          {status.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64706a]">Orçado</div>
          <div className="font-medium">{formatCurrency(category.budgetedAmount)}</div>
          {category.budgetedAmount <= 0 && (
            <Link href="/app/budgets" className="mt-1 inline-block text-[11px] text-[#9ca9a1] underline-offset-2 hover:underline">
              Definir orçamento
            </Link>
          )}
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64706a]">Gasto</div>
          <div className="font-medium">{formatCurrency(category.actualSpent)}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64706a]">Diferença</div>
          <div className={cn("font-medium", category.difference >= 0 ? "text-[#8fd37a]" : "text-[#f08a7a]")}>
            {category.difference >= 0 ? "+" : ""}
            {formatCurrency(category.difference)}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#64706a]">% Usado</div>
          <div className="font-medium">{category.budgetedAmount > 0 ? formatPercentage(category.percentUsed) : "N/A"}</div>
        </div>
      </div>
    </div>
  );
}
