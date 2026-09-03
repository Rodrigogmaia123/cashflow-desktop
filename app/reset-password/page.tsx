import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { postAuthAppPath } from "@/lib/ops";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect(postAuthAppPath(user));
  }

  const params = await searchParams;
  const token = params?.token;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 rounded-md border bg-card p-6 shadow-sm">
          <div className="space-y-1 text-center">
            <h1 className="text-lg font-semibold tracking-tight">
              Token inválido
            </h1>
            <p className="text-xs text-muted-foreground">
              O link de recuperação está inválido ou expirado.
            </p>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            <Link href="/forgot-password" className="text-primary underline">
              Solicitar novo link
            </Link>
          </p>
          <p className="text-center text-[11px] text-muted-foreground">
            <Link href="/login" className="text-primary underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-md border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">
            Redefinir senha
          </h1>
          <p className="text-xs text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        <ResetPasswordForm token={token} />

        <p className="text-center text-[11px] text-muted-foreground">
          <Link href="/login" className="text-primary underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
