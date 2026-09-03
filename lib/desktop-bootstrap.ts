import { prisma } from "@/lib/db";
import {
  DESKTOP_USER_EMAIL,
  DESKTOP_WORKSPACE_NAME,
  FRESH_DESKTOP_EMAIL,
  FRESH_DESKTOP_NAME,
} from "@/lib/desktop";
import type { AuthUser } from "@/lib/auth/types";

let ensuring: Promise<AuthUser> | null = null;

export async function ensureDesktopUser(): Promise<AuthUser> {
  if (!ensuring) {
    ensuring = createOrLoadDesktopUser().finally(() => {
      ensuring = null;
    });
  }
  return ensuring;
}

async function createOrLoadDesktopUser(): Promise<AuthUser> {
  let user = await prisma.user.findUnique({
    where: { email: DESKTOP_USER_EMAIL },
    include: {
      workspaces: {
        select: { workspaceId: true },
      },
    },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        workspaces: {
          select: { workspaceId: true },
        },
      },
    });
  }

  if (!user) {
    const workspace = await prisma.workspace.create({
      data: {
        name: DESKTOP_WORKSPACE_NAME,
        baseCurrency: "BRL",
      },
    });

    user = await prisma.user.create({
      data: {
        email: FRESH_DESKTOP_EMAIL,
        name: FRESH_DESKTOP_NAME,
        accountType: "PF",
        plan: "BUSINESS",
        isLifetime: true,
        isAdmin: false,
        onboardingCompleted: true,
        activeWorkspaceId: workspace.id,
        workspaces: {
          create: {
            workspaceId: workspace.id,
            role: "OWNER",
          },
        },
      },
      include: {
        workspaces: {
          select: { workspaceId: true },
        },
      },
    });

    await prisma.workspaceFeeConfig.create({
      data: {
        workspaceId: workspace.id,
        checkoutPercentage: 0.1,
        gatewayFeePerSale: 0.3,
        taxPercentage: 0.06,
      },
    });

    await prisma.feeProfile.create({
      data: {
        workspaceId: workspace.id,
        name: "Padrão",
        checkoutPercentage: 0.1,
        gatewayFeePerSale: 0.3,
        taxPercentage: 0.06,
      },
    });
  }

  const activeWorkspaceId =
    user.activeWorkspaceId ?? user.workspaces[0]?.workspaceId ?? null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    accountType: (user.accountType as "PF" | "PJ" | null) ?? null,
    plan: (user.plan as "FREE" | "PRO" | "BUSINESS") ?? "BUSINESS",
    isLifetime: user.isLifetime ?? true,
    isAdmin: false,
    activeWorkspaceId,
    onboardingCompleted: true,
  };
}
