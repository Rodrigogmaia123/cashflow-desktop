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
    return pairedWindows(todayStart, todayEnd, 7);
  }

  return pairedWindows(todayStart, todayEnd, 30);
}

/** Janela atual termina hoje. A anterior tem o mesmo tamanho e termina no dia anterior ao início da atual. */
function pairedWindows(todayStart: Date, todayEnd: Date, lengthDays: number) {
  const currentStart = addDaysUTC(todayStart, -(lengthDays - 1));
  const previousEnd = addDaysUTC(currentStart, -1);
  const previousStart = addDaysUTC(previousEnd, -(lengthDays - 1));

  return {
    current: { startDate: startOfDayUTC(currentStart), endDate: todayEnd },
    previous: { startDate: startOfDayUTC(previousStart), endDate: endOfDayUTC(previousEnd) }
  };
}
