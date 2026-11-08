import type { SicoobMovement, SicoobParseResult } from "@/lib/domain/sicoob-statement";

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

function isBradescoChecking(full: string): boolean {
  return /Movimenta[cç][oõ]es entre:/i.test(full) && /D[eé]bito\s*\(R\$\)|Cr[eé]dito\s*\(R\$\)/i.test(full);
}

function isBradescoCard(full: string): boolean {
  return /Bradesco Cart[oõ]es|Situa[cç][aã]o do Extrato/i.test(full);
}

function cardAnchor(full: string): { month: number; year: number } | null {
  const match = full.match(/Data:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year: Number(match[3]) };
}

function periodLabel(full: string): string | null {
  const match = full.match(
    /Movimenta[cç][oõ]es entre:\s*(\d{2})\/(\d{2})\/(\d{4})\s*e\s*(\d{2})\/(\d{2})\/(\d{4})/i
  );
  if (!match) return null;
  const start = iso(Number(match[1]), Number(match[2]), Number(match[3]));
  const end = iso(Number(match[4]), Number(match[5]), Number(match[6]));
  if (!start || !end) return null;
  return `${start} – ${end}`;
}

function skipCardDescription(description: string): boolean {
  return /^(SALDO\b|PAGAMENTO\b|PAG\s+BOLETO\b|PAGTO\b)/i.test(description);
}

function parseBradescoCard(lines: string[], full: string): SicoobParseResult | null {
  const anchor = cardAnchor(full);
  if (!anchor) return null;
  const rows: SicoobMovement[] = [];
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
    bank: "bradesco",
    rows,
    ignored,
    periodLabel: iso(1, anchor.month, anchor.year)
  };
}

function isCheckingHeader(line: string): boolean {
  return /^(Extrato de:|Folha:|Total\b|Data\b|Hist[oó]rico\b|Docto\b|Cr[eé]dito\b|D[eé]bito\b|Saldo\b)/i.test(line);
}

function parseBradescoChecking(lines: string[], full: string): SicoobParseResult | null {
  const rows: SicoobMovement[] = [];
  let ignored = 0;
  let currentDate: string | null = null;

  for (const line of lines) {
    if (isCheckingHeader(line)) continue;

    const dated = line.match(/^(\d{2})\/(\d{2})\/(\d{2,4})\s+(.*)$/);
    const body = dated ? (dated[4] ?? "") : line;
    if (dated) {
      const month = Number(dated[2]);
      currentDate = iso(Number(dated[1]), month, fullYear(Number(dated[3])));
    }

    const found = trailingMoney(body, 2);
    if (found.amounts.length === 0) {
      const extra = body.replace(/\s+/g, " ").trim();
      const last = rows[rows.length - 1];
      if (last && extra.length >= 2 && !dated) {
        last.description = `${last.description} · ${extra}`.replace(/\s+/g, " ").trim().slice(0, 140);
      }
      continue;
    }

    const amount = found.amounts[0];
    const description = found.rest.replace(/\s+\d{4,12}$/, "").replace(/\s+/g, " ").trim().slice(0, 140);
    if (!currentDate || description.length < 2 || amount === 0 || /^SALDO\b/i.test(description)) {
      ignored += 1;
      continue;
    }
    rows.push({
      date: currentDate,
      description,
      amount: formatAmount(amount),
      direction: amount < 0 ? "expense" : "income"
    });
  }

  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.date).sort();
  return {
    kind: "checking",
    bank: "bradesco",
    rows,
    ignored,
    periodLabel: periodLabel(full) ?? `${dates[0]} – ${dates[dates.length - 1]}`
  };
}

export function parseBradescoLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const full = lines.join("\n");
  if (isBradescoChecking(full)) return parseBradescoChecking(lines, full);
  if (isBradescoCard(full)) return parseBradescoCard(lines, full);
  return null;
}
