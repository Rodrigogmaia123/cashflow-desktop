import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { postAuthAppPath } from "@/lib/ops";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(postAuthAppPath(user));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-md border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            Recuperar senha
          </h1>
          <p className="text-xs text-muted-foreground">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="text-center text-[11px] text-muted-foreground">
          Lembrou sua senha?{" "}
          <Link href="/login" className="text-primary underline">
            Fazer login
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted-foreground">
          <Link href="/" className="underline">
            Voltar para a landing
          </Link>
        </p>
      </div>
    </main>
  );
}
