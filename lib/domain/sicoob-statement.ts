export type SicoobKind = "checking" | "card";

export type SicoobMovement = {
  date: string;
  description: string;
  amount: string;
  direction: "expense" | "income";
};

export type SicoobTextItem = {
  str: string;
  x: number;
  y: number;
};

export type StatementBank = "sicoob" | "nubank" | "itau" | "bradesco" | "bb" | "inter" | "generic";

export type SicoobParseResult = {
  kind: SicoobKind;
  bank: StatementBank;
  rows: SicoobMovement[];
  ignored: number;
  periodLabel: string | null;
};

const AMOUNT_AT_END = /(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD])?\s*$/i;

function iso(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function parseFullDate(value: string): Date | null {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const key = iso(Number(match[1]), Number(match[2]), Number(match[3]));
  if (!key) return null;
  return new Date(`${key}T00:00:00.000Z`);
}

function cleanLabel(value: string): string {
  return value.replace(/^[\s\-–—]+/, "").replace(/\s+/g, " ").trim();
}

function isIgnoredHistory(value: string): boolean {
  const text = cleanLabel(value);
  if (!text) return true;
  return /^(SALDO\b|RESUMO\b|LIMITE\b|VENCTO\b|EXTRATO\b|MOVIMENTOS\b|HIST[OÓ]RICO\b|^DATA\b|GASTOS DE\b|SISBR\b|SICOOB\b|PLATAFORMA\b|SISTEMA\b|COOP\b|CONTA\b|CLIENTE\b|FATURA\b|VENCIMENTO\b|PER[IÍ]ODO\b)/i.test(
    text
  );
}

function isNoise(value: string): boolean {
  const text = cleanLabel(value);
  if (!text) return true;
  return (
    /^(DOC\.?:|C[OÓ]DIGO TED\b)/i.test(text) ||
    /^0{6,}$/.test(text) ||
    /^[\d.\-/\s]{8,}$/.test(text)
  );
}

function takeAmount(line: string): { rest: string; amount: number; mark: "C" | "D" | "" } | null {
  const match = line.match(AMOUNT_AT_END);
  if (!match || match.index == null) return null;
  const negative = match[1].startsWith("-");
  const value = Number(match[1].replace(/^-/, "").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  const mark = (match[2] ?? "").toUpperCase();
  return {
    rest: line.slice(0, match.index).trim(),
    amount: negative ? -value : value,
    mark: mark === "C" || mark === "D" ? mark : ""
  };
}

function detectKind(text: string): SicoobKind | null {
  if (/EXTRATO\s+CONTA\s+CORRENTE/i.test(text)) return "checking";
  if (/CART[AÃ]O\s+DE\s+CR[EÉ]DITO|EXTRATO\s+DE\s+CART/i.test(text)) return "card";
  return null;
}

function periodBounds(text: string): { start: Date; end: Date } | null {
  const match = text.match(
    /PER[IÍ]ODO:\s*(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})/i
  );
  if (!match) return null;
  const start = parseFullDate(match[1]);
  const end = parseFullDate(match[2]);
  if (!start || !end) return null;
  return { start, end };
}

function dueDate(text: string): Date | null {
  const match = text.match(/Vencimento:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (!match) return null;
  return parseFullDate(match[1]);
}

function resolveCheckingDate(day: number, month: number, start: Date, end: Date): string | null {
  const startMs = start.getTime();
  const endMs = end.getTime();
  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const years = new Set([
    start.getUTCFullYear() - 1,
    start.getUTCFullYear(),
    end.getUTCFullYear(),
    end.getUTCFullYear() + 1
  ]);
  for (const year of years) {
    const key = iso(day, month, year);
    if (!key) continue;
    const time = Date.parse(`${key}T00:00:00.000Z`);
    const distance = time < startMs ? startMs - time : time > endMs ? time - endMs : 0;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = key;
    }
  }
  return best;
}

function resolveCardDate(day: number, month: number, due: Date): string | null {
  let year = due.getUTCFullYear();
  if (month > due.getUTCMonth() + 1) year -= 1;
  return iso(day, month, year);
}

function formatAmount(value: number): string {
  return Math.abs(value).toFixed(2).replace(".", ",");
}

function buildDescription(parts: string[]): string {
  const unique: string[] = [];
  for (const part of parts) {
    if (!part || unique.includes(part)) continue;
    unique.push(part);
    if (unique.length === 4) break;
  }
  return unique.join(" · ").slice(0, 140);
}

type OpenTxn = { date: string; parts: string[]; pending: number | null };

export function linesFromSicoobItems(pages: SicoobTextItem[][]): string[] {
  const lines: string[] = [];
  for (const page of pages) {
    const buckets: { y: number; cells: { x: number; str: string }[] }[] = [];
    for (const item of page) {
      const text = item.str.replace(/\s+/g, " ").trim();
      if (!text) continue;
      let bucket = buckets.find((row) => Math.abs(row.y - item.y) <= 3);
      if (!bucket) {
        bucket = { y: item.y, cells: [] };
        buckets.push(bucket);
      }
      bucket.cells.push({ x: item.x, str: text });
    }
    buckets.sort((a, b) => b.y - a.y);
    for (const bucket of buckets) {
      const line = bucket.cells
        .sort((a, b) => a.x - b.x)
        .map((cell) => cell.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) lines.push(line);
    }
  }
  return lines;
}

export function parseSicoobLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const full = lines.join("\n");
  const kind = detectKind(full);
  if (!kind) return null;

  const period = periodBounds(full);
  const due = dueDate(full);
  const rows: SicoobMovement[] = [];
  let ignored = 0;
  let open: OpenTxn | null = null;

  function pushPart(txn: OpenTxn, value: string) {
    const text = cleanLabel(value);
    if (!text || isIgnoredHistory(text) || isNoise(text)) return;
    txn.parts.push(text);
  }

  function finish(txn: OpenTxn, amount: number, mark: "C" | "D" | "") {
    const description = buildDescription(txn.parts);
    const payment = /^PAGAMENTO\b/i.test(description);
    if (description.length < 2) {
      ignored += 1;
      return;
    }
    if (kind === "card" && (amount < 0 || payment)) {
      ignored += 1;
      return;
    }
    if (kind === "checking" && mark !== "C" && mark !== "D") {
      ignored += 1;
      return;
    }
    rows.push({
      date: txn.date,
      description,
      amount: formatAmount(amount),
      direction: kind === "checking" && mark === "C" ? "income" : "expense"
    });
  }

  for (const line of lines) {
    if (/^RESUMO\b/i.test(cleanLabel(line))) break;

    const dated = line.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?\s*(.*)$/);
    if (dated) {
      const day = Number(dated[1]);
      const month = Number(dated[2]);
      const explicitYear = dated[3] ? Number(dated[3]) : null;
      const body = dated[4] ?? "";
      const found = takeAmount(body);
      const history = cleanLabel(found ? found.rest : body);
      if (isIgnoredHistory(history)) {
        open = null;
        continue;
      }
      const date = explicitYear
        ? iso(day, month, explicitYear)
        : kind === "checking" && period
          ? resolveCheckingDate(day, month, period.start, period.end)
          : kind === "card" && due
            ? resolveCardDate(day, month, due)
            : resolveCardDate(day, month, new Date());
      if (!date) {
        open = null;
        continue;
      }
      open = { date, parts: [], pending: null };
      pushPart(open, history);
      if (found && (kind === "card" || found.mark)) {
        finish(open, found.amount, found.mark);
        open = null;
      } else if (found && kind === "checking") {
        open.pending = found.amount;
      }
      continue;
    }

    if (open?.pending != null && /^[CD]$/i.test(cleanLabel(line))) {
      finish(open, open.pending, cleanLabel(line).toUpperCase() === "C" ? "C" : "D");
      open = null;
      continue;
    }

    const found = takeAmount(line);
    if (found && (kind === "card" || found.mark || kind === "checking")) {
      if (found.rest && isIgnoredHistory(found.rest)) continue;
      if (!open) {
        ignored += 1;
        continue;
      }
      pushPart(open, found.rest);
      if (kind === "checking" && !found.mark) {
        open.pending = found.amount;
        continue;
      }
      finish(open, found.amount, found.mark);
      open = null;
      continue;
    }

    if (open) pushPart(open, line);
  }

  const periodLabel = period
    ? `${period.start.toISOString().slice(0, 10)} – ${period.end.toISOString().slice(0, 10)}`
    : due
      ? due.toISOString().slice(0, 10)
      : null;

  return { kind, bank: "sicoob", rows, ignored, periodLabel };
}
