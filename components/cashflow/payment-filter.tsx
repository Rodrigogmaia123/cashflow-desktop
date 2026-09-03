"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { PaymentBrandMark } from "@/components/cashflow/payment-brand-mark";
import { BANK_BRANDS, PAYMENT_METHODS } from "@/lib/domain/payment";

type Option = { id: string; label: string };

function FilterIcon() {
  return (
    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

function UrlMultiFilter({
  paramKey,
  label,
  title,
  noun,
  options,
  renderOption
}: {
  paramKey: string;
  label: string;
  title: string;
  noun: { one: string; many: string };
  options: Option[];
  renderOption?: (option: Option) => ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const currentFilters = searchParams.get(paramKey)?.split(",").filter(Boolean) || [];

  const toggle = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = currentFilters.includes(id)
      ? currentFilters.filter((value) => value !== id)
      : [...currentFilters, id];

    if (next.length === 0) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, next.join(","));
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
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
          <FilterIcon />
          {label}
          {hasFilters ? (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {selectedCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{title}</h4>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar
              </button>
            ) : null}
          </div>
          {hasFilters ? (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedCount} {selectedCount === 1 ? noun.one : noun.many}
            </p>
          ) : null}
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = currentFilters.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-white/5 text-foreground"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/50"
                    }`}
                  >
                    {isSelected ? (
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
                    ) : null}
                  </div>
                  {renderOption ? renderOption(option) : (
                    <span className="flex-1 text-left">{option.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PaymentFilter() {
  return (
    <>
      <UrlMultiFilter
        paramKey="paymentMethods"
        label="Como pagou"
        title="Como pagou"
        noun={{ one: "forma selecionada", many: "formas selecionadas" }}
        options={PAYMENT_METHODS.map((row) => ({ id: row.id, label: row.label }))}
      />
      <UrlMultiFilter
        paramKey="paymentBrands"
        label="Banco"
        title="Banco"
        noun={{ one: "banco selecionado", many: "bancos selecionados" }}
        options={BANK_BRANDS.map((row) => ({ id: row.id, label: row.label }))}
        renderOption={(option) => (
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <PaymentBrandMark brand={option.id} size={18} />
            <span className="truncate">{option.label}</span>
          </span>
        )}
      />
    </>
  );
}
