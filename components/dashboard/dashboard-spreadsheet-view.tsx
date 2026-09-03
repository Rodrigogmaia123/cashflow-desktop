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

type DashboardDataPoint = {
  date: string;
  investment: number;
  revenue: number;
  sales: number;
  fee: number;
  profit: number;
  roi: number;
};

type Offer = {
  id: string;
  name: string;
};

type DashboardSpreadsheetViewProps = {
  data: DashboardDataPoint[];
  offers: Offer[];
  kpis: {
    investmentTotal: number;
    revenueTotal: number;
    salesTotal: number;
    feeTotal: number;
    profitTotal: number;
    roiWeighted: number;
  };
  currency: CurrencyCode;
  startDate: string;
  endDate: string;
};

type GroupBy = "day" | "month";

export function DashboardSpreadsheetView({
  data,
  offers,
  kpis,
  currency,
  startDate,
  endDate,
}: DashboardSpreadsheetViewProps) {
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

  // Filtrar apenas dias com dados relevantes
  const dataWithActivity = dataInRange.filter((point) => 
    point.investment > 0 || point.revenue > 0 || point.sales > 0
  );

  // Agrupar dados por mês se necessário
  const processedData = groupBy === "month" ? groupByMonth(dataWithActivity) : dataWithActivity;

  // Dados já vêm filtrados do backend quando uma oferta é selecionada
  const filteredData = processedData;

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
            {offers.length > 0 && (
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
                  Investimento
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Faturamento
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Vendas
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Fee
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Lucro
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  ROI (%)
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
                  <td className="px-4 py-3 text-right font-semibold text-[#FF5C5C] whitespace-nowrap">
                    {formatMoney(point.investment)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#7CFF6B] whitespace-nowrap">
                    {formatMoney(point.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">
                    {point.sales}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                    {formatMoney(point.fee)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                      point.profit >= 0 ? "text-[#4DFF88]" : "text-[#FF5C5C]"
                    }`}
                  >
                    {formatMoney(point.profit)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                      point.roi >= 1 ? "text-[#4DFF88]" : "text-[#FF9500]"
                    }`}>
                    {(point.roi * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-primary/30 bg-card-secondary/50 backdrop-blur-sm">
              <tr className="font-bold">
                <td className="px-4 py-4 text-xs text-foreground uppercase tracking-wider">
                  TOTAL
                </td>
                <td className="px-4 py-4 text-right text-[#FF5C5C] whitespace-nowrap">
                  {formatMoney(kpis.investmentTotal)}
                </td>
                <td className="px-4 py-4 text-right text-[#7CFF6B] whitespace-nowrap">
                  {formatMoney(kpis.revenueTotal)}
                </td>
                <td className="px-4 py-4 text-right text-foreground whitespace-nowrap">
                  {kpis.salesTotal}
                </td>
                <td className="px-4 py-4 text-right text-muted-foreground whitespace-nowrap">
                  {formatMoney(kpis.feeTotal)}
                </td>
                <td
                  className={`px-4 py-4 text-right whitespace-nowrap ${
                    kpis.profitTotal >= 0 ? "text-[#4DFF88]" : "text-[#FF5C5C]"
                  }`}
                >
                  {formatMoney(kpis.profitTotal)}
                </td>
                <td className={`px-4 py-4 text-right whitespace-nowrap ${
                    kpis.roiWeighted >= 1 ? "text-[#4DFF88]" : "text-[#FF9500]"
                  }`}>
                  {(kpis.roiWeighted * 100).toFixed(2)}%
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
                    point.profit >= 0 ? "text-[#4DFF88]" : "text-[#FF5C5C]"
                  }`}
                >
                  {formatMoney(point.profit)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Investimento</div>
                  <div className="font-semibold text-[#FF5C5C]">
                    {formatMoney(point.investment)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Faturamento</div>
                  <div className="font-semibold text-[#7CFF6B]">
                    {formatMoney(point.revenue)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Vendas</div>
                  <div className="font-medium text-foreground">
                    {point.sales}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">ROI</div>
                  <div className={`font-bold ${
                    point.roi >= 1 ? "text-[#4DFF88]" : "text-[#FF9500]"
                  }`}>
                    {(point.roi * 100).toFixed(2)}%
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
function groupByMonth(data: DashboardDataPoint[]): DashboardDataPoint[] {
  const monthlyData = new Map<string, DashboardDataPoint>();

  for (const point of data) {
    const monthKey = point.date.substring(0, 7); // YYYY-MM

    if (monthlyData.has(monthKey)) {
      const existing = monthlyData.get(monthKey)!;
      existing.investment += point.investment;
      existing.revenue += point.revenue;
      existing.sales += point.sales;
      existing.fee += point.fee;
      existing.profit += point.profit;
      // ROI será recalculado baseado nos totais
      existing.roi = existing.investment > 0 ? existing.revenue / existing.investment : 0;
    } else {
      monthlyData.set(monthKey, {
        date: monthKey,
        investment: point.investment,
        revenue: point.revenue,
        sales: point.sales,
        fee: point.fee,
        profit: point.profit,
        roi: point.roi,
      });
    }
  }

  return Array.from(monthlyData.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
