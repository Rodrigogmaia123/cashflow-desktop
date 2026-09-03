import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { CredentialsLoginForm } from "@/components/auth/credentials-login-form";
import { EmailLoginForm } from "@/components/auth/email-login-form";
import { GithubLoginButton } from "@/components/auth/github-login-button";
import { postAuthAppPath } from "@/lib/ops";

type LoginPageProps = {
  searchParams?: Promise<{
    type?: string;
    error?: string;
    invite?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  const params = await searchParams;
  const emailLinkSent = params?.type === "email";
  const inviteToken = params?.invite;

  // Se está logado e tem token de convite, redireciona para aceitar
  if (user && inviteToken) {
    redirect(`/app/accept-invite?token=${inviteToken}`);
  }

  // Se está logado sem convite, vai para o app
  if (user) {
    redirect(postAuthAppPath(user));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-md border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            Entrar na operação
          </h1>
          <p className="text-xs text-muted-foreground">
            Acesso interno. O Cashflow no computador é outro login.
          </p>
        </div>

        {emailLinkSent && (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2 text-[11px] text-emerald-700">
            Enviamos um link de acesso para o seu e-mail. Verifique sua caixa de
            entrada (e spam). O link expira em aproximadamente 15 minutos.
          </p>
        )}

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Entrar com email e senha
            </p>
            <CredentialsLoginForm />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Entrar com e-mail (magic link)
            </p>
            <EmailLoginForm />
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Ou com GitHub
            </p>
            <GithubLoginButton />
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary underline">
            Criar conta
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted-foreground">
          <Link href="/forgot-password" className="text-primary underline">
            Esqueci minha senha
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

