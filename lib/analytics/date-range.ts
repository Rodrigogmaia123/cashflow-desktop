export type DashboardRange =
  | { type: "relative"; value: "today" | "7d" | "30d" | "3m" | "6m" | "12m" }
  | { type: "absolute"; startDate: Date; endDate: Date };

export type DashboardRelativeRangeValue = DashboardRange extends {
  type: "relative";
  value: infer V;
}
  ? V
  : never;

import { startOfDay, endOfDay, addDaysUTC, addMonthsUTC } from "./date-range-utils";

export function resolveDateRange(range: DashboardRange): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();

  if (range.type === "absolute") {
    const start = startOfDay(range.startDate);
    const end = endOfDay(range.endDate);
    if (start > end) {
      // UX: se o usuário inverter as datas, corrigimos no servidor.
      return { startDate: startOfDay(range.endDate), endDate: endOfDay(range.startDate) };
    }
    return { startDate: start, endDate: end };
  }

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (range.value === "today") {
    return { startDate: todayStart, endDate: todayEnd };
  }

  if (range.value === "7d") {
    return { startDate: addDaysUTC(todayStart, -6), endDate: todayEnd };
  }
  if (range.value === "30d") {
    return { startDate: addDaysUTC(todayStart, -29), endDate: todayEnd };
  }
  if (range.value === "3m") {
    return { startDate: addMonthsUTC(todayStart, -3), endDate: todayEnd };
  }
  if (range.value === "6m") {
    return { startDate: addMonthsUTC(todayStart, -6), endDate: todayEnd };
  }
  // 12m
  return { startDate: addMonthsUTC(todayStart, -12), endDate: todayEnd };
}

export function resolvePreviousDateRange(params: {
  startDate: Date;
  endDate: Date;
}) {
  // Assumimos start/end já normalizados (início/fim do dia).
  const startDay = startOfDay(params.startDate);
  const endDay = startOfDay(params.endDate);

  // Duração em dias (inclusive)
  const msPerDay = 24 * 60 * 60 * 1000;
  const days =
    Math.floor((endDay.getTime() - startDay.getTime()) / msPerDay) + 1;

  const previousEnd = endOfDay(addDaysUTC(startDay, -1));
  const previousStart = startOfDay(addDaysUTC(startDay, -days));

  return { startDate: previousStart, endDate: previousEnd };
}


