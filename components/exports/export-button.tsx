"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

type ExportButtonProps = {
  action: (formData: FormData) => Promise<string>;
  formData: FormData;
  filename: string;
  label?: string;
};

export function ExportButton({ action, formData, filename, label = "Exportar CSV" }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    setError(null);
    startTransition(async () => {
      try {
        const csv = await action(formData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao exportar");
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleExport} disabled={isPending} size="sm" variant="outline">
        {isPending ? "Exportando..." : label}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
