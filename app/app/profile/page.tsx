import { getCurrentUser } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { ProfileForm } from "@/components/auth/profile-form";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { LogoutButton } from "@/components/profile/logout-button";
import { Mail, Key, Github, Calendar, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  // getCurrentUser já é chamado no layout, mas precisamos aqui para obter dados do usuário
  // O cache() garante que é a mesma query
  const user = await getCurrentUser();
  
  if (!user) {
    // Não deve acontecer pois o layout já protege, mas TypeScript exige
    return null;
  }

  // Buscar dados completos do usuário
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { 
      password: true,
      image: true,
      createdAt: true,
      accounts: {
        select: {
          provider: true,
          type: true,
        },
      },
      sessions: {
        orderBy: { expires: "desc" },
        take: 1,
        select: { expires: true },
      },
    },
  });
  
  const hasPassword = !!dbUser?.password;
  
  // Determinar método de autenticação
  const authMethod = dbUser?.accounts.find(
    (acc) => acc.provider === "github"
  )
    ? "GitHub"
    : dbUser?.accounts.find((acc) => acc.provider === "email")
    ? "Magic Link (Email)"
    : hasPassword
    ? "Email e Senha"
    : "Desconhecido";

  // Último login (última sessão válida)
  const lastLogin = dbUser?.sessions[0]?.expires
    ? new Date(dbUser.sessions[0].expires)
    : null;

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna 1: Avatar e Informações da Conta */}
        <div className="space-y-6">
          {/* Avatar */}
          <div className="space-y-6 rounded-md border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Foto de perfil</h2>
              <p className="text-xs text-muted-foreground">
                Personalize sua foto de perfil
              </p>
            </div>
            <AvatarUploader
              currentImageUrl={dbUser?.image}
              userName={user.name}
            />
          </div>

          {/* Informações da Conta (Read-only) */}
          <div className="space-y-6 rounded-md border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Informações da conta</h2>
              <p className="text-xs text-muted-foreground">
                Dados da sua conta (somente leitura)
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  Método de autenticação
                </div>
                <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                  {authMethod === "GitHub" ? (
                    <Github className="h-4 w-4 text-foreground" />
                  ) : authMethod === "Magic Link (Email)" ? (
                    <Mail className="h-4 w-4 text-foreground" />
                  ) : (
                    <Key className="h-4 w-4 text-foreground" />
                  )}
                  <span className="text-sm">{authMethod}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Data de criação
                </div>
                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                  {dbUser?.createdAt
                    ? new Date(dbUser.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </div>
              </div>

              {lastLogin && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Último login
                  </div>
                  <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                    {lastLogin.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </div>
                <div className="rounded-md border bg-muted px-3 py-2 text-sm">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="rounded-md border bg-card p-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Sair da conta</h2>
                <p className="text-xs text-muted-foreground">
                  Desconecte-se de sua conta
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Coluna 2 e 3: Formulários */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações pessoais */}
          <div className="space-y-6 rounded-md border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Informações pessoais</h2>
              <p className="text-xs text-muted-foreground">
                Atualize seu nome
              </p>
            </div>
            <ProfileForm user={user} />
          </div>

          {/* Alterar senha */}
          <div className="space-y-6 rounded-md border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Alterar senha</h2>
              <p className="text-xs text-muted-foreground">
                Altere sua senha de acesso
              </p>
            </div>
            {hasPassword ? (
              <ChangePasswordForm />
            ) : (
              <div className="space-y-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-700">
                  Autenticação via OAuth
                </p>
                <p className="text-xs text-muted-foreground">
                  Usuários autenticados via {authMethod} não possuem senha
                  cadastrada. Para alterar sua senha, você precisaria criar uma
                  conta com email e senha.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
