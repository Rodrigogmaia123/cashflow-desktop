import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { AcceptInviteForm } from "./accept-invite-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  token?: string;
}>;

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = params?.token;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Convite Inválido</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O link de convite está inválido ou não foi fornecido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Busca o convite
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Verifica se o convite existe
  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Convite Não Encontrado</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este convite não existe ou já foi utilizado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se expirou
  if (invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <Clock className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Convite Expirado</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este convite expirou em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}.
              Peça um novo convite ao administrador do workspace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se já foi aceito
  if (invite.status === "ACCEPTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Convite Já Aceito</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Este convite já foi aceito.
            </p>
            <Button asChild className="w-full">
              <a href="/app">Ir para o Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se foi rejeitado
  if (invite.status === "REJECTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Convite Rejeitado</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este convite foi rejeitado. Entre em contato com o administrador do workspace se desejar participar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Busca o usuário atual
  const currentUser = await getCurrentUser();

  // Se não está logado, redireciona para login com o token
  if (!currentUser) {
    redirect(`/login?invite=${token}`);
  }

  // Verifica se o email do convite corresponde ao usuário logado
  if (currentUser.email !== invite.email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Email Não Confere</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Este convite foi enviado para <strong>{invite.email}</strong>, mas você está logado como <strong>{currentUser.email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Faça logout e entre com a conta correta, ou peça um novo convite para seu email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se já é membro do workspace
  const existingMembership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: currentUser.id,
        workspaceId: invite.workspaceId,
      },
    },
  });

  if (existingMembership) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Já é Membro</h1>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Você já é membro do workspace <strong>{invite.workspace.name}</strong>.
            </p>
            <Button asChild className="w-full">
              <a href="/app">Ir para o Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostra formulário de aceitação
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-xl font-semibold">Aceitar Convite</h1>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Você foi convidado para participar do workspace:
              </p>
              <p className="text-lg font-semibold">{invite.workspace.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Permissão: <strong>{invite.role}</strong>
              </p>
            </div>
            <AcceptInviteForm token={token} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

