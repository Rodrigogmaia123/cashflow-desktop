import type { SicoobParseResult } from "@/lib/domain/sicoob-statement";

const MONEY = /-?\d{1,3}(?:\.\d{3})*,\d{2}/;

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

function parseMoney(token: string): number | null {
  const negative = token.startsWith("-");
  const value = Number(token.replace(/^-/, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

function trailingMoney(text: string, limit: number): { rest: string; amounts: number[] } {
  const amounts: number[] = [];
  let rest = text.trim();
  while (amounts.length < limit) {
    const match = rest.match(new RegExp(`(${MONEY.source})\\s*$`));
    if (!match || match.index == null) break;
    const value = parseMoney(match[1]);
    if (value == null) break;
    amounts.unshift(value);
    rest = rest.slice(0, match.index).trim();
  }
  return { rest, amounts };
}

function isItauChecking(full: string): boolean {
  return (
    /extrato\s+de\s+conta\s+corrente/i.test(full) ||
    (/SALDO ANTERIOR/i.test(full) && /Ag\/Origem|Saldo\s*\(R\$\)/i.test(full))
  );
}

function isItauCard(full: string): boolean {
  return /ITAUCARD|ITAU\s*CARD|Meu cart[aã]o/i.test(full) && /vencimento/i.test(full);
}

function dueAnchor(full: string): { month: number; year: number } | null {
  const match = full.match(/vencimento[\s\S]{0,180}?(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!match) return null;
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

function statementAnchor(full: string): { month: number; year: number } | null {
  const match = full.match(/Data do extrato:\s*(\d{2})\/(\d{2})\/(\d{2,4})/i);
  if (!match) return null;
  const month = Number(match[2]);
  const year = fullYear(Number(match[3]));
  if (month < 1 || month > 12) return null;
  return { month, year };
}

function skipCardDescription(description: string): boolean {
  return /^(PAGAMENTO\b|Total\b|Cr[eé]dito do cart[aã]o|D[eé]bito do cart[aã]o|Lan[cç]amentos\b)/i.test(description);
}

function parseItauCard(lines: string[], full: string): SicoobParseResult | null {
  const anchor = dueAnchor(full);
  if (!anchor) return null;
  const rows: SicoobParseResult["rows"] = [];
  let ignored = 0;

  for (const line of lines) {
    const dated = line.match(/^(\d{2})\/(\d{2})(?!\/)\s+(.*)$/);
    if (!dated) continue;
    const found = trailingMoney(dated[3] ?? "", 1);
    if (found.amounts.length === 0) continue;
    const amount = found.amounts[0];
    const description = found.rest.replace(/\s+/g, " ").trim().slice(0, 140);
    if (description.length < 2 || amount <= 0 || skipCardDescription(description)) {
      ignored += 1;
      continue;
    }
    const month = Number(dated[2]);
    const date = iso(Number(dated[1]), month, yearFor(month, anchor.month, anchor.year));
    if (!date) continue;
    rows.push({ date, description, amount: formatAmount(amount), direction: "expense" });
  }

  if (rows.length === 0) return null;
  return {
    kind: "card",
    bank: "itau",
    rows,
    ignored,
    periodLabel: iso(1, anchor.month, anchor.year)
  };
}

function skipCheckingDescription(description: string): boolean {
  return /^SALDO\b/i.test(description);
}

function parseItauChecking(lines: string[], full: string): SicoobParseResult | null {
  const anchor = statementAnchor(full) ?? { month: new Date().getUTCMonth() + 1, year: new Date().getUTCFullYear() };
  const rows: SicoobParseResult["rows"] = [];
  let ignored = 0;

  for (const line of lines) {
    const dated = line.match(/^(\d{2})\/(\d{2})(?!\/)(?:\/(\d{2,4}))?\s+(.*)$/);
    if (!dated) continue;
    const found = trailingMoney(dated[4] ?? "", 2);
    if (found.amounts.length === 0) continue;
    const amount = found.amounts[0];
    const description = found.rest.replace(/\s+\d{3,5}$/, "").replace(/\s+/g, " ").trim().slice(0, 140);
    if (description.length < 2 || amount === 0 || skipCheckingDescription(description)) {
      ignored += 1;
      continue;
    }
    const month = Number(dated[2]);
    const explicitYear = dated[3] ? fullYear(Number(dated[3])) : null;
    const date = iso(Number(dated[1]), month, explicitYear ?? yearFor(month, anchor.month, anchor.year));
    if (!date) continue;
    rows.push({
      date,
      description,
      amount: formatAmount(amount),
      direction: amount < 0 ? "expense" : "income"
    });
  }

  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.date).sort();
  return {
    kind: "checking",
    bank: "itau",
    rows,
    ignored,
    periodLabel: `${dates[0]} – ${dates[dates.length - 1]}`
  };
}

export function parseItauLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const full = lines.join("\n");
  if (isItauChecking(full)) return parseItauChecking(lines, full);
  if (isItauCard(full)) return parseItauCard(lines, full);
  return null;
}
