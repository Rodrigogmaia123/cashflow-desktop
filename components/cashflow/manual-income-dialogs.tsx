"use client";

import { useMemo, useState } from "react";
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

export type ManualIncomeRow = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: string; // decimal string
  categoryId: string | null;
  categoryName: string | null;
};

export type CategoryOption = {
  id: string;
  name: string;
  type: string; // "INCOME" | "EXPENSE" | "BOTH"
};

type Actions = {
  createManualIncome: (formData: FormData) => Promise<void>;
  updateManualIncome: (formData: FormData) => Promise<void>;
  deleteManualIncome: (formData: FormData) => Promise<void>;
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export function CreateManualIncomeDialog({
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
        Nova entrada (ADMIN)
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Adicionar entrada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova entrada manual</DialogTitle>
          <DialogDescription>
            Entradas que não vêm de ofertas (ex: freela, salário, aportes, etc.).
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.createManualIncome(fd);
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
              placeholder="Ex: Freela, aporte, serviços..."
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Categoria (opcional)</label>
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

export function EditManualIncomeDialog({
  income,
  actions,
  isAdmin,
  categories
}: {
  income: ManualIncomeRow;
  actions: Actions;
  isAdmin: boolean;
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);

  const defaultCategoryId = useMemo(() => income.categoryId ?? "", [income.categoryId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={!isAdmin}>
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar entrada</DialogTitle>
          <DialogDescription>Atualize os campos e salve.</DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.updateManualIncome(fd);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={income.id} />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Data</label>
              <input
                type="date"
                name="date"
                defaultValue={income.date}
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
                defaultValue={income.amount}
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
              defaultValue={income.description}
              required
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Categoria (opcional)</label>
            <select
              name="categoryId"
              defaultValue={defaultCategoryId}
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

export function DeleteManualIncomeDialog({
  incomeId,
  actions,
  isAdmin
}: {
  incomeId: string;
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
          <DialogTitle>Excluir entrada</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. A entrada será removida do cashflow.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.deleteManualIncome(fd);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={incomeId} />

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


