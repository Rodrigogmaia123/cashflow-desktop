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
  dezembro: 12
};

const PREFIXES = ["Compra no débito", "Compra no crédito", "Pix enviado", "Pix recebido", "Pagamento", "Transferência"];

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

function monthNumber(token: string): number | null {
  return MONTHS[fold(token)] ?? null;
}

function isInter(full: string): boolean {
  return /Banco Inter/i.test(full) && /Pix enviado|Pix recebido|Compra no d[eé]bito/i.test(full);
}

function periodLabel(full: string): string | null {
  const match = full.match(/Per[ií]odo:\s*(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!match) return null;
  const start = iso(Number(match[1]), Number(match[2]), Number(match[3]));
  const end = iso(Number(match[4]), Number(match[5]), Number(match[6]));
  if (!start || !end) return null;
  return `${start} – ${end}`;
}

function trailingMoney(text: string): { rest: string; amounts: number[] } {
  const amounts: number[] = [];
  let rest = text.trim();
  while (amounts.length < 2) {
    const match = rest.match(/(-)?\s*R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/i);
    if (!match || match.index == null) break;
    const value = Number(match[2].replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(value)) break;
    amounts.unshift(match[1] ? -value : value);
    rest = rest.slice(0, match.index).trim();
  }
  return { rest, amounts };
}

function tidyParty(value: string): string {
  const text = value
    .replace(/^[:\s"'“”]+|["'“”\s]+$/g, "")
    .replace(/^Cp\s*:\s*/i, "")
    .replace(/^\d{5,}(?:\s+\d{5,})?\s*[-–]?\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function splitDescription(rest: string): string {
  const text = rest.replace(/\s+/g, " ").trim();
  for (const prefix of PREFIXES) {
    if (fold(text).startsWith(fold(prefix))) {
      const name = tidyParty(text.slice(prefix.length));
      return (name ? `${prefix} · ${name}` : prefix).slice(0, 140);
    }
  }
  return tidyParty(text).slice(0, 140);
}

function isNoise(line: string): boolean {
  return /^(Fale com|SAC\b|Ouvidoria|Defici[eê]ncia|Solicitado em|CPF\/CNPJ|Per[ií]odo\b|Saldo\b|Valor$|Tipo:|Ag[eê]ncia\b|Institui)/i.test(
    line
  );
}

export function parseInterLines(input: string[] | string): SicoobParseResult | null {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/)).map((line) => line.trim()).filter(Boolean);
  const full = lines.join("\n");
  if (!isInter(full)) return null;

  const rows: SicoobMovement[] = [];
  let ignored = 0;
  let currentDate: string | null = null;

  for (const line of lines) {
    if (isNoise(line)) continue;
    let body = line;
    const dated = line.match(/^(\d{1,2}) de ([A-Za-zçÇáàâãéêíóôõú]+) de (\d{4})\b\s*(.*)$/i);
    if (dated) {
      const month = monthNumber(dated[2]);
      currentDate = month ? iso(Number(dated[1]), month, Number(dated[3])) : null;
      body = (dated[4] ?? "").trim();
      if (!body || /^Saldo do dia\b/i.test(body)) continue;
    }

    const found = trailingMoney(body);
    if (found.amounts.length === 0) {
      const extra = body.replace(/\s+/g, " ").trim();
      const last = rows[rows.length - 1];
      if (last && !dated && extra.length >= 2) last.description = `${last.description} ${extra}`.slice(0, 140);
      continue;
    }

    const amount = found.amounts[0];
    const description = splitDescription(found.rest);
    if (!currentDate || amount === 0 || description.length < 2) {
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
    bank: "inter",
    rows,
    ignored,
    periodLabel: periodLabel(full) ?? `${dates[0]} – ${dates[dates.length - 1]}`
  };
}
