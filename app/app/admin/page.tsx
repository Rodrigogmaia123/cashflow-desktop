import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isDesktopMode } from "@/lib/desktop";
import { getAdminMetrics, getAdminUsers, getAdminCharts } from "./actions";
import { getAdminLicenses } from "./licenses-actions";
import { AdminMetrics } from "@/components/admin/admin-metrics";
import { AdminUsersList } from "@/components/admin/admin-users-list";
import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminLicensesList } from "@/components/admin/admin-licenses-list";

export default async function AdminPage() {
  if (isDesktopMode()) {
    redirect("/app/overview");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/app/overview");
  }

  const [metricsResult, usersResult, chartsResult, licensesResult] =
    await Promise.all([
      getAdminMetrics(),
      getAdminUsers({ page: 1, pageSize: 25 }),
      getAdminCharts(),
      getAdminLicenses(),
    ]);

  // Se houver erro nas métricas, redireciona ou mostra erro
  if (!metricsResult.success || !metricsResult.data) {
    return (
      <section className="space-y-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Erro ao carregar métricas: {metricsResult.reason}
          </p>
        </div>
      </section>
    );
  }

  // Se houver erro nos usuários, mostra apenas métricas
  if (!usersResult.success || !usersResult.data) {
    return (
      <section className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Operação
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie licenças, serial e o que entra da operação
          </p>
        </div>

        <AdminMetrics metrics={metricsResult.data} />
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Erro ao carregar usuários: {usersResult.reason}
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Operação
        </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie licenças, serial e o que entra da operação
          </p>
      </div>

      {/* Seção de Métricas */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Métricas Gerais</h2>
          <p className="text-xs text-muted-foreground">
            Visão geral do negócio e performance
          </p>
        </div>
        <AdminMetrics metrics={metricsResult.data} />
      </section>

      {/* Seção de Gráficos */}
      {chartsResult.success && chartsResult.data && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Análises e Tendências</h2>
            <p className="text-xs text-muted-foreground">
              Evolução de crescimento e receita ao longo do tempo
            </p>
          </div>
          <AdminCharts chartsData={chartsResult.data} />
        </section>
      )}

      {/* Seção de Licenças desktop */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Licenças desktop</h2>
          <p className="text-xs text-muted-foreground">
            Crie chave, busque por e-mail ou serial. Revogar corta a chave —
            inclusive vitalícia. O app fecha na próxima checagem.
          </p>
        </div>
        {licensesResult.success && licensesResult.data ? (
          <AdminLicensesList initialLicenses={licensesResult.data} />
        ) : (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Erro ao carregar licenças: {licensesResult.reason}
            </p>
          </div>
        )}
      </section>

      {/* Seção de Usuários */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Gestão de Usuários</h2>
          <p className="text-xs text-muted-foreground">
            Gerencie planos, assinaturas e permissões
          </p>
        </div>
        <AdminUsersList
          initialUsers={usersResult.data}
          initialFilters={{ page: 1, pageSize: 25 }}
        />
      </section>
    </div>
  );
}

