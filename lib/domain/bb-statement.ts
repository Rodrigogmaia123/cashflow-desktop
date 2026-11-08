import type { SicoobMovement, SicoobParseResult } from "@/lib/domain/sicoob-statement";

const MONEY_MARK = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*([CD])\s*$/i;

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

function isBbChecking(full: string): boolean {
  return (
    /Extrato de conta corrente/i.test(full) &&
    /\d,\d{2}\s*[CD]\b/.test(full) &&
    /Pix - |Saldo Anterior|BB Rende/i.test(full)
  );
}

function periodLabel(full: string): string | null {
  const match = full.match(/Per[ií]odo do extrato[\s\S]{0,40}?(\d{2})\s*\/\s*(\d{4})/i);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  const key = iso(1, month, year);
  return key ? key.slice(0, 7) : null;
}

function trailingMarks(text: string): { rest: string; amounts: Array<{ value: number; mark: "C" | "D" }> } {
  const amounts: Array<{ value: number; mark: "C" | "D" }> = [];
  let rest = text.trim();
  while (amounts.length < 2) {
    const match = rest.match(MONEY_MARK);
    if (!match || match.index == null) break;
    const value = Number(match[1].replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(value)) break;
    amounts.unshift({ value, mark: match[2].toUpperCase() === "C" ? "C" : "D" });
    rest = rest.slice(0, match.index).trim();
  }
  return { rest, amounts };
}

function stripDocument(text: string): string {
  return text
    .replace(/\s+\d{1,3}(?:\.\d{3})+(?:\.\d+)*\s*$/, "")
    .replace(/\s+\d{1,8}(?:\s+\d{1,8})?\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDetail(line: string): boolean {
  if (!line || line.length < 2) return false;
  if (/https?:\/\//i.test(line) || /\.{4,}/.test(line) || /_{4,}/.test(line) || /%/.test(line)) return false;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(line) || /^\d+\s*\/\s*\d+$/.test(line) || /^[A-Z]\d{6,}/.test(line)) return false;
  return !/^(Data de |IOF\b|Taxa |Custo |Informa|Valor |Despesas |Tributos|DEMAIS |BB GIRO|VALOR |SALDO |JUROS|DT-BASE|VENCIMENTO|Transa|Servi|Ouvidoria|Para deficientes|Cliente\b|Ag[eê]ncia\b|Conta corrente|Per[ií]odo|Lan[cç]amentos\b|Documento\b|Hist[oó]rico\b|Consultas\b|\(\*)/i.test(
    line
  );
}

function tidyDetail(line: string): string {
  return line
    .replace(/^\d{2}\/\d{2}\s+\d{2}:\d{2}\s+/, "")
    .replace(/^\d{6,}\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseBbLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const full = lines.join("\n");
  if (!isBbChecking(full)) return null;

  const rows: SicoobMovement[] = [];
  let ignored = 0;

  for (const line of lines) {
    const dated = line.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+\d{3,4}\s+\d{4,5}\s+(\d{3})\s+(.*)$/);
    if (!dated) {
      const last = rows[rows.length - 1];
      const detail = tidyDetail(line);
      if (last && isDetail(line) && detail.length >= 2) {
        last.description = `${last.description} · ${detail}`.slice(0, 140);
      }
      continue;
    }

    const found = trailingMarks(dated[5] ?? "");
    if (found.amounts.length === 0) continue;
    const amount = found.amounts[0];
    const description = stripDocument(found.rest).replace(/^\d{3}\s+/, "").slice(0, 140);
    if (description.length < 2 || amount.value === 0 || /^Saldo Anterior\b/i.test(description)) {
      ignored += 1;
      continue;
    }
    const date = iso(Number(dated[1]), Number(dated[2]), Number(dated[3]));
    if (!date) continue;
    rows.push({
      date,
      description,
      amount: formatAmount(amount.value),
      direction: amount.mark === "C" ? "income" : "expense"
    });
  }

  if (rows.length === 0) return null;
  const dates = rows.map((row) => row.date).sort();
  return {
    kind: "checking",
    bank: "bb",
    rows,
    ignored,
    periodLabel: periodLabel(full) ?? `${dates[0]} – ${dates[dates.length - 1]}`
  };
}
