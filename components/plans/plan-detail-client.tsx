"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
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
import { remainingOf, summarizePlanItems } from "@/lib/domain/spend-plan";
import { todayUtcKey } from "@/lib/utils/date-utc";
import {
  createSpendPlanGroup,
  createSpendPlanItem,
  deleteSpendPlan,
  deleteSpendPlanGroup,
  deleteSpendPlanItem,
  paySpendPlanItem,
  skipSpendPlanItem,
  toggleSpendPlanStatus,
  updateSpendPlan,
  updateSpendPlanGroup,
  updateSpendPlanItem
} from "@/app/app/plans/actions";

const fieldClass =
  "h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

export type PlanCategoryOption = { id: string; name: string };

export type PlanEntryView = {
  id: string;
  amount: number;
  note: string | null;
  date: string;
};

export type PlanItemView = {
  id: string;
  description: string;
  plannedAmount: number;
  paidAmount: number;
  skipped: boolean;
  repeatable: boolean;
  categoryId: string | null;
  categoryName: string | null;
  entries: PlanEntryView[];
};

export type PlanGroupView = {
  id: string;
  name: string;
  items: PlanItemView[];
};

export type PlanDetailView = {
  id: string;
  name: string;
  notes: string | null;
  cap: number | null;
  status: string;
  groups: PlanGroupView[];
  totals: {
    planned: number;
    paid: number;
    difference: number;
    remaining: number;
  };
};

function collapsedStorageKey(planId: string) {
  return `cashflowpro:spend-plan:collapsed:${planId}`;
}

function readCollapsed(planId: string): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(collapsedStorageKey(planId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function useCollapsedGroups(planId: string) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useLayoutEffect(() => {
    setCollapsed(readCollapsed(planId));
  }, [planId]);

  function toggle(groupId: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        window.localStorage.setItem(collapsedStorageKey(planId), JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return { collapsed, toggle };
}

export function PlanDetailClient({
  plan,
  isAdmin,
  currency,
  categories
}: {
  plan: PlanDetailView;
  isAdmin: boolean;
  currency: CurrencyCode;
  categories: PlanCategoryOption[];
}) {
  const overCap = plan.cap != null && plan.totals.paid > plan.cap;
  const { collapsed, toggle } = useCollapsedGroups(plan.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/app/plans" className="text-xs text-muted-foreground hover:text-foreground">
            ← Projetos
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{plan.name}</h1>
          <p className="text-sm text-muted-foreground">
            Planejado não conta no caixa. Pago vira despesa de verdade, como sempre.
          </p>
          {plan.notes ? (
            <p className="text-xs text-muted-foreground">{plan.notes}</p>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <EditPlanDialog plan={plan} />
            <form action={toggleSpendPlanStatus}>
              <input type="hidden" name="id" value={plan.id} />
              <Button type="submit" size="sm" variant="outline">
                {plan.status === "OPEN" ? "Encerrar" : "Reabrir"}
              </Button>
            </form>
            <form
              action={deleteSpendPlan}
              onSubmit={(event) => {
                if (!confirm("Apagar o projeto? Despesas já lançadas no caixa permanecem.")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={plan.id} />
              <Button type="submit" size="sm" variant="ghost">
                Apagar
              </Button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Planejado" value={formatMoney(plan.totals.planned, currency)} />
        <Kpi label="Pago (no caixa)" value={formatMoney(plan.totals.paid, currency)} />
        <Kpi
          label="Diferença"
          value={formatMoney(plan.totals.difference, currency)}
          hint={
            plan.totals.difference < 0
              ? "Abaixo do plano"
              : plan.totals.difference > 0
                ? "Acima do plano"
                : "No plano"
          }
        />
        <Kpi
          label="Ainda falta pagar"
          value={formatMoney(plan.totals.remaining, currency)}
          hint={
            plan.cap != null
              ? `Teto ${formatMoney(plan.cap, currency)}${overCap ? " · estourou" : ""}`
              : undefined
          }
        />
      </div>

      {plan.groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          collapsed={Boolean(collapsed[group.id])}
          onToggle={() => toggle(group.id)}
          isAdmin={isAdmin}
          planOpen={plan.status === "OPEN"}
          currency={currency}
          categories={categories}
        />
      ))}

      {isAdmin && plan.status === "OPEN" ? <AddGroupDialog planId={plan.id} /> : null}
    </div>
  );
}

function GroupCard({
  group,
  collapsed,
  onToggle,
  isAdmin,
  planOpen,
  currency,
  categories
}: {
  group: PlanGroupView;
  collapsed: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  planOpen: boolean;
  currency: CurrencyCode;
  categories: PlanCategoryOption[];
}) {
  const totals = summarizePlanItems(
    group.items.map((item) => ({
      plannedAmount: item.plannedAmount,
      paidAmount: item.paidAmount,
      skipped: item.skipped,
      repeatable: item.repeatable
    }))
  );

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left hover:opacity-90"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{group.name}</span>
              <span className="block text-xs text-muted-foreground">
                Pago {formatMoney(totals.paid, currency)} · Plano{" "}
                {formatMoney(totals.planned, currency)}
                {totals.remaining > 0
                  ? ` · falta ${formatMoney(totals.remaining, currency)}`
                  : ""}
              </span>
            </span>
          </button>
          {isAdmin ? (
            <div className="flex flex-wrap gap-1">
              <EditGroupDialog group={group} />
              <form
                action={deleteSpendPlanGroup}
                onSubmit={(event) => {
                  if (!confirm("Apagar este bloco e os itens não pagos?")) event.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={group.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Apagar bloco
                </Button>
              </form>
            </div>
          ) : null}
        </div>
        {collapsed ? null : (
          <>
            {group.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum item neste bloco.</p>
            ) : (
              <div className="divide-y divide-white/5 rounded-md border border-white/5">
                {group.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    planOpen={planOpen}
                    currency={currency}
                    categories={categories}
                  />
                ))}
              </div>
            )}
            {isAdmin && planOpen ? (
              <AddItemDialog groupId={group.id} categories={categories} />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 pt-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold" suppressHydrationWarning>
          {value}
        </div>
        {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

function ItemRow({
  item,
  isAdmin,
  planOpen,
  currency,
  categories
}: {
  item: PlanItemView;
  isAdmin: boolean;
  planOpen: boolean;
  currency: CurrencyCode;
  categories: PlanCategoryOption[];
}) {
  const remaining = remainingOf(item);
  const delta = item.paidAmount - item.plannedAmount;
  const canPay = isAdmin && planOpen && !item.skipped && (item.repeatable || item.paidAmount === 0);
  const canSkipOrDelete = isAdmin && item.paidAmount === 0;

  return (
    <div className="space-y-2 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium">
            {item.description}
            {item.skipped ? (
              <span className="ml-2 text-[10px] uppercase text-muted-foreground">Pulado</span>
            ) : null}
            {item.repeatable ? (
              <span className="ml-2 text-[10px] uppercase text-sky-400">Vários gastos</span>
            ) : null}
            {!item.repeatable && item.paidAmount > 0 ? (
              <span className="ml-2 text-[10px] uppercase text-emerald-400">No caixa</span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Plano {formatMoney(item.plannedAmount, currency)}
            {item.paidAmount > 0
              ? ` · pago ${formatMoney(item.paidAmount, currency)}${
                  item.entries.length > 1 ? ` (${item.entries.length} gastos)` : ""
                }`
              : ""}
            {item.paidAmount > 0 && delta !== 0
              ? ` · dif. ${delta < 0 ? "" : "+"}${formatMoney(delta, currency)}`
              : ""}
            {item.repeatable && remaining > 0
              ? ` · falta ${formatMoney(remaining, currency)}`
              : ""}
            {item.categoryName ? ` · ${item.categoryName}` : ""}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-1">
            {canPay ? <PayDialog item={item} currency={currency} remaining={remaining} /> : null}
            <EditItemDialog item={item} categories={categories} />
            {canSkipOrDelete ? (
              <form action={skipSpendPlanItem}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" size="sm" variant="ghost">
                  {item.skipped ? "Desfazer pulo" : "Não fiz"}
                </Button>
              </form>
            ) : null}
            {canSkipOrDelete ? (
              <form
                action={deleteSpendPlanItem}
                onSubmit={(event) => {
                  if (!confirm("Apagar este item do plano?")) event.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" size="sm" variant="ghost">
                  Apagar
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
      {item.entries.length > 0 ? (
        <ul className="space-y-1 rounded-md bg-white/[0.03] px-2 py-1.5 text-xs text-muted-foreground">
          {item.entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap justify-between gap-2">
              <span>
                {formatEntryDate(entry.date)}
                {entry.note ? ` · ${entry.note}` : ""}
              </span>
              <span className="text-foreground/80">{formatMoney(entry.amount, currency)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function formatEntryDate(isoDay: string) {
  const [year, month, day] = isoDay.split("-").map(Number);
  if (!year || !month || !day) return isoDay;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function RepeatableField({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        name="repeatable"
        value="true"
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <span>
        <span className="font-medium">Vários gastos neste item</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          Hotel é um pagamento. Lembrancinha, comida e táxi podem ter vários durante a viagem.
        </span>
      </span>
    </label>
  );
}

function EditPlanDialog({ plan }: { plan: PlanDetailView }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
          <DialogDescription>Não altera despesas já lançadas.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await updateSpendPlan(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={plan.id} />
          <input name="name" required defaultValue={plan.name} className={fieldClass} />
          <input
            name="cap"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={plan.cap ?? ""}
            placeholder="Teto opcional"
            className={fieldClass}
          />
          <input
            name="notes"
            defaultValue={plan.notes ?? ""}
            placeholder="Notas"
            className={fieldClass}
          />
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

function EditGroupDialog({ group }: { group: PlanGroupView }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar bloco</DialogTitle>
          <DialogDescription>Só o nome. Itens e gastos ficam iguais.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await updateSpendPlanGroup(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={group.id} />
          <input name="name" required minLength={2} defaultValue={group.name} className={fieldClass} />
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

function AddGroupDialog({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Novo bloco
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo bloco</DialogTitle>
          <DialogDescription>Ex: Gramado, hidráulica, entrada do carro.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createSpendPlanGroup(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="planId" value={planId} />
          <input name="name" required minLength={2} className={fieldClass} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Adicionar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddItemDialog({
  groupId,
  categories
}: {
  groupId: string;
  categories: PlanCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          Novo item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Item planejado</DialogTitle>
          <DialogDescription>Ainda não sai do caixa.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await createSpendPlanItem(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="groupId" value={groupId} />
          <input
            name="description"
            required
            minLength={2}
            placeholder="Hotel, porcelanato, seguro..."
            className={fieldClass}
          />
          <input
            name="plannedAmount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Quanto posso gastar"
            className={fieldClass}
          />
          <select name="categoryId" defaultValue="" className={fieldClass}>
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <RepeatableField />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Incluir no plano</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditItemDialog({
  item,
  categories
}: {
  item: PlanItemView;
  categories: PlanCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription>
            Gastos já lançados no caixa não mudam. Só o plano deste item.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await updateSpendPlanItem(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={item.id} />
          <input
            name="description"
            required
            minLength={2}
            defaultValue={item.description}
            className={fieldClass}
          />
          <input
            name="plannedAmount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={item.plannedAmount}
            className={fieldClass}
          />
          <select name="categoryId" defaultValue={item.categoryId ?? ""} className={fieldClass}>
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <RepeatableField defaultChecked={item.repeatable} />
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

function PayDialog({
  item,
  currency,
  remaining
}: {
  item: PlanItemView;
  currency: CurrencyCode;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const defaultAmount = item.repeatable
    ? remaining > 0
      ? remaining
      : undefined
    : item.plannedAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {item.repeatable ? "Anotar gasto" : "Registrar pagamento"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.repeatable ? "Anotar gasto" : "Registrar pagamento"}</DialogTitle>
          <DialogDescription>
            {item.repeatable
              ? `Cria uma despesa no caixa neste item. Plano ${formatMoney(item.plannedAmount, currency)} · já pago ${formatMoney(item.paidAmount, currency)}.`
              : `Isso cria a despesa no fluxo de caixa. Planejado: ${formatMoney(item.plannedAmount, currency)}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            await paySpendPlanItem(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={item.id} />
          {item.repeatable ? (
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Detalhe (opcional)
              </label>
              <input
                name="note"
                placeholder="ex: loja da rua X"
                className={fieldClass}
              />
            </div>
          ) : null}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Valor pago</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={defaultAmount}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={todayUtcKey()}
              className={fieldClass}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Lançar no caixa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
