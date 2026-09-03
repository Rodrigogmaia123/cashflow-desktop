import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { BudgetsClientPage } from "@/components/budgets/budgets-client-page";
import type { CurrencyCode } from "@/lib/domain/currency";

export const metadata = {
  title: "Orçamentos | Cashflow Pro",
  description: "Gerencie seus orçamentos por categoria",
};

export default async function BudgetsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await requireActiveWorkspaceId();

  // Buscar categorias do workspace
  const [categories, workspace] = await Promise.all([
    prisma.category.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: [
        { type: "asc" },
        { name: "asc" },
      ],
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { baseCurrency: true }
    })
  ]);

  return (
    <BudgetsClientPage
      categories={categories}
      currency={(workspace?.baseCurrency ?? "BRL") as CurrencyCode}
    />
  );
}
