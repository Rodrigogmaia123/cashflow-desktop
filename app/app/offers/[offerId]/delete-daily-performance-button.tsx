"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteDailyPerformance } from "./actions";

interface DeleteDailyPerformanceButtonProps {
  id: string;
  offerId: string;
}

export function DeleteDailyPerformanceButton({
  id,
  offerId,
}: DeleteDailyPerformanceButtonProps) {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    await deleteDailyPerformance(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="flex justify-end"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="offerId" value={offerId} />
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        className="mt-1 h-6 px-2 text-[10px]"
      >
        Excluir
      </Button>
    </form>
  );
}

