"use client";

import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await forgotPassword(formData);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.reason);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-[11px] text-emerald-700">
          Se o email existir, você receberá um link para redefinir sua senha.
          Verifique sua caixa de entrada (e spam).
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="seu-email@exemplo.com"
          className="w-full"
        />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="sm"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
      </Button>
    </form>
  );
}
