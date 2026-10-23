"use client";

import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";

export type DonutSlice = {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
};

type Props = {
  data: DonutSlice[];
  currency: CurrencyCode;
};

const RADIUS = 70;
const CIRC = 2 * Math.PI * RADIUS;

export function DonutChart({ data, currency }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, slice) => sum + slice.amount, 0);
  let offset = 0;
  const segments = data.map((slice) => {
    const fraction = total > 0 ? slice.amount / total : 0;
    const length = fraction * CIRC;
    const segment = { ...slice, fraction, length, offset };
    offset += length;
    return segment;
  });

  return (
    <div className="mt-3.5 flex flex-col items-stretch gap-[18px]">
      <svg viewBox="0 0 200 200" className="mx-auto h-40 w-40" aria-hidden="true">
        <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="34" />
        {segments.map((slice) => (
          <circle
            key={slice.id}
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke={slice.color}
            strokeWidth="34"
            strokeDasharray={`${slice.length.toFixed(2)} ${(CIRC - slice.length).toFixed(2)}`}
            strokeDashoffset={(-slice.offset).toFixed(2)}
            transform="rotate(-90 100 100)"
          />
        ))}
      </svg>
      <div className="flex w-full flex-col">
        {segments.map((slice) => (
          <div
            key={slice.id}
            className="grid grid-cols-[10px_minmax(0,1fr)_auto_52px] items-center gap-2.5 border-t border-white/10 py-2 text-[13px]"
          >
            <i className="block h-2.5 w-2.5 rounded-[3px]" style={{ background: slice.color }} />
            <em className="truncate not-italic text-[#f3f7f4]">{slice.label}</em>
            <b className="text-right font-mono text-[12.5px] font-medium text-[#f3f7f4]">
              {formatMoney(slice.amount, currency)}
            </b>
            <span className="text-right font-mono text-xs text-[#9ca9a1]">
              {(slice.fraction * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutEmpty({ message }: { message: string }) {
  return (
    <div className="mt-3.5 grid min-h-[150px] w-full place-items-center rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-[13px] text-[#64706a]">
      {message}
    </div>
  );
}
