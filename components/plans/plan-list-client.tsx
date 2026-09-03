"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { createSpendPlan } from "@/app/app/plans/actions";

export type PlanListRow = {
  id: string;
  name: string;
  status: string;
  cap: number | null;
  planned: number;
  paid: number;
  remaining: number;
  difference: number;
};

export type OtherWorkspacePlanHint = {
  workspaceName: string;
  names: string[];
};

export function PlanListClient({
  plans,
  isAdmin,
  currency,
  otherWorkspacePlans = []
}: {
  plans: PlanListRow[];
  isAdmin: boolean;
  currency: CurrencyCode;
  otherWorkspacePlans?: OtherWorkspacePlanHint[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Planeje viagem, obra, compra. Nada disso entra no caixa até você
            registrar o pagamento. O fluxo de caixa continua igual.
          </p>
        </div>
        {isAdmin ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                Novo projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo projeto</DialogTitle>
                <DialogDescription>
                  Só um nome. Depois você monta os blocos e os valores planejados.
                </DialogDescription>
              </DialogHeader>
              <form action={createSpendPlan} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Nome</label>
                  <input
                    name="name"
                    required
                    minLength={2}
                    placeholder="Ex: Serra Gaúcha, reforma do banheiro..."
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Teto (opcional)
                  </label>
                  <input
                    name="cap"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Quanto no máximo pode sair"
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Notas</label>
                  <input
                    name="notes"
                    placeholder="Opcional"
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">Criar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {otherWorkspacePlans.length > 0 ? (
        <Card className="border-amber-500/30">
          <CardContent className="py-4 text-sm">
            <p className="font-medium text-foreground">
              Tem projeto em outro workspace
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {otherWorkspacePlans.map((row) => (
                <li key={row.workspaceName}>
                  Em <span className="text-foreground">{row.workspaceName}</span>:{" "}
                  {row.names.join(", ")}. Troque o workspace na barra da esquerda
                  para abrir.
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">
            Nenhum projeto ainda. Crie um envelope para planejar sem misturar com o
            caixa.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/app/plans/${plan.id}`}>
              <Card className="h-full hover:border-white/15">
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold">{plan.name}</h2>
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {plan.status === "OPEN" ? "Aberto" : "Encerrado"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Planejado</div>
                      <div className="font-medium" suppressHydrationWarning>
                        {formatMoney(plan.planned, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pago</div>
                      <div className="font-medium" suppressHydrationWarning>
                        {formatMoney(plan.paid, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Falta</div>
                      <div className="font-medium" suppressHydrationWarning>
                        {formatMoney(plan.remaining, currency)}
                      </div>
                    </div>
                  </div>
                  {plan.cap != null ? (
                    <p className="text-[11px] text-muted-foreground">
                      Teto {formatMoney(plan.cap, currency)}
                      {plan.paid > plan.cap ? " · estourou" : ""}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
