import { addUtcDays, utcDateFromKey, utcKey } from "@/lib/utils/date-utc";

export type ParsedStatementLine = {
  date: string;
  description: string;
  amount: string;
};

export type ParseStatementResult = {
  rows: ParsedStatementLine[];
  skipped: number;
};

const HEADER_LINE = /^(data|date)\b/i;
const MAX_ROWS = 400;

function splitCsv(line: string, sep: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === sep && !quoted) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  out.push(current.trim());
  return out;
}

function stripMoneyDecor(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(/^R\$/i, "");
}

function repairBrazilianCents(cells: string[]): string[] {
  if (cells.length < 4) return cells;
  const cents = stripMoneyDecor(cells[cells.length - 1] ?? "");
  const whole = stripMoneyDecor(cells[cells.length - 2] ?? "");
  if (!/^\d{2}$/.test(cents)) return cells;
  if (!/^-?\d{1,3}(\.\d{3})+$/.test(whole) && !/^-?\d+$/.test(whole)) return cells;
  return [...cells.slice(0, -2), `${whole},${cents}`];
}

/** Vazio, número (0 incluso) ou inválido. Aceita 42,90 e 42.90. */
export function parseDecimalToken(raw: string): number | "empty" | "invalid" {
  const trimmed = raw.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (!trimmed) return "empty";

  let body = trimmed;
  if (body.startsWith("(") && body.endsWith(")")) {
    body = body.slice(1, -1);
  }
  body = body.replace(/^-/, "").replace(/[CD]$/i, "");

  let normalized = body;
  if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(body) || /^\d+,\d{1,2}$/.test(body)) {
    normalized = body.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(body) || /^\d+\.\d{1,2}$/.test(body) || /^\d+$/.test(body)) {
    normalized = body.replace(/,/g, "");
  } else {
    return "invalid";
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return "invalid";
  return value;
}

function parseMoneyCell(raw: string): number | null {
  const value = parseDecimalToken(raw);
  if (value === "empty" || value === "invalid" || value === 0) return null;
  return value;
}

function toIso(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return utcKey(date);
}

function parseDateToken(raw: string, reference: Date): string | null {
  const text = raw.trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return toIso(Number(iso[3]), Number(iso[2]), Number(iso[1]));
  }

  const full = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (full) {
    const yearRaw = Number(full[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    return toIso(Number(full[1]), Number(full[2]), year);
  }

  const short = text.match(/^(\d{1,2})[\/.\-](\d{1,2})$/);
  if (!short) return null;

  let year = reference.getUTCFullYear();
  const isoDate = toIso(Number(short[1]), Number(short[2]), year);
  if (!isoDate) return null;

  const horizon = utcKey(addUtcDays(utcDateFromKey(utcKey(reference)), 35));
  if (isoDate > horizon) {
    return toIso(Number(short[1]), Number(short[2]), year - 1);
  }
  return isoDate;
}

function amountString(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function lineFromCells(cells: string[], reference: Date): ParsedStatementLine | null {
  const filled = cells.map((cell) => cell.trim()).filter(Boolean);
  if (filled.length < 2) return null;

  const dateIndex = filled.findIndex((cell) => parseDateToken(cell, reference));
  if (dateIndex < 0) return null;

  let amountIndex = -1;
  let amount = 0;
  for (let index = filled.length - 1; index >= 0; index -= 1) {
    if (index === dateIndex) continue;
    const parsed = parseMoneyCell(filled[index]);
    if (parsed != null) {
      amountIndex = index;
      amount = parsed;
      break;
    }
  }
  if (amountIndex < 0) return null;

  const description = filled
    .filter((_, index) => index !== dateIndex && index !== amountIndex)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  const date = parseDateToken(filled[dateIndex], reference);
  if (!date || description.length < 2) return null;

  return { date, description, amount: amountString(amount) };
}

function parseStructured(line: string, reference: Date): ParsedStatementLine | null {
  if (line.includes("\t")) {
    return lineFromCells(splitCsv(line, "\t"), reference);
  }
  if (line.includes(";")) {
    return lineFromCells(splitCsv(line, ";"), reference);
  }
  if (!line.includes(",")) return null;

  const cells = repairBrazilianCents(splitCsv(line, ","));
  if (!parseDateToken(cells[0] ?? "", reference)) return null;
  return lineFromCells(cells, reference);
}

function parseLoose(line: string, reference: Date): ParsedStatementLine | null {
  const dateMatch = line.match(
    /(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}|\d{1,2}[\/.\-]\d{1,2})/
  );
  const moneyMatch =
    line.match(/(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d+\.\d{2})\s*$/i) ??
    line.match(/(?:R\$\s*)?(-?\d+)\s*$/);
  if (!dateMatch || !moneyMatch || dateMatch.index == null || moneyMatch.index == null) {
    return null;
  }
  if (moneyMatch.index < dateMatch.index + dateMatch[0].length) return null;

  const date = parseDateToken(dateMatch[1], reference);
  const amount = parseMoneyCell(moneyMatch[0]);
  if (!date || amount == null) return null;

  const description = line
    .slice(0, moneyMatch.index)
    .replace(dateMatch[1], " ")
    .replace(/R\$/gi, " ")
    .replace(/[|;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  if (description.length < 2) return null;
  return { date, description, amount: amountString(amount) };
}

function isHeader(line: string): boolean {
  return HEADER_LINE.test(line) && /valor|amount|descri|título|titulo|title|lançamento|lancamento/i.test(line);
}

export function parseStatement(text: string, reference = new Date()): ParseStatementResult {
  const rows: ParsedStatementLine[] = [];
  let skipped = 0;
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeader(line)) continue;
    if (rows.length >= MAX_ROWS) {
      skipped += 1;
      continue;
    }

    let parsed: ParsedStatementLine | null = null;
    try {
      parsed = parseStructured(line, reference) ?? parseLoose(line, reference);
    } catch {
      parsed = null;
    }
    if (!parsed) {
      skipped += 1;
      continue;
    }
    rows.push(parsed);
  }

  return { rows, skipped };
}
