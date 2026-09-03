import { PeriodComparisonPanel } from "./period-comparison-panel";
import { getPeriodComparison } from "@/lib/analytics/period-comparison";
import { getComparisonDateRanges, type ComparisonPeriodType } from "@/lib/analytics/period-comparison-ranges";
import { prisma } from "@/lib/db";
import type { CurrencyCode } from "@/lib/domain/currency";

type PeriodComparisonSectionProps = {
  workspaceId: string;
  offerId?: string;
  comparisonType: ComparisonPeriodType;
  currency?: CurrencyCode;
};

export async function PeriodComparisonSection({
  workspaceId,
  offerId,
  comparisonType,
  currency
}: PeriodComparisonSectionProps) {
  const dateRanges = getComparisonDateRanges(comparisonType);

  const [comparison, workspace] = await Promise.all([
    getPeriodComparison({
      workspaceId,
      offerId,
      current: dateRanges.current,
      previous: dateRanges.previous
    }),
    currency
      ? Promise.resolve(null)
      : prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { baseCurrency: true }
        })
  ]);

  const displayCurrency =
    currency ?? ((workspace?.baseCurrency ?? "BRL") as CurrencyCode);

  return (
    <PeriodComparisonPanel
      comparison={comparison}
      currentStart={dateRanges.current.startDate}
      currentEnd={dateRanges.current.endDate}
      previousStart={dateRanges.previous.startDate}
      previousEnd={dateRanges.previous.endDate}
      currency={displayCurrency}
    />
  );
}
