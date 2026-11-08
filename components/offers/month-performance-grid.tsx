"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { saveDailyPerformanceBatch } from "@/app/app/offers/[offerId]/actions";
import { Button } from "@/components/ui/button";
import { parseDecimalToken } from "@/lib/domain/parse-statement";
import { todayUtcKey } from "@/lib/utils/date-utc";

type Entry = {
  date: string;
  investment: number;
  revenue: number;
  sales: number;
};

type Cell = {
  investment: string;
  revenue: string;
  sales: string;
};

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro"
];

const inputClass =
  "h-8 w-full rounded-md border border-white/10 bg-[#0d1612] px-2 text-sm text-[#f3f7f4] outline-none focus:border-[#ac93ff]";

function monthDays(year: number, month: number): string[] {
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthKey = String(month).padStart(2, "0");
  return Array.from({ length: count }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${monthKey}-${day}`;
  });
}

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

function formatAmount(value: number, field: keyof Cell) {
  if (field === "sales") return String(value);
  return value.toFixed(2).replace(".", ",");
}

function cellFromEntry(entry: Entry | undefined): Cell {
  if (!entry) return { investment: "", revenue: "", sales: "" };
  return {
    investment: formatAmount(entry.investment, "investment"),
    revenue: formatAmount(entry.revenue, "revenue"),
    sales: formatAmount(entry.sales, "sales")
  };
}

function sameNumber(left: string, right: string) {
  const a = parseDecimalToken(left);
  const b = parseDecimalToken(right);
  if (a === "invalid" || b === "invalid") return left.trim() === right.trim();
  if (a === "empty" || b === "empty") return a === b;
  return a === b;
}

function isBlank(cell: Cell) {
  return (
    parseDecimalToken(cell.investment) === "empty" &&
    parseDecimalToken(cell.revenue) === "empty" &&
    parseDecimalToken(cell.sales) === "empty"
  );
}

function weekday(date: string) {
  return WEEKDAYS[new Date(`${date}T00:00:00.000Z`).getUTCDay()] ?? "";
}

export function MonthPerformanceGrid({
  offerId,
  currency,
  entries
}: {
  offerId: string;
  currency: string;
  entries: Entry[];
}) {
  const router = useRouter();
  const today = todayUtcKey();
  const [cursor, setCursor] = useState(() => {
    const [year, month] = today.split("-");
    return { year: Number(year), month: Number(month) };
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const days = useMemo(() => monthDays(cursor.year, cursor.month), [cursor.year, cursor.month]);
  const entriesKey = entries
    .map((entry) => `${entry.date}:${entry.investment}:${entry.revenue}:${entry.sales}`)
    .join("|");
  const initial = useMemo(() => {
    const map = new Map(entries.map((entry) => [entry.date, entry]));
    const cells: Record<string, Cell> = {};
    for (const day of days) cells[day] = cellFromEntry(map.get(day));
    return cells;
  }, [days, entries]);

  const syncKey = `${cursor.year}-${cursor.month}:${entriesKey}`;
  const [seenKey, setSeenKey] = useState(syncKey);
  const [cells, setCells] = useState<Record<string, Cell>>(initial);
  if (seenKey !== syncKey) {
    setSeenKey(syncKey);
    setCells(initial);
  }

  const dirtyDays = days.filter((day) => {
    const current = cells[day];
    const start = initial[day];
    if (!current || !start || isBlank(current)) return false;
    return (
      !sameNumber(current.investment, start.investment) ||
      !sameNumber(current.revenue, start.revenue) ||
      !sameNumber(current.sales, start.sales)
    );
  });

  const alreadyFilled = days.filter((day) => initial[day] && !isBlank(initial[day])).length;

  function updateCell(day: string, field: keyof Cell, value: string) {
    setCells((current) => ({
      ...current,
      [day]: { ...current[day], [field]: value }
    }));
  }

  function commitCell(day: string, field: keyof Cell) {
    setCells((current) => {
      const cell = current[day];
      if (!cell) return current;
      const parsed = parseDecimalToken(cell[field]);
      if (parsed === "invalid" || parsed === "empty") return current;
      const next = formatAmount(field === "sales" ? Math.round(parsed) : parsed, field);
      return { ...current, [day]: { ...cell, [field]: next } };
    });
  }

  function save() {
    setError(null);
    const formData = new FormData();
    formData.set("offerId", offerId);

    for (const day of dirtyDays) {
      const cell = cells[day];
      const investment = parseDecimalToken(cell.investment);
      const revenue = parseDecimalToken(cell.revenue);
      const sales = parseDecimalToken(cell.sales);
      if (investment === "invalid" || revenue === "invalid" || sales === "invalid") {
        setError(`Número inválido em ${day.slice(8)}/${day.slice(5, 7)}.`);
        return;
      }
      const salesValue = sales === "empty" ? 0 : Math.round(sales);
      formData.append("date", day);
      formData.append("investment", String(investment === "empty" ? 0 : investment));
      formData.append("revenue", String(revenue === "empty" ? 0 : revenue));
      formData.append("sales", String(salesValue));
    }

    startTransition(async () => {
      try {
        await saveDailyPerformanceBatch(formData);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao salvar a grade.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-[22px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Grade do mês</h2>
          <p className="mt-0.5 text-xs text-[#64706a]">
            Preencha investimento, faturamento e vendas. Tab passa de um campo ao outro. Linha vazia fica de fora.
            {alreadyFilled > 0 ? ` ${alreadyFilled} dia${alreadyFilled === 1 ? "" : "s"} deste mês já lançado${alreadyFilled === 1 ? "" : "s"}.` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 px-0"
            onClick={() => setCursor((current) => shiftMonth(current.year, current.month, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[9.5rem] text-center text-sm capitalize text-foreground">
            {MONTHS[cursor.month - 1]} {cursor.year}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 px-0"
            onClick={() => setCursor((current) => shiftMonth(current.year, current.month, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 max-h-[32rem] overflow-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-card text-[11px] text-[#9ca9a1]">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Dia</th>
              <th className="px-2 py-2 text-left font-medium">Investimento ({currency})</th>
              <th className="px-2 py-2 text-left font-medium">Faturamento ({currency})</th>
              <th className="px-2 py-2 text-left font-medium">Vendas</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const cell = cells[day] ?? { investment: "", revenue: "", sales: "" };
              const isToday = day === today;
              return (
                <tr key={day} className={isToday ? "bg-white/5" : undefined}>
                  <td className="whitespace-nowrap border-t border-white/5 px-3 py-1.5 text-xs text-[#9ca9a1]">
                    {day.slice(8)}/{day.slice(5, 7)} {weekday(day)}
                  </td>
                  {(["investment", "revenue", "sales"] as const).map((field) => (
                    <td key={field} className="border-t border-white/5 px-2 py-1">
                      <input
                        value={cell[field]}
                        inputMode="decimal"
                        onChange={(event) => updateCell(day, field, event.target.value)}
                        onBlur={() => commitCell(day, field)}
                        className={inputClass}
                        aria-label={`${field} ${day}`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

      <div className="mt-4 flex items-center justify-end">
        <Button type="button" size="sm" onClick={save} disabled={pending || dirtyDays.length === 0}>
          {pending
            ? "Salvando..."
            : dirtyDays.length === 0
              ? "Nada novo para salvar"
              : `Salvar ${dirtyDays.length} dia${dirtyDays.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </section>
  );
}
