/** Datas de calendário no mesmo padrão do cashflow: YYYY-MM-DD em UTC. */

export function utcKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcDateFromKey(key: string): Date {
  const d = new Date(`${key}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Data inválida.");
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function todayUtcKey(): string {
  return utcKey(new Date());
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

/** Segunda (UTC) da semana que contém a data. Semana = seg–dom. */
export function mondayOfUtcWeek(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addUtcDays(d, diff);
}

export function sundayOfUtcWeek(monday: Date): Date {
  return addUtcDays(monday, 6);
}

export function formatUtcShort(date: Date): string {
  const key = utcKey(date);
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}
