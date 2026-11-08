"use client";

import { useState } from "react";
import { PasteStatementDialog } from "@/components/cashflow/paste-statement-dialog";
import { SicoobImportDialog } from "@/components/cashflow/sicoob-import-dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CurrencyCode } from "@/lib/domain/currency";

type Mode = "expense" | "income" | "pdf";

const options: Array<{ mode: Mode; title: string; detail: string }> = [
  { mode: "expense", title: "Colar saídas", detail: "Lista ou planilha de despesas" },
  { mode: "income", title: "Colar entradas", detail: "Lista ou planilha de receitas" },
  { mode: "pdf", title: "Extrato em PDF", detail: "Banco conhecido ou leitura geral" }
];

export function ImportLaunchButton({
  isAdmin,
  expenseCategories,
  incomeCategories,
  currency
}: {
  isAdmin: boolean;
  expenseCategories: Array<{ id: string; name: string }>;
  incomeCategories: Array<{ id: string; name: string }>;
  currency: CurrencyCode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);

  if (!isAdmin) return null;

  function choose(next: Mode) {
    setMenuOpen(false);
    setMode(next);
  }

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            Importar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1">
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.mode}
                type="button"
                className="rounded-md px-3 py-2 text-left hover:bg-white/5"
                onClick={() => choose(option.mode)}
              >
                <span className="block text-sm text-foreground">{option.title}</span>
                <span className="block text-[11px] text-muted-foreground">{option.detail}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <PasteStatementDialog
        isAdmin={isAdmin}
        categories={expenseCategories}
        currency={currency}
        kind="expense"
        open={mode === "expense"}
        onOpenChange={(next) => setMode(next ? "expense" : null)}
      />
      <PasteStatementDialog
        isAdmin={isAdmin}
        categories={incomeCategories}
        currency={currency}
        kind="income"
        open={mode === "income"}
        onOpenChange={(next) => setMode(next ? "income" : null)}
      />
      <SicoobImportDialog
        isAdmin={isAdmin}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        currency={currency}
        open={mode === "pdf"}
        onOpenChange={(next) => setMode(next ? "pdf" : null)}
      />
    </>
  );
}
