"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updateUserPlan,
  setUserLifetime,
  cancelUserSubscription,
  getStripeCustomerLink,
  getAdminUsers,
  type UserFilters,
} from "@/app/app/admin/actions";
import { AdminUsersFilters } from "./admin-users-filters";
import { AdminUsersPagination } from "./admin-users-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Sparkles, CreditCard, Calendar, Users } from "lucide-react";
import type { Plan } from "@/lib/billing/plans";

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: Plan;
  isLifetime: boolean;
  isAdmin: boolean;
  createdAt: Date;
  stripeCustomerId: string | null;
  subscription: {
    id: string;
    status: string;
    stripeSubscriptionId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface AdminUsersListProps {
  initialUsers: {
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  };
  initialFilters?: UserFilters;
}

export function AdminUsersList({
  initialUsers,
  initialFilters = { page: 1, pageSize: 25 },
}: AdminUsersListProps) {
  const [users, setUsers] = useState(initialUsers.users);
  const [total, setTotal] = useState(initialUsers.total);
  const [page, setPage] = useState(initialUsers.page);
  const [totalPages, setTotalPages] = useState(initialUsers.totalPages);
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Função para buscar usuários com filtros
  const fetchUsers = async (newFilters: UserFilters) => {
    setIsLoadingUsers(true);
    setError(null);

    try {
      const result = await getAdminUsers(newFilters);
      if (result.success && result.data) {
        setUsers(result.data.users);
        setTotal(result.data.total);
        setPage(result.data.page);
        setTotalPages(result.data.totalPages);
      } else {
        setError(result.reason || "Erro ao carregar usuários");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    startTransition(() => {
      fetchUsers(newFilters);
    });
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    startTransition(() => {
      fetchUsers(newFilters);
    });
  };

  // Estados para dialogs de confirmação
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "lifetime" | "cancel" | "plan";
    userId?: string;
    plan?: Plan;
    isLifetime?: boolean;
  }>({ open: false, type: "lifetime" });

  const handleUpdatePlan = async (userId: string, plan: Plan) => {
    // Se mudando para FREE, mostra confirmação
    if (plan === "FREE") {
      setConfirmDialog({ open: true, type: "plan", userId, plan });
      return;
    }

    await executeUpdatePlan(userId, plan);
  };

  const executeUpdatePlan = async (userId: string, plan: Plan) => {
    setLoading(userId);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("plan", plan);

    const result = await updateUserPlan(formData);

    if (result.success) {
      // Atualiza o usuário na lista local
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan } : u))
      );
      setConfirmDialog({ open: false, type: "plan" });
    } else {
      setError(result.reason || "Erro ao atualizar plano");
    }

    setLoading(null);
  };

  const handleToggleLifetime = async (
    userId: string,
    currentValue: boolean
  ) => {
    setConfirmDialog({
      open: true,
      type: "lifetime",
      userId,
      isLifetime: !currentValue,
    });
  };

  const executeToggleLifetime = async (userId: string, isLifetime: boolean) => {
    setLoading(userId);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("isLifetime", isLifetime.toString());

    const result = await setUserLifetime(formData);

    if (result.success) {
      // Atualiza o usuário na lista local
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isLifetime,
                plan: isLifetime ? "PRO" : u.plan, // Atualiza plan se tornando lifetime
              }
            : u
        )
      );
      setConfirmDialog({ open: false, type: "lifetime" });
    } else {
      setError(result.reason || "Erro ao alterar status lifetime");
    }

    setLoading(null);
  };

  const handleCancelSubscription = async (userId: string) => {
    setConfirmDialog({ open: true, type: "cancel", userId });
  };

  const executeCancelSubscription = async (userId: string) => {
    setLoading(userId);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);

    const result = await cancelUserSubscription(formData);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId && u.subscription
            ? {
                ...u,
                subscription: {
                  ...u.subscription,
                  cancelAtPeriodEnd: true,
                },
              }
            : u
        )
      );
      setConfirmDialog({ open: false, type: "cancel" });
    } else {
      setError(result.reason || "Erro ao cancelar assinatura");
    }

    setLoading(null);
  };

  const handleViewStripe = async (userId: string) => {
    const formData = new FormData();
    formData.append("userId", userId);

    const result = await getStripeCustomerLink(formData);

    if (result.success && result.data) {
      window.open(result.data.url, "_blank");
    } else {
      setError(result.reason || "Erro ao obter link do Stripe");
    }
  };

  const handleConfirmDialog = () => {
    if (!confirmDialog.userId) return;

    if (confirmDialog.type === "lifetime" && confirmDialog.isLifetime !== undefined) {
      executeToggleLifetime(confirmDialog.userId, confirmDialog.isLifetime);
    } else if (confirmDialog.type === "cancel") {
      executeCancelSubscription(confirmDialog.userId);
    } else if (confirmDialog.type === "plan" && confirmDialog.plan) {
      executeUpdatePlan(confirmDialog.userId, confirmDialog.plan);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getConfirmDialogContent = () => {
    const user = users.find((u) => u.id === confirmDialog.userId);
    if (!user) return null;

    switch (confirmDialog.type) {
      case "lifetime":
        return {
          title: confirmDialog.isLifetime
            ? "Tornar usuário Lifetime?"
            : "Remover status Lifetime?",
          description: confirmDialog.isLifetime
            ? `O usuário ${user.email} será marcado como Lifetime e terá acesso PRO permanente. Esta ação não cria subscription no Stripe.`
            : `O status Lifetime será removido do usuário ${user.email}. O plano atual será mantido.`,
        };
      case "cancel":
        return {
          title: "Cancelar assinatura?",
          description: `A assinatura do usuário ${user.email} será cancelada no final do período atual (${formatDate(user.subscription?.currentPeriodEnd || new Date())}). O usuário continuará com acesso até essa data.`,
        };
      case "plan":
        return {
          title: "Alterar plano para FREE?",
          description: `O plano do usuário ${user.email} será alterado para FREE. ${
            user.subscription
              ? "A assinatura ativa no Stripe não será cancelada automaticamente."
              : ""
          }`,
        };
      default:
        return null;
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Usuários</h2>
              <p className="text-xs text-muted-foreground">
                {total} usuário{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <AdminUsersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            isLoading={isLoadingUsers || isPending}
          />

          {/* Lista de usuários */}
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {users.length === 0 && !isLoadingUsers && !isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Nenhum usuário encontrado
                </p>
                <p className="text-xs text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            ) : isLoadingUsers || isPending ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-card-secondary p-4"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              ))
            ) : (
              users.map((user) => {
                const isPaid = user.plan === "PRO" || user.plan === "BUSINESS";
                return (
                  <div
                    key={user.id}
                    className="group flex items-center justify-between rounded-lg border border-white/5 bg-card-secondary p-4 transition-all duration-200 hover:border-white/10 hover:shadow-md"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{user.email}</p>
                        {user.name && (
                          <span className="text-xs text-muted-foreground">
                            {user.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5">
                          {user.isAdmin && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent border border-accent/20">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                          {user.isLifetime && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                              <Sparkles className="h-3 w-3" />
                              Lifetime
                            </span>
                          )}
                          {isPaid && !user.isLifetime && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400 border border-green-500/20">
                              <CreditCard className="h-3 w-3" />
                              {user.plan}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <span>Plano:</span>
                          <span className="font-medium text-foreground">{user.plan}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Cadastrado em {formatDate(user.createdAt)}</span>
                        </span>
                        {user.subscription && (
                          <>
                            <span className="capitalize">
                              Status: <span className="font-medium text-foreground">{user.subscription.status}</span>
                            </span>
                            {user.subscription.cancelAtPeriodEnd && (
                              <span className="text-destructive font-medium">
                                Cancelando em {formatDate(user.subscription.currentPeriodEnd)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={user.plan}
                        onChange={(e) =>
                          handleUpdatePlan(user.id, e.target.value as Plan)
                        }
                        disabled={loading === user.id}
                        className="rounded-md border border-white/10 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="BUSINESS">BUSINESS</option>
                      </select>

                      <Button
                        onClick={() => handleToggleLifetime(user.id, user.isLifetime)}
                        disabled={loading === user.id}
                        variant={user.isLifetime ? "destructive" : "outline"}
                        size="sm"
                      >
                        {loading === user.id
                          ? "..."
                          : user.isLifetime
                          ? "Remover Lifetime"
                          : "Tornar Lifetime"}
                      </Button>

                      {user.subscription && (
                        <Button
                          onClick={() => handleCancelSubscription(user.id)}
                          disabled={loading === user.id || user.subscription.cancelAtPeriodEnd}
                          variant="outline"
                          size="sm"
                        >
                          Cancelar Assinatura
                        </Button>
                      )}

                      {user.stripeCustomerId && (
                        <Button
                          onClick={() => handleViewStripe(user.id)}
                          variant="ghost"
                          size="sm"
                          title="Ver no Stripe Dashboard"
                        >
                          Stripe
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginação */}
          <AdminUsersPagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            pageSize={filters.pageSize || 25}
            onPageChange={handlePageChange}
            isLoading={isLoadingUsers || isPending}
          />
        </CardContent>
      </Card>

      {/* Dialog de confirmação */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.title}</DialogTitle>
            <DialogDescription>{dialogContent?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.type === "cancel" ? "destructive" : "default"}
              onClick={handleConfirmDialog}
              disabled={loading === confirmDialog.userId}
            >
              {loading === confirmDialog.userId ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

