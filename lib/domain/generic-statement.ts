import type { SicoobMovement, SicoobParseResult } from "@/lib/domain/sicoob-statement";

const MONTHS: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12
};

const MAX_ROWS = 400;

function fold(value: string): string {
  return value
    .toLowerCase()
    .replace(/[áàâã]/g, "a")
    .replace(/[éê]/g, "e")
    .replace(/[íî]/g, "i")
    .replace(/[óôõ]/g, "o")
    .replace(/[úü]/g, "u")
    .replace(/ç/g, "c");
}

function iso(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function formatAmount(value: number): string {
  return Math.abs(value).toFixed(2).replace(".", ",");
}

function fullYear(year: number): number {
  if (year >= 100) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function yearFor(month: number, anchorMonth: number, anchorYear: number): number {
  return month > anchorMonth ? anchorYear - 1 : anchorYear;
}

function monthNumber(token: string): number | null {
  return MONTHS[fold(token)] ?? null;
}

function anchorFrom(full: string): { month: number; year: number } {
  const period = full.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(?:a|at[eé]|-|–)\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (period) return { month: Number(period[5]), year: Number(period[6]) };
  const due = full.match(/vencimento[:\s]+(\d{2})\/(\d{2})\/(\d{4})/i);
  if (due) return { month: Number(due[2]), year: Number(due[3]) };
  const now = new Date();
  return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
}

function dateFromParts(
  day: number,
  month: number,
  explicitYear: number | null,
  anchor: { month: number; year: number }
): string | null {
  const year = explicitYear != null ? fullYear(explicitYear) : yearFor(month, anchor.month, anchor.year);
  return iso(day, month, year);
}

function matchDate(
  line: string,
  anchor: { month: number; year: number }
): { date: string; rest: string } | null {
  const numeric = line.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?(?!\/)\b\s*(.*)$/);
  if (numeric) {
    const date = dateFromParts(Number(numeric[1]), Number(numeric[2]), numeric[3] ? Number(numeric[3]) : null, anchor);
    return date ? { date, rest: (numeric[4] ?? "").trim() } : null;
  }
  const written = line.match(/^(\d{1,2}) de ([A-Za-zçÇáàâãéêíóôõú]+) de (\d{4})\b\s*(.*)$/i);
  if (written) {
    const month = monthNumber(written[2]);
    const date = month ? iso(Number(written[1]), month, Number(written[3])) : null;
    return date ? { date, rest: (written[4] ?? "").trim() } : null;
  }
  const shortMonth = line.match(
    /^(\d{1,2})\s+(jan(?:eiro)?|fev(?:ereiro)?|mar(?:co)?|abr(?:il)?|mai(?:o)?|jun(?:ho)?|jul(?:ho)?|ago(?:sto)?|set(?:embro)?|out(?:ubro)?|nov(?:embro)?|dez(?:embro)?)\b(?:\s+(\d{4}))?\s*(.*)$/i
  );
  if (shortMonth) {
    const month = monthNumber(shortMonth[2]);
    const date = month
      ? dateFromParts(Number(shortMonth[1]), month, shortMonth[3] ? Number(shortMonth[3]) : null, anchor)
      : null;
    return date ? { date, rest: (shortMonth[4] ?? "").trim() } : null;
  }
  return null;
}

type FoundAmount = { value: number; direction: "expense" | "income"; signed: boolean };

function trailingAmounts(text: string): { rest: string; amounts: FoundAmount[] } {
  const amounts: FoundAmount[] = [];
  let rest = text.trim();
  while (amounts.length < 2) {
    const match = rest.match(/([+\-−])?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD])?\s*$/i);
    if (!match || match.index == null) break;
    const value = Number(match[2].replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(value)) break;
    const mark = (match[3] ?? "").toUpperCase();
    const sign = match[1] ?? "";
    const income = mark === "C" || sign === "+";
    const expense = mark === "D" || sign === "-" || sign === "−";
    amounts.unshift({
      value,
      direction: income && !expense ? "income" : "expense",
      signed: income || expense
    });
    rest = rest.slice(0, match.index).trim();
  }
  return { rest, amounts };
}

function isSkipped(line: string): boolean {
  const text = fold(line);
  if (/^https?:/.test(text) || /^\d+\s*\/\s*\d+$/.test(text)) return true;
  if (/saldo anterior|saldo do dia|saldo inicial|saldo final|saldo bloqueado|saldo disponivel|saldo total|saldo por transa/.test(text)) {
    return true;
  }
  if (/^(total|subtotal|resumo|limite|vencimento|taxa |custo |valor total|valor liberado|pagina |folha )\b/.test(text)) {
    return true;
  }
  return /^(data|date)\b/.test(text) && /valor|historico|descri|lancamento/.test(text);
}

function cleanDescription(rest: string, hadBalance: boolean): string {
  const withoutDoc = hadBalance ? rest.replace(/\s+\d{4,12}$/, "") : rest;
  return withoutDoc.replace(/\s+/g, " ").replace(/^[-–—:]+/, "").trim().slice(0, 140);
}

export function parseGenericLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const anchor = anchorFrom(lines.join("\n"));
  const rows: SicoobMovement[] = [];
  let ignored = 0;
  let carriedDate: string | null = null;

  for (const line of lines) {
    if (isSkipped(line)) continue;
    if (rows.length >= MAX_ROWS) {
      ignored += 1;
      continue;
    }

    const dated = matchDate(line, anchor);
    const body = dated ? dated.rest : line;
    if (dated && !body) {
      carriedDate = dated.date;
      continue;
    }

    const found = trailingAmounts(body);
    if (found.amounts.length === 0) {
      const extra = body.replace(/\s+/g, " ").trim();
      const last = rows[rows.length - 1];
      if (last && !dated && extra.length >= 2 && extra.length <= 80) {
        last.description = `${last.description} ${extra}`.replace(/\s+/g, " ").trim().slice(0, 140);
      }
      continue;
    }

    const amount = found.amounts[0];
    const date = dated?.date ?? carriedDate;
    const description = cleanDescription(found.rest, found.amounts.length > 1);
    if (!date || amount.value === 0 || description.length < 2 || isSkipped(description)) {
      ignored += 1;
      continue;
    }
    if (dated) carriedDate = dated.date;
    rows.push({
      date,
      description,
      amount: formatAmount(amount.value),
      direction: amount.signed ? amount.direction : "expense"
    });
  }

  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.date).sort();
  return {
    kind: "checking",
    bank: "generic",
    rows,
    ignored,
    periodLabel: `${dates[0]} – ${dates[dates.length - 1]}`
  };
}
