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
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
  updateRecurringExpense
} from "@/app/app/cashflow/recurring-actions";
import type { CategoryOption } from "@/components/cashflow/expense-dialogs";

export type RecurringExpenseRow = {
  id: string;
  description: string;
  amount: string;
  type: string;
  dayOfMonth: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

const typeOptions = [
  { value: "FIXED", label: "Fixa" },
  { value: "VARIABLE", label: "Variável" }
];

function RecurringFormFields({
  categories,
  defaults
}: {
  categories: CategoryOption[];
  defaults?: Partial<RecurringExpenseRow>;
}) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Descrição</label>
        <input
          type="text"
          name="description"
          required
          minLength={2}
          defaultValue={defaults?.description}
          placeholder="Ex: Canva, gestor, internet..."
          className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Valor</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaults?.amount}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Dia do mês</label>
          <input
            type="number"
            name="dayOfMonth"
            min={1}
            max={31}
            required
            defaultValue={defaults?.dayOfMonth ?? 10}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Tipo</label>
          <select
            name="type"
            defaultValue={defaults?.type === "VARIABLE" ? "VARIABLE" : "FIXED"}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Categoria</label>
          <select
            name="categoryId"
            defaultValue={defaults?.categoryId ?? ""}
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
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Encerra em (opcional)</label>
          <input
            type="date"
            name="endDate"
            defaultValue={defaults?.endDate ?? ""}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
    </>
  );
}

export function RecurringExpensePanel({
  isAdmin,
  categories,
  items,
  currency
}: {
  isAdmin: boolean;
  categories: CategoryOption[];
  items: RecurringExpenseRow[];
  currency: CurrencyCode;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const activeCount = useMemo(() => items.filter((i) => i.isActive).length, [items]);

  return (
    <div className="rounded-lg border border-white/5 bg-card p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Despesas recorrentes</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Cadastre uma vez. No dia combinado o sistema lança a despesa no caixa, igual a uma
            despesa manual. Você continua podendo criar despesas avulsas normalmente.
          </p>
        </div>
        {isAdmin ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                Nova recorrente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova despesa recorrente</DialogTitle>
                <DialogDescription>
                  Se o dia do mês já passou, o lançamento deste mês aparece agora. Os próximos
                  meses entram sozinhos.
                </DialogDescription>
              </DialogHeader>
              <form
                action={async (fd) => {
                  await createRecurringExpense(fd);
                  setCreateOpen(false);
                }}
                className="space-y-3"
              >
                <RecurringFormFields categories={categories} />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">Salvar regra</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <Button type="button" size="sm" variant="outline" disabled>
            Nova recorrente (ADMIN)
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma regra ainda. {activeCount === 0 ? "Canva, equipe, internet — isso vive aqui." : null}
        </p>
      ) : (
        <div className="divide-y divide-white/5 rounded-md border border-white/5">
          {items.map((item) => (
            <RecurringRow
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              categories={categories}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecurringRow({
  item,
  isAdmin,
  categories,
  currency
}: {
  item: RecurringExpenseRow;
  isAdmin: boolean;
  categories: CategoryOption[];
  currency: CurrencyCode;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{item.description}</span>
          {!item.isActive && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Pausada
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Todo dia {item.dayOfMonth} · {formatMoney(item.amount, currency)}
          {item.categoryName ? ` · ${item.categoryName}` : ""}
        </p>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2">
          <form action={toggleRecurringExpense}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" size="sm" variant="ghost">
              {item.isActive ? "Pausar" : "Retomar"}
            </Button>
          </form>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" variant="outline">
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar recorrente</DialogTitle>
                <DialogDescription>
                  Muda os próximos meses. Lançamentos já gerados no caixa não são alterados.
                </DialogDescription>
              </DialogHeader>
              <form
                action={async (fd) => {
                  await updateRecurringExpense(fd);
                  setEditOpen(false);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="id" value={item.id} />
                <RecurringFormFields categories={categories} defaults={item} />
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
          <form
            action={deleteRecurringExpense}
            onSubmit={(e) => {
              if (!confirm("Apagar a regra? As despesas já lançadas no caixa permanecem.")) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" size="sm" variant="ghost">
              Apagar regra
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
