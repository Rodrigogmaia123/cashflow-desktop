"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createExpense, ensureClassifyCategory } from "@/app/app/cashflow/actions";
import { createManualIncome } from "@/app/app/cashflow/incomes/actions";
import { PaymentFields } from "@/components/cashflow/payment-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { formatMoney, type CurrencyCode } from "@/lib/domain/currency";
import { parseDecimalToken, parseStatement, type ParsedStatementLine } from "@/lib/domain/parse-statement";

type DraftLine = ParsedStatementLine & { id: string };

const fieldClass =
  "h-8 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PasteStatementDialog({
  isAdmin,
  categories,
  currency,
  kind = "expense",
  open: openProp,
  onOpenChange
}: {
  isAdmin: boolean;
  categories: Array<{ id: string; name: string }>;
  currency: CurrencyCode;
  kind?: "expense" | "income";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const controlled = openProp != null;
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlled ? Boolean(openProp) : innerOpen;
  const [text, setText] = useState("");
  const [rows, setRows] = useState<DraftLine[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const total = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const amount = parseDecimalToken(row.amount);
        return sum + (typeof amount === "number" ? amount : 0);
      }, 0),
    [rows]
  );

  function reset() {
    setText("");
    setRows([]);
    setSkipped(0);
    setCategoryId("");
    setError(null);
    setPending(false);
  }

  function setOpen(next: boolean) {
    if (!controlled) setInnerOpen(next);
    onOpenChange?.(next);
    if (next) reset();
  }

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) reset();
    wasOpen.current = open;
  }, [open]);

  function buildGrid() {
    const parsed = parseStatement(text);
    setSkipped(parsed.skipped);
    setError(null);
    if (parsed.rows.length === 0) {
      setRows([]);
      setError("Não reconheci lançamentos. Cada linha precisa de data, descrição e valor.");
      return;
    }
    setRows(parsed.rows.map((row) => ({ ...row, id: nextId() })));
  }

  function updateRow(id: string, patch: Partial<DraftLine>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rows.length === 0 || pending) return;

    const current = new FormData(event.currentTarget);
    const paymentMethod = kind === "expense" ? String(current.get("paymentMethod") ?? "") : "";
    const paymentBrand = kind === "expense" ? String(current.get("paymentBrand") ?? "") : "";

    for (const [index, row] of rows.entries()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        setError(`Data inválida na linha ${index + 1}.`);
        return;
      }
      if (row.description.trim().length < 2) {
        setError(`Descrição curta demais na linha ${index + 1}.`);
        return;
      }
      const amount = parseDecimalToken(row.amount);
      if (amount === "empty" || amount === "invalid" || amount <= 0) {
        setError(`Valor inválido na linha ${index + 1}.`);
        return;
      }
    }

    setPending(true);
    setError(null);
    try {
      const resolvedCategory = categoryId || (await ensureClassifyCategory(kind === "income" ? "INCOME" : "EXPENSE")) || "";
      const formData = new FormData();
      for (const row of rows) {
        const amount = parseDecimalToken(row.amount);
        formData.append("date", row.date);
        formData.append("description", row.description.trim().slice(0, 140));
        formData.append("amount", typeof amount === "number" ? String(amount) : row.amount);
        formData.append("categoryId", resolvedCategory);
        if (kind === "expense") {
          formData.append("type", "VARIABLE");
          formData.append("paymentMethod", paymentMethod);
          formData.append("paymentBrand", paymentBrand);
        }
      }
      if (kind === "income") await createManualIncome(formData);
      else await createExpense(formData);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : kind === "income" ? "Falha ao salvar as entradas." : "Falha ao salvar a fatura.");
    } finally {
      setPending(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlled ? null : (
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            {kind === "income" ? "Colar entradas" : "Colar fatura"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{kind === "income" ? "Colar entradas" : "Colar fatura"}</DialogTitle>
          <DialogDescription>
            {kind === "income"
              ? "Cole do banco ou da planilha. Cada linha com data, descrição e valor vira uma entrada. A categoria vale para o lote. Sem categoria, entra em A classificar."
              : "Cole do banco ou da planilha. Cada linha com data, descrição e valor vira um lançamento. Cartão e categoria valem para o lote. Sem categoria, entra em A classificar."}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={8}
              placeholder={
                kind === "income"
                  ? "02/09/2026\tSalário\t4500,00\n15/09/2026;Freela;800,00\n2026-09-20  Pix cliente  350,00"
                  : "12/09/2026\tiFood\t42,90\n13/09/2026;Uber;18,50\n2026-09-14  Farmácia  27,30"
              }
              className="min-h-[160px] w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="button" size="sm" onClick={buildGrid} disabled={!text.trim()}>
              Montar grade
            </Button>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                {rows.length} lançamento{rows.length === 1 ? "" : "s"} · {formatMoney(total, currency)}
                {skipped > 0 ? ` · ${skipped} linha${skipped === 1 ? "" : "s"} ignorada${skipped === 1 ? "" : "s"}` : ""}
              </p>
              <button
                type="button"
                className="text-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setRows([]);
                  setError(null);
                }}
              >
                Voltar ao texto
              </button>
            </div>

            <div className="max-h-72 overflow-auto rounded-md border border-white/10">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Data</th>
                    <th className="px-2 py-2 text-left font-medium">Descrição</th>
                    <th className="px-2 py-2 text-left font-medium">Valor</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="px-2 py-1.5 align-middle">
                        <input
                          type="date"
                          required
                          value={row.date}
                          onChange={(event) => updateRow(row.id, { date: event.target.value })}
                          className={`${fieldClass} [color-scheme:dark]`}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-middle">
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={140}
                          value={row.description}
                          onChange={(event) => updateRow(row.id, { description: event.target.value })}
                          className={fieldClass}
                        />
                      </td>
                      <td className="w-28 px-2 py-1.5 align-middle">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={row.amount}
                          onChange={(event) => updateRow(row.id, { amount: event.target.value })}
                          className={fieldClass}
                        />
                      </td>
                      <td className="px-1 py-1.5 align-middle">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 px-0"
                          onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                          aria-label="Remover linha"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Categoria do lote</label>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">A classificar</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {kind === "expense" ? <PaymentFields remember /> : null}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || rows.length === 0}>
                {pending ? "Salvando..." : `Salvar ${rows.length} lançamento${rows.length === 1 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
