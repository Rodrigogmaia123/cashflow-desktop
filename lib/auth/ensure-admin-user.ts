import { prisma } from "@/lib/db";
import { hashPassword } from "./password";

let ensuring: Promise<void> | null = null;

function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export async function ensureAdminUserFromEnv(): Promise<void> {
  if (!ensuring) {
    ensuring = upsertAdminUser().finally(() => {
      ensuring = null;
    });
  }
  await ensuring;
}

async function upsertAdminUser() {
  const email = adminEmail();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !email.includes("@") || password.length < 8) return;

  const hashedPassword = await hashPassword(password);
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { workspaces: { select: { workspaceId: true } } },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hashedPassword,
        isAdmin: true,
        onboardingCompleted: true,
      },
    });
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Operação",
      baseCurrency: "BRL",
    },
  });

  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      password: hashedPassword,
      accountType: "PF",
      plan: "BUSINESS",
      isLifetime: true,
      isAdmin: true,
      onboardingCompleted: true,
      activeWorkspaceId: workspace.id,
      workspaces: {
        create: {
          workspaceId: workspace.id,
          role: "OWNER",
        },
      },
    },
  });
}
