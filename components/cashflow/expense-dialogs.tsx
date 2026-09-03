"use client";

import { useMemo, useState } from "react";
import type { ExpenseType } from "@/app/app/cashflow/actions";
import { PaymentFields } from "@/components/cashflow/payment-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export type ExpenseRow = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: string; // decimal string
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  fromRecurring?: boolean;
  paymentMethod?: string | null;
  paymentBrand?: string | null;
};

export type CategoryOption = {
  id: string;
  name: string;
  type: string; // "INCOME" | "EXPENSE" | "BOTH"
};

type Actions = {
  createExpense: (formData: FormData) => Promise<void>;
  updateExpense: (formData: FormData) => Promise<void>;
  deleteExpense: (formData: FormData) => Promise<void>;
};

const typeOptions: Array<{ value: ExpenseType; label: string }> = [
  { value: "FIXED", label: "Fixa" },
  { value: "VARIABLE", label: "Variável" }
];

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export function CreateExpenseDialog({
  actions,
  isAdmin,
  categories
}: {
  actions: Actions;
  isAdmin: boolean;
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);

  if (!isAdmin) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        Nova despesa (ADMIN)
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Nova despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova despesa</DialogTitle>
          <DialogDescription>
            Despesas entram no cashflow como saída. Valores são sempre positivos.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.createExpense(fd);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Data</label>
              <input
                type="date"
                name="date"
                defaultValue={todayKey()}
                required
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Valor</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                required
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Descrição</label>
            <input
              type="text"
              name="description"
              required
              placeholder="Ex: Assinatura do tracker, servidor, contador..."
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Tipo</label>
              <select
                name="type"
                defaultValue="VARIABLE"
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Categoria</label>
              <select
                name="categoryId"
                defaultValue=""
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PaymentFields />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditExpenseDialog({
  expense,
  actions,
  isAdmin,
  categories
}: {
  expense: ExpenseRow;
  actions: Actions;
  isAdmin: boolean;
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);

  const defaults = useMemo(() => {
    const type = (expense.type === "FIXED" || expense.type === "VARIABLE" ? expense.type : "VARIABLE") as ExpenseType;
    return { type };
  }, [expense.type]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={!isAdmin}>
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar despesa</DialogTitle>
          <DialogDescription>Atualize os campos e salve.</DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.updateExpense(fd);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={expense.id} />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Data</label>
              <input
                type="date"
                name="date"
                defaultValue={expense.date}
                required
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Valor</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                defaultValue={expense.amount}
                required
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Descrição</label>
            <input
              type="text"
              name="description"
              defaultValue={expense.description}
              required
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Tipo</label>
              <select
                name="type"
                defaultValue={defaults.type}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Categoria</label>
              <select
                name="categoryId"
                defaultValue={expense.categoryId ?? ""}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PaymentFields
            defaultMethod={expense.paymentMethod}
            defaultBrand={expense.paymentBrand}
            remember={false}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isAdmin}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteExpenseDialog({
  expenseId,
  actions,
  isAdmin
}: {
  expenseId: string;
  actions: Actions;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={!isAdmin}>
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir despesa</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. A despesa será removida do cashflow.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.deleteExpense(fd);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={expenseId} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="outline" className="border-destructive text-destructive">
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


