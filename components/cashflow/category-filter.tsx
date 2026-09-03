"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Category = {
  id: string;
  name: string;
};

type CategoryFilterProps = {
  categories: Category[];
  filterType: "expense" | "income";
  label: string;
};

export function CategoryFilter({ categories, filterType, label }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const paramKey = filterType === "expense" ? "expenseCategories" : "incomeCategories";
  const currentFilters = searchParams.get(paramKey)?.split(",").filter(Boolean) || [];

  const toggleCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let filters = currentFilters;

    if (filters.includes(categoryId)) {
      // Remove categoria
      filters = filters.filter((id) => id !== categoryId);
    } else {
      // Adiciona categoria
      filters = [...filters, categoryId];
    }

    if (filters.length === 0) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, filters.join(","));
    }

    // Usar replace com scroll: false para não dar refresh e não voltar ao topo
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
    // Usar replace com scroll: false para não dar refresh e não voltar ao topo
    router.replace(`?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const selectedCount = currentFilters.length;
  const hasFilters = selectedCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative ${hasFilters ? "border-primary text-primary" : ""}`}
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {label}
          {hasFilters && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {selectedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Filtrar por Categoria</h4>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedCount} categoria{selectedCount !== 1 ? "s" : ""} selecionada{selectedCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma categoria disponível
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((category) => {
                const isSelected = currentFilters.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-white/5 text-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/50"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 text-left">{category.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
