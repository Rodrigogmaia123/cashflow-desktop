"use client";

import { useState } from "react";
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

export type InvestmentRow = {
  id: string;
  date: string;
  description: string;
  amount: string;
};

type Actions = {
  createInvestment: (formData: FormData) => Promise<void>;
  updateInvestment: (formData: FormData) => Promise<void>;
  deleteInvestment: (formData: FormData) => Promise<void>;
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

export function CreateInvestmentDialog({
  actions,
  isAdmin
}: {
  actions: Actions;
  isAdmin: boolean;
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
        Adicionar (ADMIN)
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 border-[#3B82F6]/40">
          Adicionar investimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Direcionar dinheiro para investimentos</DialogTitle>
          <DialogDescription>
            Preencha um ou vários lançamentos e salve tudo de uma vez. Cada linha pode ter data, valor e descrição diferentes.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.createInvestment(fd);
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
                    placeholder="Ex: Reserva de emergência, CDB, Tesouro Selic..."
                    className={fieldClass}
                  />
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

export function EditInvestmentDialog({
  investment,
  actions,
  isAdmin
}: {
  investment: InvestmentRow;
  actions: Actions;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" disabled={!isAdmin}>
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar investimento</DialogTitle>
          <DialogDescription>Atualize os campos e salve.</DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.updateInvestment(fd);
            router.refresh();
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={investment.id} />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Data</label>
              <input
                type="date"
                name="date"
                defaultValue={investment.date}
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
                defaultValue={investment.amount}
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
              defaultValue={investment.description}
              required
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
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

export function DeleteInvestmentDialog({
  investmentId,
  actions,
  isAdmin
}: {
  investmentId: string;
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
          <DialogTitle>Excluir investimento</DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. O registro de investimento será removido do fluxo de caixa.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.deleteInvestment(fd);
            router.refresh();
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={investmentId} />

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
