"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { replaceAndRefresh } from "@/lib/navigation/replace-and-refresh";
import { createDailyPerformance } from "./actions";

interface DailyPerformanceFormProps {
  offerId: string;
  currency?: string;
}

export function DailyPerformanceForm({
  offerId,
  currency = "BRL"
}: DailyPerformanceFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await createDailyPerformance(formData);
    formRef.current?.reset();
    replaceAndRefresh(router, pathname || `/app/offers/${offerId}`);
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid gap-x-3.5 text-sm md:grid-cols-2"
      data-tour="daily-performance-form"
    >
      <input type="hidden" name="offerId" value={offerId} />

      <div className="space-y-1 md:col-span-2">
        <label
          htmlFor="date"
          className="mb-1.5 mt-3.5 block text-xs text-[#9ca9a1]"
        >
          Data
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="w-full rounded-[10px] border border-white/10 bg-[#0d1612] px-3.5 py-2.5 text-sm text-[#f3f7f4] outline-none [color-scheme:dark] focus:border-[#ac93ff]"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="investment"
          className="mb-1.5 mt-3.5 block text-xs text-[#9ca9a1]"
        >
          Investimento ({currency})
        </label>
        <input
          id="investment"
          name="investment"
          type="number"
          step="0.01"
          min={0}
          required
          className="w-full rounded-[10px] border border-white/10 bg-[#0d1612] px-3.5 py-2.5 text-sm text-[#f3f7f4] outline-none [color-scheme:dark] focus:border-[#ac93ff]"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="revenue"
          className="mb-1.5 mt-3.5 block text-xs text-[#9ca9a1]"
        >
          Faturamento ({currency})
        </label>
        <input
          id="revenue"
          name="revenue"
          type="number"
          step="0.01"
          min={0}
          required
          className="w-full rounded-[10px] border border-white/10 bg-[#0d1612] px-3.5 py-2.5 text-sm text-[#f3f7f4] outline-none [color-scheme:dark] focus:border-[#ac93ff]"
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <label
          htmlFor="sales"
          className="mb-1.5 mt-3.5 block text-xs text-[#9ca9a1]"
        >
          Vendas
        </label>
        <input
          id="sales"
          name="sales"
          type="number"
          min={0}
          step={1}
          required
          className="w-full rounded-[10px] border border-white/10 bg-[#0d1612] px-3.5 py-2.5 text-sm text-[#f3f7f4] outline-none [color-scheme:dark] focus:border-[#ac93ff]"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="comment"
          className="mb-1.5 mt-3.5 block text-xs text-[#9ca9a1]"
        >
          Comentário (opcional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          placeholder="Ex.: queda de ROI por instabilidade no gateway, troca de criativo, campanha pausada..."
          className="min-h-[70px] w-full resize-y rounded-[10px] border border-white/10 bg-[#0d1612] px-3.5 py-2.5 text-sm text-[#f3f7f4] outline-none [color-scheme:dark] placeholder:text-[#64706a] focus:border-[#ac93ff]"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" variant="accent" className="mt-4 h-auto w-full rounded-[10px] py-3 shadow-none hover:scale-100">
          Registrar performance
        </Button>
      </div>
    </form>
  );
}

