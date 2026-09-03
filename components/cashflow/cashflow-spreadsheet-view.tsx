"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMoney as formatMoneyCurrency, type CurrencyCode } from "@/lib/domain/currency";

type CashflowDataPoint = {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  balance: number;
  breakdown: {
    adInvestment: number;
    fees: number;
    expenses: number;
    investments?: number;
  };
  offerBreakdown?: Array<{
    offerId: string;
    offerName: string;
    revenue: number;
    investment: number;
    fees: number;
  }>;
};

type Offer = {
  id: string;
  name: string;
};

type CashflowSpreadsheetViewProps = {
  data: CashflowDataPoint[];
  offers: Offer[];
  kpis: {
    totalRevenue: number;
    totalOutflow: number;
    netProfit: number;
    endingBalance: number;
    totalAdInvestment: number;
    totalFees: number;
    totalExpenses: number;
    totalInvestments?: number;
  };
  currency: CurrencyCode;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  hideOfferFilter?: boolean;
};

type GroupBy = "day" | "month";

export function CashflowSpreadsheetView({
  data,
  offers,
  kpis,
  currency,
  startDate,
  endDate,
  hideOfferFilter = false,
}: CashflowSpreadsheetViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedOfferId = searchParams.get("spreadsheetOffer") || "all";
  const groupBy = (searchParams.get("groupBy") as GroupBy) || "day";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "day") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Filtrar apenas dados dentro do período selecionado
  const dataInRange = data.filter((point) => {
    return point.date >= startDate && point.date <= endDate;
  });

  // Filtrar apenas dias com dados relevantes (igual à Sprint 1)
  const dataWithActivity = dataInRange.filter((point) => 
    point.inflow > 0 || point.outflow > 0
  );

  // Agrupar dados por mês se necessário
  const processedData = groupBy === "month" ? groupByMonth(dataWithActivity) : dataWithActivity;

  // Filtrar por oferta se necessário
  const filteredData = processedData; // TODO: implementar filtro por oferta quando tiver offerBreakdown

  const formatMoney = (value: number) => formatMoneyCurrency(value, currency);

  const formatDate = (dateStr: string) => {
    if (groupBy === "month") {
      const [year, month] = dateStr.split("-");
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
        "pt-BR",
        { year: "numeric", month: "long" }
      );
    }
    const [year, month, day] = dateStr.split("-");
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    ).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <Card className="overflow-hidden border-white/5 bg-card">
      {/* Cabeçalho com Filtros */}
      <div className="border-b border-white/5 bg-card-secondary/30 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Visualização em Planilha
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* Filtro de Agrupamento */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {groupBy === "day" ? "Por Dia" : "Por Mês"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                  <button
                    onClick={() => setFilter("groupBy", "day")}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      groupBy === "day"
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-white/5 text-foreground"
                    }`}
                  >
                    Por Dia
                  </button>
                  <button
                    onClick={() => setFilter("groupBy", "month")}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      groupBy === "month"
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-white/5 text-foreground"
                    }`}
                  >
                    Por Mês
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro de Oferta */}
            {offers.length > 0 && !hideOfferFilter && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    {selectedOfferId === "all"
                      ? "Todas as Ofertas"
                      : offers.find((o) => o.id === selectedOfferId)?.name ||
                        "Oferta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 max-h-80 overflow-y-auto" align="end">
                  <div className="space-y-1">
                    <button
                      onClick={() => setFilter("spreadsheetOffer", "all")}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedOfferId === "all"
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-white/5 text-foreground"
                      }`}
                    >
                      Todas as Ofertas
                    </button>
                    {offers.map((offer) => (
                      <button
                        key={offer.id}
                        onClick={() =>
                          setFilter("spreadsheetOffer", offer.id)
                        }
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          selectedOfferId === offer.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-white/5 text-foreground"
                        }`}
                      >
                        {offer.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Desktop: Tabela completa */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card-secondary/50 backdrop-blur-sm border-b border-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {groupBy === "day" ? "Data" : "Mês"}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Entrada
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Saída
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Saldo Diário
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Saldo Acumulado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Investimento Ads
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Fees
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Despesas
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Investimentos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.map((point, index) => (
                <tr
                  key={point.date}
                  className="transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {formatDate(point.date)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#7CFF6B] whitespace-nowrap">
                    {formatMoney(point.inflow)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#FF5C5C] whitespace-nowrap">
                    {formatMoney(point.outflow)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                      point.net >= 0 ? "text-[#4DFF88]" : "text-[#FF5C5C]"
                    }`}
                  >
                    {formatMoney(point.net)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#A855F7] whitespace-nowrap">
                    {formatMoney(point.balance)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {formatMoney(point.breakdown.adInvestment)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {formatMoney(point.breakdown.fees)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                    {formatMoney(point.breakdown.expenses)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#3B82F6] whitespace-nowrap">
                    {formatMoney(point.breakdown.investments ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-primary/30 bg-card-secondary/50 backdrop-blur-sm">
              <tr className="font-bold">
                <td className="px-4 py-4 text-xs text-foreground uppercase tracking-wider">
                  TOTAL
                </td>
                <td className="px-4 py-4 text-right text-[#7CFF6B] whitespace-nowrap">
                  {formatMoney(kpis.totalRevenue)}
                </td>
                <td className="px-4 py-4 text-right text-[#FF5C5C] whitespace-nowrap">
                  {formatMoney(kpis.totalOutflow)}
                </td>
                <td
                  className={`px-4 py-4 text-right whitespace-nowrap ${
                    kpis.netProfit >= 0 ? "text-[#4DFF88]" : "text-[#FF5C5C]"
                  }`}
                >
                  {formatMoney(kpis.netProfit)}
                </td>
                <td className="px-4 py-4 text-right text-[#A855F7] whitespace-nowrap">
                  {formatMoney(kpis.endingBalance)}
                </td>
                <td className="px-4 py-4 text-right text-muted-foreground whitespace-nowrap">
                  {formatMoney(kpis.totalAdInvestment)}
                </td>
                <td className="px-4 py-4 text-right text-muted-foreground whitespace-nowrap">
                  {formatMoney(kpis.totalFees)}
                </td>
                <td className="px-4 py-4 text-right text-muted-foreground whitespace-nowrap">
                  {formatMoney(kpis.totalExpenses)}
                </td>
                <td className="px-4 py-4 text-right font-semibold text-[#3B82F6] whitespace-nowrap">
                  {formatMoney(kpis.totalInvestments ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile: Cards compactos */}
        <div className="md:hidden divide-y divide-white/5">
          {filteredData.map((point) => (
            <div key={point.date} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDate(point.date)}
                </span>
                <span
                  className={`text-sm font-bold ${
                    point.net >= 0 ? "text-[#4DFF88]" : "text-[#FF5C5C]"
                  }`}
                >
                  {formatMoney(point.net)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Entrada</div>
                  <div className="font-semibold text-[#7CFF6B]">
                    {formatMoney(point.inflow)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Saída</div>
                  <div className="font-semibold text-[#FF5C5C]">
                    {formatMoney(point.outflow)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Saldo Acum.</div>
                  <div className="font-semibold text-[#A855F7]">
                    {formatMoney(point.balance)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Investimento</div>
                  <div className="font-medium text-foreground">
                    {formatMoney(point.breakdown.adInvestment)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Investimentos</div>
                  <div className="font-medium text-[#3B82F6]">
                    {formatMoney(point.breakdown.investments ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Função auxiliar para agrupar por mês
function groupByMonth(data: CashflowDataPoint[]): CashflowDataPoint[] {
  const monthlyData = new Map<string, CashflowDataPoint>();

  for (const point of data) {
    const monthKey = point.date.substring(0, 7); // YYYY-MM

    if (monthlyData.has(monthKey)) {
      const existing = monthlyData.get(monthKey)!;
      existing.inflow += point.inflow;
      existing.outflow += point.outflow;
      existing.net += point.net;
      existing.balance = point.balance;
      existing.breakdown.adInvestment += point.breakdown.adInvestment;
      existing.breakdown.fees += point.breakdown.fees;
      existing.breakdown.expenses += point.breakdown.expenses;
      existing.breakdown.investments = (existing.breakdown.investments ?? 0) + (point.breakdown.investments ?? 0);
    } else {
      monthlyData.set(monthKey, {
        date: monthKey,
        inflow: point.inflow,
        outflow: point.outflow,
        net: point.net,
        balance: point.balance,
        breakdown: {
          adInvestment: point.breakdown.adInvestment,
          fees: point.breakdown.fees,
          expenses: point.breakdown.expenses,
          investments: point.breakdown.investments ?? 0,
        },
      });
    }
  }

  return Array.from(monthlyData.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
