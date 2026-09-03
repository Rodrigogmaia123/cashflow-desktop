"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loadReportAction } from "./actions";
import { Loader2 } from "lucide-react";

interface LoadReportButtonProps {
  reportId: string;
  reportName: string;
}

export function LoadReportButton({ reportId, reportName }: LoadReportButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLoad = () => {
    if (!confirm(`Carregar o relatório "${reportName}"? Os filtros atuais serão substituídos.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await loadReportAction(reportId);

        if (result.success && result.report) {
          const { filters } = result.report;
          
          // Constrói a URL com os filtros salvos
          const params = new URLSearchParams();
          
          if (filters.range) {
            params.set("range", filters.range);
          }
          
          if (filters.start && filters.end) {
            params.set("start", filters.start);
            params.set("end", filters.end);
          }

          // Redireciona para a página de cashflow com os filtros aplicados
          router.push(`/app/cashflow?${params.toString()}`);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Erro ao carregar relatório");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLoad}
      disabled={isPending}
      className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Carregando...
        </>
      ) : (
        "Carregar"
      )}
    </Button>
  );
}

