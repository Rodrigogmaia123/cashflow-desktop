"use server";

import { prisma } from "@/lib/db";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { isPersonalEdition } from "@/lib/desktop-edition";

export async function listQuickCaptureOffers() {
  if (isPersonalEdition()) return [];

  const workspaceId = await requireActiveWorkspaceId();
  return prisma.offer.findMany({
    where: {
      workspaceId,
      status: { not: "DEAD" }
    },
    select: { id: true, name: true, currency: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function listQuickCaptureExpenseCategories() {
  const workspaceId = await requireActiveWorkspaceId();
  return prisma.category.findMany({
    where: { workspaceId, type: { in: ["EXPENSE", "BOTH"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}
