"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UserFilters } from "@/app/app/admin/actions";
import type { Plan } from "@/lib/billing/plans";

type Props = {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  isLoading?: boolean;
};

/**
 * Componente de filtros para listagem de usuários
 * Permite busca, filtro por plano, status e ordenação
 */
export function AdminUsersFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: Props) {
  const [search, setSearch] = useState(filters.search || "");
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Debounce seria ideal aqui, mas para simplicidade vamos atualizar onBlur
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      onFiltersChange({
        ...filters,
        search: search.trim() || undefined,
        page: 1, // Reset para primeira página ao filtrar
      });
    });
  };

  const handleFilterChange = (key: keyof UserFilters, value: unknown) => {
    startTransition(() => {
      onFiltersChange({
        ...filters,
        [key]: value,
        page: 1, // Reset para primeira página ao filtrar
      });
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    startTransition(() => {
      onFiltersChange({
        page: 1,
        pageSize: filters.pageSize || 25,
      });
    });
  };

  const hasActiveFilters =
    filters.search ||
    (filters.plan && filters.plan !== "ALL") ||
    (filters.status && filters.status !== "ALL") ||
    (filters.sortBy && filters.sortBy !== "NEWEST");

  return (
    <div className="space-y-4 rounded-lg border border-white/5 bg-card-secondary p-4">
      {/* Busca */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onBlur={() => {
            if (search !== filters.search) {
              handleSearchSubmit(new Event("submit") as unknown as React.FormEvent);
            }
          }}
          className="flex-1"
          disabled={isLoading || isPending}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={isLoading || isPending}
        >
          Buscar
        </Button>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearFilters}
            disabled={isLoading || isPending}
          >
            Limpar
          </Button>
        )}
      </form>

      {/* Filtros em linha */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filtro por plano */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Plano:
          </label>
          <select
            value={filters.plan || "ALL"}
            onChange={(e) =>
              handleFilterChange("plan", e.target.value === "ALL" ? undefined : e.target.value)
            }
            disabled={isLoading || isPending}
            className="rounded-md border border-white/10 bg-background px-2 py-1 text-xs"
          >
            <option value="ALL">Todos</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="BUSINESS">BUSINESS</option>
          </select>
        </div>

        {/* Filtro por status */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Status:
          </label>
          <select
            value={filters.status || "ALL"}
            onChange={(e) =>
              handleFilterChange("status", e.target.value === "ALL" ? undefined : e.target.value)
            }
            disabled={isLoading || isPending}
            className="rounded-md border border-white/10 bg-background px-2 py-1 text-xs"
          >
            <option value="ALL">Todos</option>
            <option value="PAID">Apenas pagos</option>
            <option value="FREE">Apenas FREE</option>
            <option value="LIFETIME">Apenas lifetime</option>
          </select>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Ordenar por:
          </label>
          <select
            value={filters.sortBy || "NEWEST"}
            onChange={(e) =>
              handleFilterChange("sortBy", e.target.value as UserFilters["sortBy"])
            }
            disabled={isLoading || isPending}
            className="rounded-md border border-white/10 bg-background px-2 py-1 text-xs"
          >
            <option value="NEWEST">Mais recentes</option>
            <option value="OLDEST">Mais antigos</option>
            <option value="PAID_FIRST">Pagos primeiro</option>
          </select>
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-muted-foreground whitespace-nowrap">
            Por página:
          </label>
          <select
            value={filters.pageSize || 25}
            onChange={(e) =>
              handleFilterChange("pageSize", parseInt(e.target.value, 10))
            }
            disabled={isLoading || isPending}
            className="rounded-md border border-white/10 bg-background px-2 py-1 text-xs"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      {/* Loading indicator */}
      {(isLoading || isPending) && (
        <div className="text-xs text-muted-foreground">
          Carregando...
        </div>
      )}
    </div>
  );
}

