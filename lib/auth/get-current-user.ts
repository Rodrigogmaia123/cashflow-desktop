import { cache } from "react";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { isDesktopMode } from "@/lib/desktop";
import { ensureDesktopUser } from "@/lib/desktop-bootstrap";
import type { AuthUser } from "./types";

/**
 * Ponto único para obter o usuário autenticado (NextAuth + Prisma).
 * Não expõe detalhes de sessão para o resto da aplicação.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  if (isDesktopMode()) {
    // Impede o Next de gravar no .exe os dados do banco usado no build
    await headers();
    return ensureDesktopUser();
  }

  const session = await getServerSession(authOptions);

  // Debug temporário (remover em produção)
  if (process.env.NODE_ENV === "development") {
    console.log("[getCurrentUser] Session:", session ? "exists" : "null");
    console.log("[getCurrentUser] User email:", session?.user?.email || "none");
  }

  if (!session?.user?.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      accountType: true,
      plan: true,
      isLifetime: true,
      isAdmin: true,
      onboardingCompleted: true,
      activeWorkspaceId: true,
      image: true, // Incluir imagem do usuário
      workspaces: {
        select: {
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    return null;
  }

  const activeWorkspaceId =
    dbUser.activeWorkspaceId ?? dbUser.workspaces[0]?.workspaceId ?? null;

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
    accountType: (dbUser.accountType as "PF" | "PJ" | null) ?? null,
    plan: (dbUser.plan as "FREE" | "PRO" | "BUSINESS") ?? "FREE",
    isLifetime: dbUser.isLifetime ?? false,
    isAdmin: dbUser.isAdmin ?? false,
    activeWorkspaceId,
    onboardingCompleted: dbUser.onboardingCompleted
  };
});
