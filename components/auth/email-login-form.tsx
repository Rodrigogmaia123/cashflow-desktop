"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn("email", {
        email,
        redirect: true
        // O NextAuth usará a página verifyRequest configurada (/login?type=email)
      });
    } catch (_err) {
      setError("Não foi possível enviar o link. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="email"
        name="email"
        required
        placeholder="seu-email@exemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {error && (
        <p className="text-[11px] text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="sm"
        className="w-full"
        variant="outline"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Entrar com e-mail"}
      </Button>
    </form>
  );
}


