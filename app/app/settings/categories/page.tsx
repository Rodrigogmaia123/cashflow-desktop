import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteCategory, updateCategory } from "@/app/app/settings/categories/actions";
import { CategoryForm } from "./category-form";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId
      }
    }
  });
  // OWNER tem todas as permissões (incluindo as de ADMIN)
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

  const categories = await prisma.category.findMany({
    where: { workspaceId },
    include: { _count: { select: { expenses: true, incomes: true } } },
    orderBy: [{ createdAt: "asc" }]
  });

  const getTypeColor = (type: string) => {
    if (type === "INCOME") return "#7CFF6B"; // Verde Lima
    if (type === "EXPENSE") return "#FF5C5C"; // Vermelho Coral
    return "#3B82F6"; // Azul Elétrico (BOTH)
  };

  const getTypeBgColor = (type: string) => {
    if (type === "INCOME") return "bg-[#7CFF6B]/10 border-[#7CFF6B]/20";
    if (type === "EXPENSE") return "bg-[#FF5C5C]/10 border-[#FF5C5C]/20";
    return "bg-[#3B82F6]/10 border-[#3B82F6]/20";
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
          Categorias
        </h1>
        <p className="text-sm text-muted-foreground">
          Categorias customizadas reutilizáveis em despesas e entradas manuais.
        </p>
      </div>

      <Card className="border-white/5 bg-card">
        <CardHeader className="pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Criar categoria
          </h2>
        </CardHeader>
        <CardContent>
          <CategoryForm isAdmin={isAdmin} />
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-card">
        <CardHeader className="pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Categorias do workspace
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-card-secondary/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma categoria criada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => {
                const inUse = c._count.expenses > 0 || c._count.incomes > 0;
                const typeColor = getTypeColor(c.type);
                const typeBg = getTypeBgColor(c.type);
                return (
                  <div 
                    key={c.id} 
                    className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 ${typeBg}`}
                  >
                    <form action={updateCategory} className="grid gap-4 md:grid-cols-[1fr_200px_auto] mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-8 w-8 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: typeColor }}
                        />
                        <input
                          type="hidden"
                          name="id"
                          value={c.id}
                        />
                        <input
                          name="name"
                          defaultValue={c.name}
                          className="h-10 flex-1 rounded-xl border-0 bg-[#0F131A] px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!isAdmin}
                          required
                        />
                      </div>
                      <select
                        name="type"
                        defaultValue={c.type}
                        className="h-10 w-full rounded-xl border-0 bg-[#0F131A] px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isAdmin}
                      >
                        <option value="INCOME">Entrada</option>
                        <option value="EXPENSE">Saída</option>
                        <option value="BOTH">Ambos</option>
                      </select>
                      <Button 
                        type="submit" 
                        variant="outline" 
                        disabled={!isAdmin}
                        className="hover:bg-white/5 hover:border-[#8B5CF6]/30"
                      >
                        Salvar
                      </Button>
                    </form>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                      <span className="text-xs text-muted-foreground">
                        Em uso: <span className="font-medium text-foreground">{c._count.expenses}</span> despesas •{" "}
                        <span className="font-medium text-foreground">{c._count.incomes}</span> entradas
                      </span>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          disabled={!isAdmin || inUse}
                          title={inUse ? "Categoria em uso: não pode excluir" : "Excluir categoria"}
                          className={inUse 
                            ? "text-muted-foreground cursor-not-allowed" 
                            : "text-[#FF5C5C] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/10"
                          }
                        >
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}


