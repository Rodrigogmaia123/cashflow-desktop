"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

  const handleSubmit = async (formData: FormData) => {
    await createDailyPerformance(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="mt-3 grid gap-3 text-xs sm:text-sm md:grid-cols-2"
      data-tour="daily-performance-form"
    >
      <input type="hidden" name="offerId" value={offerId} />

      <div className="space-y-1">
        <label
          htmlFor="date"
          className="text-[11px] font-medium text-muted-foreground"
        >
          Data
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="investment"
          className="text-[11px] font-medium text-muted-foreground"
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
          className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="revenue"
          className="text-[11px] font-medium text-muted-foreground"
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
          className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="sales"
          className="text-[11px] font-medium text-muted-foreground"
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
          className="w-full rounded-md border px-2 py-1.5 text-xs sm:text-sm text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="comment"
          className="mb-1 block text-[11px] font-medium text-muted-foreground"
        >
          Comentário (opcional)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          placeholder="Ex.: queda de ROI por instabilidade no gateway, troca de criativo, campanha pausada..."
          className="w-full rounded-md border px-2 py-2 text-xs text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-gray-500"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" size="sm" className="w-full">
          Registrar performance
        </Button>
      </div>
    </form>
  );
}

