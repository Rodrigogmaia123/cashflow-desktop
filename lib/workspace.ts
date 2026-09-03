import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getActiveWorkspace(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      activeWorkspace: true
    }
  });

  return user?.activeWorkspace ?? null;
}

export async function requireActiveWorkspaceId(): Promise<string> {
  const authUser = await getCurrentUser();

  if (!authUser) {
    redirect("/login");
  }

  if (!authUser.activeWorkspaceId) {
    redirect("/app/workspaces?missing=1");
  }

  return authUser.activeWorkspaceId;
}

export async function listUserWorkspaces(userId: string) {
  const workspaces = await prisma.userWorkspace.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { workspace: { createdAt: "asc" } }
  });

  return workspaces;
}


