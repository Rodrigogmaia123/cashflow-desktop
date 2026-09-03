"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Dashboard do Workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          Erro ao carregar o dashboard
        </p>
      </div>
      <div className="flex min-h-[400px] items-center justify-center rounded-md border bg-card">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-lg font-semibold">
            Erro ao carregar dados
          </h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente novamente.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={reset} variant="default">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
