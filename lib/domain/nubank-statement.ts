import { parseBbLines } from "@/lib/domain/bb-statement";
import { parseBradescoLines } from "@/lib/domain/bradesco-statement";
import { parseGenericLines } from "@/lib/domain/generic-statement";
import { parseInterLines } from "@/lib/domain/inter-statement";
import { parseItauLines } from "@/lib/domain/itau-statement";
import { parseSicoobLines, type SicoobParseResult } from "@/lib/domain/sicoob-statement";

const MONTHS: Record<string, number> = {
  JAN: 1,
  FEV: 2,
  MAR: 3,
  ABR: 4,
  MAI: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SET: 9,
  OUT: 10,
  NOV: 11,
  DEZ: 12
};

const MONTH_PATTERN = "JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ";

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

function monthNumber(token: string): number | null {
  return MONTHS[token.toUpperCase()] ?? null;
}

function cardAmount(line: string): { rest: string; amount: number } | null {
  const match = line.match(/(-)?\s*R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/i);
  if (!match || match.index == null) return null;
  const value = Number(match[2].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return {
    rest: line.slice(0, match.index).trim(),
    amount: match[1] ? -value : value
  };
}

function plainAmount(line: string): { rest: string; amount: number } | null {
  const match = line.match(/(?:^|\s)(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/);
  if (!match || match.index == null) return null;
  const prefix = line.slice(0, match.index);
  if (/[+\-−]\s*$/.test(prefix) && !/\d[+\-−]\s*$/.test(prefix)) return null;
  const rest = prefix.trim();
  const value = Number(match[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  return { rest, amount: value };
}

function tidyParty(value: string): string {
  return value
    .replace(/\s+[-–—]\s+[•·*].*$/u, "")
    .replace(/\s+[-–—]\s+\d{2}\.\d{3}\.\d{3}.*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function checkingDescription(value: string): string {
  const text = tidyParty(value);
  const prefixes = [
    "Transferência recebida pelo Pix",
    "Transferência enviada pelo Pix",
    "Transferência Recebida",
    "Transferência recebida",
    "Pagamento de fatura",
    "Aplicação RDB"
  ];
  for (const prefix of prefixes) {
    if (text.toLowerCase().startsWith(prefix.toLowerCase())) {
      const name = text.slice(prefix.length).trim();
      return (name ? `${prefix} · ${name}` : prefix).slice(0, 140);
    }
  }
  return text.slice(0, 140);
}

function isCheckingNoise(line: string): boolean {
  const text = line.trim();
  return (
    !text ||
    /^PAGAMENTOS\b/i.test(text) ||
    /^Ag[eê]ncia\b/i.test(text) ||
    /^Conta\b/i.test(text) ||
    /^[\d.\-/]+$/.test(text) ||
    /^\d{2}\s*-\s*/.test(text) ||
    /^-\s*\d{2}\.\d{3}\.\d{3}/.test(text) ||
    /BCO\s+/i.test(text) ||
    /^Tem alguma d[uú]vida/i.test(text) ||
    /^O saldo l[ií]quido/i.test(text) ||
    /^N[aã]o nos responsabilizamos/i.test(text)
  );
}

function faturaAnchor(text: string): { month: number; year: number } | null {
  const match = text.match(new RegExp(`FATURA\\s+\\d{1,2}\\s+(${MONTH_PATTERN})\\s+(\\d{4})`, "i"));
  if (!match) return null;
  const month = monthNumber(match[1]);
  if (!month) return null;
  return { month, year: Number(match[2]) };
}

function skipCardDescription(description: string): boolean {
  return /^(Pagamentos e Financiamentos|Pagamento\b|Saldo em rotativo|Cr[eé]dito de rotativo|Encerramento de d[ií]vida)\b/i.test(
    description
  );
}

function parseNubankCard(lines: string[], full: string): SicoobParseResult | null {
  const anchor = faturaAnchor(full);
  if (!anchor) return null;
  const rows: SicoobParseResult["rows"] = [];
  let ignored = 0;

  for (const line of lines) {
    const dated = line.match(new RegExp(`^(\\d{2})\\s+(${MONTH_PATTERN})\\b\\s*(.*)$`, "i"));
    if (!dated) continue;
    const found = cardAmount(dated[3] ?? "");
    if (!found) continue;
    let description = found.rest.replace(/^[•·*\d\s]{4,}\s+/, "").replace(/^\d{4}\s+/, "").trim();
    description = description.slice(0, 140);
    if (description.length < 2 || found.amount < 0 || skipCardDescription(description)) {
      ignored += 1;
      continue;
    }
    const month = monthNumber(dated[2]);
    if (!month) continue;
    const year = month > anchor.month ? anchor.year - 1 : anchor.year;
    const date = iso(Number(dated[1]), month, year);
    if (!date) continue;
    rows.push({
      date,
      description,
      amount: formatAmount(found.amount),
      direction: "expense"
    });
  }

  if (rows.length === 0) return null;
  return {
    kind: "card",
    bank: "nubank",
    rows,
    ignored,
    periodLabel: iso(1, anchor.month, anchor.year)
  };
}

function parseNubankChecking(lines: string[]): SicoobParseResult | null {
  const rows: SicoobParseResult["rows"] = [];
  let ignored = 0;
  let started = false;
  let currentDate: string | null = null;
  let direction: "income" | "expense" | null = null;

  for (const line of lines) {
    if (/^Movimenta[cç][oõ]es\b/i.test(line)) {
      started = true;
      continue;
    }
    if (!started || isCheckingNoise(line)) continue;

    const dated = line.match(new RegExp(`^(\\d{2})\\s+(${MONTH_PATTERN})\\s+(\\d{4})\\b\\s*(.*)$`, "i"));
    const body = dated ? (dated[4] ?? "").trim() : line;
    if (dated) {
      const month = monthNumber(dated[2]);
      currentDate = month ? iso(Number(dated[1]), month, Number(dated[3])) : null;
    }

    if (/Total de entradas/i.test(body)) {
      direction = "income";
      continue;
    }
    if (/Total de sa[ií]das/i.test(body)) {
      direction = "expense";
      continue;
    }

    const found = plainAmount(body);
    if (!found || !currentDate || !direction) {
      if (found) ignored += 1;
      continue;
    }
    const description = checkingDescription(found.rest);
    if (description.length < 2) {
      ignored += 1;
      continue;
    }
    rows.push({
      date: currentDate,
      description,
      amount: formatAmount(found.amount),
      direction
    });
  }

  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.date).sort();
  return {
    kind: "checking",
    bank: "nubank",
    rows,
    ignored,
    periodLabel: dates.length ? `${dates[0]} – ${dates[dates.length - 1]}` : null
  };
}

export function parseBankLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const full = lines.join("\n");
  const bb = parseBbLines(lines);
  if (bb) return bb;
  const bradesco = parseBradescoLines(lines);
  if (bradesco) return bradesco;
  const inter = parseInterLines(lines);
  if (inter) return inter;
  const itau = parseItauLines(lines);
  if (itau) return itau;

  if (/Movimenta[cç][oõ]es/i.test(full) && /Total de entradas/i.test(full)) {
    return parseNubankChecking(lines);
  }
  if (/TRANSA[CÇ][OÕ]ES/i.test(full) && /FATURA/i.test(full)) {
    return parseNubankCard(lines, full);
  }
  return parseSicoobLines(lines) ?? parseGenericLines(lines);
}
