export type AnalyticsRangeValue = "day" | "7d" | "30d" | "3m" | "6m" | "12m";

type ResolveDateRangeParams =
  | { range: AnalyticsRangeValue | "today" } // "today" = alias para compatibilidade
  | { startDate: Date; endDate: Date };

function startOfDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
}

function endOfDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

function addDaysUTC(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonthsUTC(date: Date, months: number) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function resolveDateRange(params: ResolveDateRangeParams): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();

  if ("startDate" in params) {
    const start = startOfDay(params.startDate);
    const end = endOfDay(params.endDate);
    if (start > end) {
      return { startDate: startOfDay(params.endDate), endDate: endOfDay(params.startDate) };
    }
    return { startDate: start, endDate: end };
  }

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const range = params.range === "today" ? "day" : params.range;

  if (range === "day") {
    return { startDate: todayStart, endDate: todayEnd };
  }
  if (range === "7d") {
    return { startDate: addDaysUTC(todayStart, -6), endDate: todayEnd };
  }
  if (range === "30d") {
    return { startDate: addDaysUTC(todayStart, -29), endDate: todayEnd };
  }
  if (range === "3m") {
    return { startDate: addMonthsUTC(todayStart, -3), endDate: todayEnd };
  }
  if (range === "6m") {
    return { startDate: addMonthsUTC(todayStart, -6), endDate: todayEnd };
  }
  // 12m
  return { startDate: addMonthsUTC(todayStart, -12), endDate: todayEnd };
}


