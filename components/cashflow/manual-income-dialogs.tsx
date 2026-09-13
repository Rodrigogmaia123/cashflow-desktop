"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const fieldClass =
  "h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

function nextLineKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  const [lineKeys, setLineKeys] = useState<string[]>(() => [nextLineKey()]);
  const router = useRouter();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setLineKeys([nextLineKey()]);
  }

  if (!isAdmin) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        Nova entrada (ADMIN)
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Adicionar entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novas entradas manuais</DialogTitle>
          <DialogDescription>
            Preencha um ou vários lançamentos e salve tudo de uma vez. Cada linha pode ter data, categoria, valor e descrição diferentes.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.createManualIncome(fd);
            router.refresh();
            setOpen(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-3">
            {lineKeys.map((key, index) => (
              <div key={key} className="space-y-3 rounded-md border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Lançamento {index + 1}
                  </p>
                  {lineKeys.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setLineKeys((prev) => prev.filter((item) => item !== key))}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remover
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Data</label>
                    <input type="date" name="date" defaultValue={todayKey()} required className={fieldClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Valor</label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0.01"
                      required
                      className={fieldClass}
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
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Categoria (opcional)</label>
                  <select name="categoryId" defaultValue="" className={fieldClass}>
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLineKeys((prev) => [...prev, nextLineKey()])}
          >
            <Plus className="mr-1 h-3 w-3" />
            Adicionar outro lançamento
          </Button>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">
              Salvar {lineKeys.length > 1 ? `${lineKeys.length} lançamentos` : "lançamento"}
            </Button>
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
  const router = useRouter();

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
            router.refresh();
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
  const router = useRouter();

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
            router.refresh();
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


