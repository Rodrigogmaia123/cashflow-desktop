"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-xl font-semibold tracking-tight">
          Algo deu errado
        </h2>
        <p className="text-sm text-muted-foreground">
          Um erro inesperado ocorreu. Tente novamente ou entre em contato com o suporte se o problema persistir.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Código de erro: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            Tentar novamente
          </Button>
          <Button onClick={() => window.location.href = "/app"} variant="outline">
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}
