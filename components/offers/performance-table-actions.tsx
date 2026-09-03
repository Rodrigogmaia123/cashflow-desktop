"use client";

import { UpdateDailyPerformanceForm } from "@/app/app/offers/[offerId]/update-daily-performance-form";
import { DeleteDailyPerformanceButton } from "@/app/app/offers/[offerId]/delete-daily-performance-button";

type DailyPerformance = {
  id: string;
  date: string;
  investment: number;
  revenue: number;
  sales: number;
  checkoutPercentage: number;
  gatewayFeePerSale: number;
  taxPercentage: number;
  comment?: string | null;
  offerId: string;
  profit: number;
  roi: number;
  ticketAverage: number;
};

type PerformanceTableEditFormProps = {
  perf: DailyPerformance;
};

type PerformanceTableDeleteButtonProps = {
  perf: DailyPerformance;
};

export function PerformanceTableEditForm({ perf }: PerformanceTableEditFormProps) {
  return (
    <UpdateDailyPerformanceForm
      id={perf.id}
      offerId={perf.offerId}
      date={perf.date}
      investment={perf.investment}
      revenue={perf.revenue}
      sales={perf.sales}
      comment={perf.comment ?? null}
    />
  );
}

export function PerformanceTableDeleteButton({ perf }: PerformanceTableDeleteButtonProps) {
  return (
    <DeleteDailyPerformanceButton
      id={perf.id}
      offerId={perf.offerId}
    />
  );
}

