"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateDailyPerformance } from "./actions";

interface UpdateDailyPerformanceFormProps {
  id: string;
  offerId: string;
  date: string;
  investment: number;
  revenue: number;
  sales: number;
  comment: string | null;
}

export function UpdateDailyPerformanceForm({
  id,
  offerId,
  date,
  investment,
  revenue,
  sales,
  comment,
}: UpdateDailyPerformanceFormProps) {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    await updateDailyPerformance(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="mt-2 grid gap-2 md:grid-cols-4"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="offerId" value={offerId} />

      <input
        type="date"
        name="date"
        defaultValue={date}
        className="w-full rounded-md border px-2 py-1.5 text-[11px] text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <input
        type="number"
        step="0.01"
        min={0}
        name="investment"
        defaultValue={investment}
        className="w-full rounded-md border px-2 py-1.5 text-[11px] text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <input
        type="number"
        step="0.01"
        min={0}
        name="revenue"
        defaultValue={revenue}
        className="w-full rounded-md border px-2 py-1.5 text-[11px] text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <input
        type="number"
        min={0}
        step={1}
        name="sales"
        defaultValue={sales}
        className="w-full rounded-md border px-2 py-1.5 text-[11px] text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <div className="md:col-span-4">
        <label
          htmlFor={`comment-${id}`}
          className="mb-1 block text-[11px] font-medium text-muted-foreground"
        >
          Comentário (opcional)
        </label>
        <textarea
          id={`comment-${id}`}
          name="comment"
          rows={3}
          defaultValue={comment ?? ""}
          className="w-full rounded-md border px-2 py-2 text-[11px] text-gray-900 bg-white dark:bg-gray-100 dark:text-gray-900 outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-gray-500"
        />
      </div>
      <div className="md:col-span-4 flex justify-end">
        <Button type="submit" size="sm" variant="outline">
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

