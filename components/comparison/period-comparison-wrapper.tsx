"use client";

import { PeriodComparisonToggle, type ComparisonPeriodType } from "./period-comparison-toggle";
import { useRouter, useSearchParams } from "next/navigation";

type PeriodComparisonWrapperProps = {
  workspaceId: string;
  offerId?: string;
  comparisonType: ComparisonPeriodType;
  children: React.ReactNode;
};

export function PeriodComparisonWrapper({
  comparisonType,
  children
}: PeriodComparisonWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: ComparisonPeriodType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("compareType", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PeriodComparisonToggle value={comparisonType} onChange={handleChange} />
      {children}
    </div>
  );
}
