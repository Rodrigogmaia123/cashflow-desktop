"use client";

import { useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/app/app/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.reason);
      return;
    }

    setSuccess(true);

    // Se a senha foi alterada com sucesso, fazer logout automático
    if (result.data?.requiresLogout) {
      // Limpar formulário apenas se ainda existir
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
      
      // Aguardar um pouco para mostrar mensagem de sucesso
      setTimeout(async () => {
        await signOut({
          redirect: true,
          callbackUrl: "/login?message=password-changed",
        });
      }, 1500);
    } else {
      // Limpar formulário apenas se ainda existir
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="currentPassword" className="text-xs font-semibold text-muted-foreground">
          Senha atual
        </label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          placeholder="Digite sua senha atual"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-xs font-semibold text-muted-foreground">
          Nova senha
        </label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground">
          Confirmar nova senha
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          placeholder="Digite a nova senha novamente"
          className="w-full"
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive">
          {error}
        </p>
      )}

      {success && (
        <div className="space-y-2">
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2 text-[11px] text-emerald-700">
            Senha alterada com sucesso! Você será desconectado em instantes...
          </p>
          <p className="text-[10px] text-muted-foreground">
            Um email de confirmação foi enviado para sua caixa de entrada.
          </p>
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        className="w-full"
        variant="outline"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
