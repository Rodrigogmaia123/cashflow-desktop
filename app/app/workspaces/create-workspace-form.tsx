"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createWorkspace } from "./actions";
import { useRouter } from "next/navigation";
import { CURRENCY_OPTIONS } from "@/lib/domain/currency";

export function CreateWorkspaceForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      try {
        await createWorkspace(formData);
        setSuccess(true);
        // Limpar o formulário após sucesso
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
        // Atualizar a página para mostrar o novo workspace na lista
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao criar workspace.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
          Workspace criado com sucesso!
        </div>
      )}
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-xs font-medium text-muted-foreground"
        >
          Nome do workspace
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={3}
          maxLength={120}
          disabled={isPending}
          className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Ex: Minha Empresa"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="baseCurrency"
          className="text-xs font-medium text-muted-foreground"
        >
          Moeda base
        </label>
        <select
          id="baseCurrency"
          name="baseCurrency"
          defaultValue="BRL"
          disabled={isPending}
          className="w-full rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground">
          Usada para despesas, orçamentos e consolidação convertida.
        </p>
      </div>
      <Button 
        type="submit" 
        size="sm" 
        disabled={isPending}
        className="w-full bg-gradient-to-r from-[#8B5CF6] to-purple-600 hover:from-[#8B5CF6]/90 hover:to-purple-600/90"
      >
        {isPending ? "Criando..." : "Criar workspace"}
      </Button>
    </form>
  );
}

