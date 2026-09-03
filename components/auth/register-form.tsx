"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { register } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"PF" | "PJ">("PF");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("accountType", accountType);

    const result = await register(formData);

    if (!result.success) {
      setError(result.reason);
      setIsSubmitting(false);
      return;
    }

    // Login automático após registro bem-sucedido
    // Usamos a senha do formulário (ainda em memória) para fazer login
    if (result.data?.email && password) {
      try {
        const signInResult = await signIn("credentials", {
          email: result.data.email,
          password: password, // Senha ainda está no estado do componente
          redirect: false,
          callbackUrl: "/app/overview"
        });

        if (signInResult?.ok) {
          // Aguardar um pouco para garantir que a sessão foi criada
          await new Promise(resolve => setTimeout(resolve, 100));
          router.push("/app/overview");
          router.refresh();
        } else {
          setError("Conta criada, mas falha no login. Tente fazer login manualmente.");
          setIsSubmitting(false);
        }
      } catch (err) {
        console.error("Login error after register:", err);
        setError("Conta criada, mas falha no login. Tente fazer login manualmente.");
        setIsSubmitting(false);
      }
    } else {
      // Fallback: redirecionar para login
      router.push("/login?registered=1");
    }
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
          placeholder="Seu nome"
          className="w-full"
        />
      </div>

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

      <div className="space-y-2">
        <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
          Senha
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Tipo de conta
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAccountType("PF")}
            className={`flex-1 rounded-md border px-3 py-2 text-xs transition-colors ${
              accountType === "PF"
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            Pessoa Física (PF)
          </button>
          <button
            type="button"
            onClick={() => setAccountType("PJ")}
            className={`flex-1 rounded-md border px-3 py-2 text-xs transition-colors ${
              accountType === "PJ"
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-muted-foreground hover:bg-accent"
            }`}
          >
            Pessoa Jurídica (PJ)
          </button>
        </div>
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
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
