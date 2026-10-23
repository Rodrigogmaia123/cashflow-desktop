import { addUtcDays, todayUtcKey, utcKey } from "@/lib/utils/date-utc";

export const NOTE_KINDS = ["NOTE", "TASK", "REMINDER"] as const;
export const NOTE_VISIBILITIES = ["PRIVATE", "WORKSPACE"] as const;
export const NOTE_STATUSES = ["OPEN", "DONE"] as const;

export type NoteKind = (typeof NOTE_KINDS)[number];
export type NoteVisibility = (typeof NOTE_VISIBILITIES)[number];
export type NoteStatus = (typeof NOTE_STATUSES)[number];

export type NoteChecklistItemDTO = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export type NoteDTO = {
  id: string;
  kind: NoteKind;
  visibility: NoteVisibility;
  status: NoteStatus;
  title: string;
  body: string | null;
  theme: string | null;
  date: string | null;
  mine: boolean;
  items: NoteChecklistItemDTO[];
};

export const NOTE_KIND_LABEL: Record<NoteKind, string> = {
  NOTE: "Nota",
  TASK: "Tarefa",
  REMINDER: "Lembrete"
};

export function normalizeTheme(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 60);
}

export function themeGroupKey(theme: string | null | undefined): string {
  return normalizeTheme(theme)?.toLocaleLowerCase("pt-BR") ?? "";
}

export function monthGrid(year: number, monthIndex: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const startDow = first.getUTCDay();
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
  const start = addUtcDays(first, mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addUtcDays(start, index);
    return {
      key: utcKey(date),
      inMonth: date.getUTCMonth() === monthIndex
    };
  });
}

export function currentUtcMonth() {
  const key = todayUtcKey();
  const [year, month] = key.split("-").map(Number);
  return { year, monthIndex: month - 1, today: key };
}

export function formatMonthTitle(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

export function formatDayTitle(key: string) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC"
  });
}
