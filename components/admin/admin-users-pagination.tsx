"use client";

import { Button } from "@/components/ui/button";

type Props = {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

/**
 * Componente de paginação para listagem de usuários
 * Mostra informações de página atual e controles de navegação
 */
export function AdminUsersPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
}: Props) {
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const handlePrevious = () => {
    if (currentPage > 1 && !isLoading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !isLoading) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-card-secondary px-4 py-3">
      <div className="text-xs text-muted-foreground">
        Mostrando {start} a {end} de {total} usuário{total !== 1 ? "s" : ""}
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground">
          Página {currentPage} de {totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1 || isLoading}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages || isLoading}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

