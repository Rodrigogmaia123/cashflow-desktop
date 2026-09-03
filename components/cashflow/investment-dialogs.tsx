"use client";

import { useState } from "react";
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
  return new Date().toISOString().split("T")[0];
}

export function CreateInvestmentDialog({
  actions,
  isAdmin
}: {
  actions: Actions;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!isAdmin) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        Adicionar (ADMIN)
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" className="bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30 border-[#3B82F6]/40">
          Adicionar investimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Direcionar dinheiro para investimentos</DialogTitle>
          <DialogDescription>
            Registre valores que você separou para investir (ex: reserva de emergência, CDB, Tesouro). Esses valores entram como saída no fluxo de caixa.
          </DialogDescription>
        </DialogHeader>

        <form
          action={async (fd) => {
            await actions.createInvestment(fd);
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
              placeholder="Ex: Reserva de emergência, CDB, Tesouro Selic..."
              className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
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
