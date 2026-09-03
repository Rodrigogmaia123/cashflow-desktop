"use client";

import { PeriodComparisonToggle, type ComparisonPeriodType } from "./period-comparison-toggle";
import { useRouter, useSearchParams } from "next/navigation";

type PeriodComparisonControlsProps = {
  currentType: ComparisonPeriodType;
  otherParams?: string;
};

export function PeriodComparisonControls({ currentType, otherParams = "" }: PeriodComparisonControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: ComparisonPeriodType) => {
    const params = new URLSearchParams(otherParams || searchParams.toString());
    params.set("compareType", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return <PeriodComparisonToggle value={currentType} onChange={handleChange} />;
}
