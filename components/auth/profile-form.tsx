"use client";

import { useState, type FormEvent } from "react";
import { updateProfile } from "@/app/app/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/lib/auth/types";

type ProfileFormProps = {
  user: AuthUser;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const result = await updateProfile(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.reason);
      return;
    }

    setSuccess(true);
    // Recarregar página para atualizar dados
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
          Nome completo
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={user.name ?? ""}
          className="w-full"
          placeholder="Seu nome completo"
        />
        <p className="text-[10px] text-muted-foreground">
          Mínimo 2 caracteres, máximo 100 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="w-full bg-muted"
        />
        <p className="text-[10px] text-muted-foreground">
          O email não pode ser alterado por questões de segurança
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2 text-[11px] text-emerald-700">
          Perfil atualizado com sucesso!
        </p>
      )}

      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
