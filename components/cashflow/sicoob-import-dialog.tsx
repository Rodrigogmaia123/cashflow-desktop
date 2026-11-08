"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createExpense, ensureClassifyCategory } from "@/app/app/cashflow/actions";
import { createManualIncome } from "@/app/app/cashflow/incomes/actions";
import { readSicoobPdf } from "@/app/app/cashflow/sicoob-actions";
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
import { parseDecimalToken } from "@/lib/domain/parse-statement";
import { parseBankLines } from "@/lib/domain/nubank-statement";
import { type SicoobKind, type SicoobMovement, type StatementBank } from "@/lib/domain/sicoob-statement";

type Draft = SicoobMovement & { id: string };

const fieldClass =
  "h-8 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function labelPeriod(value: string | null) {
  if (!value) return null;
  return value.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$3/$2/$1");
}

export function SicoobImportDialog({
  isAdmin,
  expenseCategories,
  incomeCategories,
  currency,
  open: openProp,
  onOpenChange
}: {
  isAdmin: boolean;
  expenseCategories: Array<{ id: string; name: string }>;
  incomeCategories: Array<{ id: string; name: string }>;
  currency: CurrencyCode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const controlled = openProp != null;
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlled ? Boolean(openProp) : innerOpen;
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<SicoobKind | null>(null);
  const [bank, setBank] = useState<StatementBank | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string | null>(null);
  const [ignored, setIgnored] = useState(0);
  const [rows, setRows] = useState<Draft[]>([]);
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const expenses = rows.filter((row) => row.direction === "expense");
  const incomes = rows.filter((row) => row.direction === "income");
  const totalOut = useMemo(
    () =>
      expenses.reduce((sum, row) => {
        const amount = parseDecimalToken(row.amount);
        return sum + (typeof amount === "number" ? amount : 0);
      }, 0),
    [expenses]
  );
  const totalIn = useMemo(
    () =>
      incomes.reduce((sum, row) => {
        const amount = parseDecimalToken(row.amount);
        return sum + (typeof amount === "number" ? amount : 0);
      }, 0),
    [incomes]
  );

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

  function reset() {
    setText("");
    setFile(null);
    setKind(null);
    setBank(null);
    setPeriodLabel(null);
    setIgnored(0);
    setRows([]);
    setExpenseCategoryId("");
    setIncomeCategoryId("");
    setError(null);
    setPending(false);
  }

  function applyParsed(parsed: ReturnType<typeof parseBankLines>) {
    if (!parsed || parsed.rows.length === 0) {
      setRows([]);
      setKind(null);
      setBank(null);
      setError(
        "Não encontrei lançamentos com data e valor. O PDF precisa ter texto selecionável."
      );
      return;
    }
    setKind(parsed.kind);
    setBank(parsed.bank);
    setPeriodLabel(parsed.periodLabel);
    setIgnored(parsed.ignored);
    setRows(parsed.rows.map((row) => ({ ...row, id: nextId() })));
    setError(null);
  }

  async function readPdf() {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      applyParsed(await readSicoobPdf(formData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao ler o PDF.");
    } finally {
      setPending(false);
    }
  }

  function readText() {
    applyParsed(parseBankLines(text));
  }

  async function save() {
    if (rows.length === 0 || pending) return;
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
    let savedExpenses = false;
    try {
      if (expenses.length > 0) {
        const categoryId = expenseCategoryId || (await ensureClassifyCategory("EXPENSE")) || "";
        const formData = new FormData();
        for (const row of expenses) {
          const amount = parseDecimalToken(row.amount);
          formData.append("date", row.date);
          formData.append("description", row.description.trim().slice(0, 140));
          formData.append("amount", typeof amount === "number" ? String(amount) : row.amount);
          formData.append("type", "VARIABLE");
          formData.append("categoryId", categoryId);
          if (kind === "card" && bank && bank !== "generic") {
            formData.append("paymentMethod", "CREDIT");
            formData.append("paymentBrand", bank);
          }
        }
        await createExpense(formData);
        savedExpenses = true;
      }
      if (incomes.length > 0) {
        const categoryId = incomeCategoryId || (await ensureClassifyCategory("INCOME")) || "";
        const formData = new FormData();
        for (const row of incomes) {
          const amount = parseDecimalToken(row.amount);
          formData.append("date", row.date);
          formData.append("description", row.description.trim().slice(0, 140));
          formData.append("amount", typeof amount === "number" ? String(amount) : row.amount);
          formData.append("categoryId", categoryId);
        }
        await createManualIncome(formData);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar o extrato.";
      setError(savedExpenses ? `${message} As saídas desse lote já foram salvas.` : message);
    } finally {
      setPending(false);
    }
  }

  if (!isAdmin) return null;

  const bankLabel =
    bank === "nubank"
      ? "Nubank"
      : bank === "itau"
        ? "Itaú"
        : bank === "bradesco"
          ? "Bradesco"
          : bank === "bb"
            ? "Banco do Brasil"
            : bank === "inter"
              ? "Inter"
              : bank === "generic"
                ? "Leitura geral"
                : bank === "sicoob"
              ? "Sicoob"
              : null;
  const kindLabel = [
    bankLabel,
    bank === "generic" ? null : kind === "card" ? "Fatura do cartão" : kind === "checking" ? "Conta corrente" : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlled ? null : (
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline">
            Importar extrato
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar extrato</DialogTitle>
          <DialogDescription>
            PDF de qualquer banco, com texto selecionável. Sicoob, Nubank, Itaú, Bradesco, Banco do Brasil e Inter seguem o modelo de cada um. Outro banco entra na leitura geral: confira saldo, sinal e pagamento da fatura na grade antes de salvar.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">PDF</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-background file:px-3 file:py-1.5 file:text-xs file:text-foreground"
              />
              <Button type="button" size="sm" onClick={readPdf} disabled={!file || pending}>
                {pending ? "Lendo..." : "Ler PDF"}
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">Ou cole o texto do extrato</label>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={6}
                className="min-h-[120px] w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="button" size="sm" variant="outline" onClick={readText} disabled={!text.trim() || pending}>
                Ler texto
              </Button>
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                {kindLabel}
                {labelPeriod(periodLabel) ? ` · ${labelPeriod(periodLabel)}` : ""} · {rows.length} lançamento
                {rows.length === 1 ? "" : "s"}
                {expenses.length > 0 ? ` · saídas ${formatMoney(totalOut, currency)}` : ""}
                {incomes.length > 0 ? ` · entradas ${formatMoney(totalIn, currency)}` : ""}
                {ignored > 0 ? ` · ${ignored} ignorado${ignored === 1 ? "" : "s"}` : ""}
              </p>
              {bank === "generic" ? (
                <p className="text-xs text-amber-200/90">
                  Banco não reconhecido. Valor sem sinal entrou como saída, e a última coluna de saldo foi deixada de fora. Apague o que não for lançamento.
                </p>
              ) : null}
              <button
                type="button"
                className="text-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setRows([]);
                  setKind(null);
                  setBank(null);
                  setError(null);
                }}
              >
                Trocar arquivo
              </button>
            </div>

            <div className="max-h-72 overflow-auto rounded-md border border-white/10">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Data</th>
                    <th className="px-2 py-2 text-left font-medium">Descrição</th>
                    <th className="px-2 py-2 text-left font-medium">Valor</th>
                    <th className="px-2 py-2 text-left font-medium">Tipo</th>
                    <th className="w-10 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          required
                          value={row.date}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((item) => (item.id === row.id ? { ...item, date: event.target.value } : item))
                            )
                          }
                          className={`${fieldClass} [color-scheme:dark]`}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={140}
                          value={row.description}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.id === row.id ? { ...item, description: event.target.value } : item
                              )
                            )
                          }
                          className={fieldClass}
                        />
                      </td>
                      <td className="w-28 px-2 py-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={row.amount}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((item) => (item.id === row.id ? { ...item, amount: event.target.value } : item))
                            )
                          }
                          className={fieldClass}
                        />
                      </td>
                      <td className="w-28 px-2 py-1.5">
                        <select
                          value={row.direction}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((item) =>
                                item.id === row.id
                                  ? { ...item, direction: event.target.value === "income" ? "income" : "expense" }
                                  : item
                              )
                            )
                          }
                          className={fieldClass}
                        >
                          <option value="expense">Saída</option>
                          <option value="income">Entrada</option>
                        </select>
                      </td>
                      <td className="px-1 py-1.5">
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

            {expenses.length > 0 ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Categoria das saídas</label>
                <select
                  value={expenseCategoryId}
                  onChange={(event) => setExpenseCategoryId(event.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">A classificar</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {incomes.length > 0 ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Categoria das entradas</label>
                <select
                  value={incomeCategoryId}
                  onChange={(event) => setIncomeCategoryId(event.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">A classificar</option>
                  {incomeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={save} disabled={pending || rows.length === 0}>
                {pending ? "Salvando..." : `Salvar ${rows.length} lançamento${rows.length === 1 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
