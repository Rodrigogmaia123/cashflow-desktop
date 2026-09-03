"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCategory } from "./actions";
import { useRouter } from "next/navigation";

export function CategoryForm({ isAdmin }: { isAdmin: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      try {
        await createCategory(formData);
        setSuccess(true);
        // Limpar o formulário após sucesso
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
        // Atualizar a página para mostrar a nova categoria na lista
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao criar categoria.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_200px_auto]">
      {error && (
        <div className="md:col-span-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="md:col-span-3 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
          Categoria criada com sucesso!
        </div>
      )}
      <input
        name="name"
        placeholder="Ex: Ferramentas, Freela, Salário..."
        className="h-10 w-full rounded-xl border-0 bg-[#0F131A] px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!isAdmin || isPending}
        required
      />
      <select
        name="type"
        defaultValue="BOTH"
        className="h-10 w-full rounded-xl border-0 bg-[#0F131A] px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!isAdmin || isPending}
      >
        <option value="INCOME">Entrada</option>
        <option value="EXPENSE">Saída</option>
        <option value="BOTH">Ambos</option>
      </select>
      <Button 
        type="submit" 
        disabled={!isAdmin || isPending}
        className="bg-gradient-to-r from-[#8B5CF6] to-purple-600 hover:from-[#8B5CF6]/90 hover:to-purple-600/90"
      >
        {isPending ? "Criando..." : "Criar"}
      </Button>
      {!isAdmin && (
        <p className="md:col-span-3 mt-3 text-xs text-muted-foreground">
          Apenas ADMIN pode criar/editar/excluir categorias.
        </p>
      )}
    </form>
  );
}

