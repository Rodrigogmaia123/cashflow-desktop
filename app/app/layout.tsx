import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getActiveWorkspace, listUserWorkspaces } from "@/lib/workspace";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { AppLayoutClient } from "@/components/layout/app-layout-client";
import { OpsLayoutClient } from "@/components/layout/ops-layout-client";
import { EditionProvider } from "@/components/desktop/edition-provider";
import { getDesktopEdition } from "@/lib/desktop-edition";
import { materializeRecurringExpenses } from "@/lib/domain/recurring-expense";
import { ensureSqliteSchemaOnce } from "@/lib/sqlite-schema-compat";
import { isDesktopMode } from "@/lib/desktop";
import { isOpsShellPath, isOpsSite } from "@/lib/ops";
import {
  evaluateStoredDesktopLicense,
} from "@/lib/desktop-license";
import { refreshDesktopLicenseAccess } from "@/app/ativar/heartbeat-actions";
import { LicenseHeartbeatProvider } from "@/components/desktop/license-heartbeat-provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UserWorkspaceWithWorkspace = Awaited<ReturnType<typeof listUserWorkspaces>>[number];

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureSqliteSchemaOnce();

  if (isDesktopMode()) {
    let access = evaluateStoredDesktopLicense();
    if (!access.allowed) {
      access = await refreshDesktopLicenseAccess({ force: true });
    }
    if (!access.allowed) {
      redirect("/ativar");
    }
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (isOpsSite() && user.isAdmin) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    if (pathname.startsWith("/app") && !isOpsShellPath(pathname)) {
      redirect("/app/admin");
    }

    return (
      <OpsLayoutClient
        userName={user.name}
        userEmail={user.email}
        userImage={user.image}
      >
        {children}
      </OpsLayoutClient>
    );
  }

  const workspace = await getActiveWorkspace(user.id);
  if (workspace?.id) {
    await materializeRecurringExpenses(workspace.id, user.id).catch((error) => {
      console.error("Falha ao gerar despesas recorrentes:", error);
    });
  }
  const memberships = await listUserWorkspaces(user.id);
  const workspaces = memberships.map((m: UserWorkspaceWithWorkspace) => ({
    id: m.workspace.id,
    name: m.workspace.name
  }));
  const edition = getDesktopEdition();

  const shell = (
      <AppLayoutClient
        workspaceName={workspace?.name ?? null}
        userName={user.name}
        userEmail={user.email}
        userImage={user.image}
        workspaces={workspaces}
        activeWorkspaceId={user.activeWorkspaceId}
        isAdmin={user.isAdmin}
        userPlan={user.plan}
        edition={edition}
      >
        {children}
      </AppLayoutClient>
    );

  return (
    <EditionProvider edition={edition}>
    <OnboardingProvider shouldStart={!user.onboardingCompleted}>
      {isDesktopMode() ? (
        <LicenseHeartbeatProvider>{shell}</LicenseHeartbeatProvider>
      ) : (
        shell
      )}
    </OnboardingProvider>
    </EditionProvider>
  );
}
