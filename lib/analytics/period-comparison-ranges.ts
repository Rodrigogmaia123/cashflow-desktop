import { addDaysUTC } from "./date-range-utils";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

export type ComparisonPeriodType = "today" | "7d" | "30d";

export function getComparisonDateRanges(type: ComparisonPeriodType): {
  current: { startDate: Date; endDate: Date };
  previous: { startDate: Date; endDate: Date };
} {
  const now = new Date();
  const todayStart = startOfDayUTC(now);
  const todayEnd = endOfDayUTC(now);

  if (type === "today") {
    const yesterdayStart = addDaysUTC(todayStart, -1);
    const yesterdayEnd = endOfDayUTC(yesterdayStart);

    return {
      current: { startDate: todayStart, endDate: todayEnd },
      previous: { startDate: yesterdayStart, endDate: yesterdayEnd }
    };
  }

  if (type === "7d") {
    const currentStart = addDaysUTC(todayStart, -6);
    const previousEnd = addDaysUTC(todayStart, -1);
    const previousStart = addDaysUTC(previousEnd, -6);

    return {
      current: { startDate: currentStart, endDate: todayEnd },
      previous: { startDate: startOfDayUTC(previousStart), endDate: endOfDayUTC(previousEnd) }
    };
  }

  // 30d
  const currentStart = addDaysUTC(todayStart, -29);
  const previousEnd = addDaysUTC(todayStart, -1);
  const previousStart = addDaysUTC(previousEnd, -29);

  return {
    current: { startDate: currentStart, endDate: todayEnd },
    previous: { startDate: startOfDayUTC(previousStart), endDate: endOfDayUTC(previousEnd) }
  };
}
