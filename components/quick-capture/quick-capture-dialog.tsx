"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { usePersonalEdition } from "@/components/desktop/edition-provider";
import { createDailyPerformance, getYesterdayPerformance } from "@/app/app/offers/[offerId]/actions";
import { createExpense } from "@/app/app/cashflow/actions";
import {
  listQuickCaptureExpenseCategories,
  listQuickCaptureOffers
} from "@/app/app/quick-capture/actions";
import { PaymentFields } from "@/components/cashflow/payment-fields";
import { todayUtcKey } from "@/lib/utils/date-utc";

const LAST_OFFER_KEY = "cashflow.quick-capture.offerId";

type OfferOption = {
  id: string;
  name: string;
  currency: string;
  status: string;
};

type CategoryOption = { id: string; name: string };

export function QuickCaptureDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const personal = usePersonalEdition();
  const router = useRouter();
  const [mode, setMode] = useState<"offer" | "expense">(personal ? "expense" : "offer");
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [offerId, setOfferId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const investmentRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [investment, setInvestment] = useState("");
  const [revenue, setRevenue] = useState("");
  const [sales, setSales] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setInvestment("");
    setRevenue("");
    setSales("");
    setMode(personal ? "expense" : "offer");
    listQuickCaptureExpenseCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    if (!personal) {
      listQuickCaptureOffers()
        .then((rows) => {
          setOffers(rows);
          const stored = window.localStorage.getItem(LAST_OFFER_KEY);
          const next =
            rows.find((o) => o.id === stored)?.id ??
            rows.find((o) => o.status === "ACTIVE")?.id ??
            rows[0]?.id ??
            "";
          setOfferId(next);
        })
        .catch(() => setOffers([]));
    }
  }, [open, personal]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      if (mode === "offer") investmentRef.current?.focus();
      else amountRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, mode]);

  const selectedOffer = offers.find((o) => o.id === offerId);
  const today = todayUtcKey();

  function submitOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createDailyPerformance(formData);
        if (offerId) window.localStorage.setItem(LAST_OFFER_KEY, offerId);
        setInvestment("");
        setRevenue("");
        setSales("");
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao lançar.");
      }
    });
  }

  function submitExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createExpense(formData);
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao lançar despesa.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Captura rápida</DialogTitle>
          <DialogDescription>
            Três números e Enter. Continua sendo o mesmo lançamento de sempre.
          </DialogDescription>
        </DialogHeader>

        {!personal && (
          <div className="flex gap-1 rounded-md bg-white/5 p-1 text-xs">
            <button
              type="button"
              className={`flex-1 rounded px-2 py-1.5 ${mode === "offer" ? "bg-background text-foreground" : "text-muted-foreground"}`}
              onClick={() => setMode("offer")}
            >
              Oferta
            </button>
            <button
              type="button"
              className={`flex-1 rounded px-2 py-1.5 ${mode === "expense" ? "bg-background text-foreground" : "text-muted-foreground"}`}
              onClick={() => setMode("expense")}
            >
              Despesa
            </button>
          </div>
        )}

        {mode === "offer" && !personal ? (
          <form onSubmit={submitOffer} className="space-y-3">
            <input type="hidden" name="date" value={today} />
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Oferta</label>
              <select
                name="offerId"
                required
                value={offerId || ""}
                onChange={(e) => setOfferId(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">{offers.length === 0 ? "Nenhuma oferta" : "Escolha a oferta"}</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Gasto {selectedOffer ? `(${selectedOffer.currency})` : ""}
                </label>
                <input
                  ref={investmentRef}
                  name="investment"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={investment}
                  onChange={(e) => setInvestment(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Fat.</label>
                <input
                  name="revenue"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Vendas</label>
                <input
                  name="sales"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={sales}
                  onChange={(e) => setSales(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!offerId || pending}
                onClick={() => {
                  if (!offerId) return;
                  startTransition(async () => {
                    try {
                      const yesterday = await getYesterdayPerformance(offerId);
                      if (!yesterday) {
                        setError("Não há lançamento ontem nesta oferta.");
                        return;
                      }
                      setInvestment(String(yesterday.investment ?? ""));
                      setRevenue(String(yesterday.revenue ?? ""));
                      setSales(String(yesterday.sales ?? ""));
                      setError(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Falha ao copiar ontem.");
                    }
                  });
                }}
              >
                Duplicar ontem
              </Button>
              <Button type="submit" size="sm" disabled={pending || !offerId}>
                {pending ? "Salvando..." : "Registrar hoje"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={submitExpense} className="space-y-3">
            <input type="hidden" name="date" value={today} />
            <input type="hidden" name="type" value="VARIABLE" />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Valor</label>
                <input
                  ref={amountRef}
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
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
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Descrição</label>
              <input
                name="description"
                type="text"
                required
                minLength={2}
                placeholder="O que saiu hoje"
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <PaymentFields compact />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Salvando..." : "Registrar despesa"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
