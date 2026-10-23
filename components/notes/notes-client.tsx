"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  deleteNote,
  saveNote,
  setNoteStatus,
  toggleChecklistItem
} from "@/app/app/anotacoes/actions";
import {
  NOTE_KIND_LABEL,
  currentUtcMonth,
  formatDayTitle,
  formatMonthTitle,
  monthGrid,
  themeGroupKey,
  type NoteDTO,
  type NoteKind,
  type NoteVisibility
} from "@/lib/domain/notes";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

type ViewMode = "agenda" | "loose";
type KindFilter = "ALL" | NoteKind;
type StatusFilter = "ALL" | "OPEN" | "DONE";
type OriginFilter = "ALL" | NoteVisibility;

type Draft = {
  id?: string;
  title: string;
  body: string;
  kind: NoteKind;
  visibility: NoteVisibility;
  theme: string;
  date: string;
  items: { text: string; done: boolean }[];
};

function emptyDraft(date: string): Draft {
  return {
    title: "",
    body: "",
    kind: "NOTE",
    visibility: "PRIVATE",
    theme: "",
    date,
    items: []
  };
}

function draftFromNote(note: NoteDTO): Draft {
  return {
    id: note.id,
    title: note.title,
    body: note.body ?? "",
    kind: note.kind,
    visibility: note.visibility,
    theme: note.theme ?? "",
    date: note.date ?? "",
    items: note.items.map((item) => ({ text: item.text, done: item.done }))
  };
}

export function NotesClient({
  notes,
  workspaceName
}: {
  notes: NoteDTO[];
  workspaceName: string;
}) {
  const router = useRouter();
  const initial = currentUtcMonth();
  const [view, setView] = useState<ViewMode>("agenda");
  const [year, setYear] = useState(initial.year);
  const [monthIndex, setMonthIndex] = useState(initial.monthIndex);
  const [selected, setSelected] = useState(initial.today);
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [status, setStatus] = useState<StatusFilter>("OPEN");
  const [origin, setOrigin] = useState<OriginFilter>("ALL");
  const [theme, setTheme] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initial.today));
  const [itemText, setItemText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const themes = useMemo(() => {
    const map = new Map<string, string>();
    for (const note of notes) {
      const key = themeGroupKey(note.theme);
      if (key && note.theme && !map.has(key)) map.set(key, note.theme);
    }
    return Array.from(map, ([key, label]) => ({ key, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR")
    );
  }, [notes]);

  const filtered = useMemo(
    () =>
      notes.filter((note) => {
        if (kind !== "ALL" && note.kind !== kind) return false;
        if (status !== "ALL" && note.status !== status) return false;
        if (origin !== "ALL" && note.visibility !== origin) return false;
        if (theme !== "ALL" && themeGroupKey(note.theme) !== theme) return false;
        return true;
      }),
    [notes, kind, status, origin, theme]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, NoteDTO[]>();
    for (const note of filtered) {
      if (!note.date) continue;
      const list = map.get(note.date) ?? [];
      list.push(note);
      map.set(note.date, list);
    }
    return map;
  }, [filtered]);

  const looseGroups = useMemo(() => {
    const groups = new Map<string, { label: string; notes: NoteDTO[] }>();
    for (const note of filtered) {
      if (note.date) continue;
      const key = themeGroupKey(note.theme) || "__none";
      const label = note.theme?.trim() || "Sem tema";
      const group = groups.get(key) ?? { label, notes: [] };
      group.notes.push(note);
      groups.set(key, group);
    }
    return Array.from(groups.entries())
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => {
        if (a.label === "Sem tema") return 1;
        if (b.label === "Sem tema") return -1;
        return a.label.localeCompare(b.label, "pt-BR");
      });
  }, [filtered]);

  const cells = monthGrid(year, monthIndex);
  const dayNotes = byDate.get(selected) ?? [];

  function shiftMonth(delta: number) {
    const next = new Date(Date.UTC(year, monthIndex + delta, 1));
    setYear(next.getUTCFullYear());
    setMonthIndex(next.getUTCMonth());
  }

  function openCreate(date = "") {
    setDraft(emptyDraft(date));
    setItemText("");
    setError(null);
    setConfirmDelete(false);
    setOpen(true);
  }

  function openEdit(note: NoteDTO) {
    setDraft(draftFromNote(note));
    setItemText("");
    setError(null);
    setConfirmDelete(false);
    setOpen(true);
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar.");
        return;
      }
      after?.();
      router.refresh();
    });
  }

  function addItem() {
    const text = itemText.trim();
    if (!text) return;
    setDraft((current) => ({
      ...current,
      items: [...current.items, { text, done: false }]
    }));
    setItemText("");
  }

  function submit() {
    if (draft.kind === "REMINDER" && !draft.date) {
      setError("Lembrete precisa de uma data.");
      return;
    }
    run(
      () =>
        saveNote({
          id: draft.id,
          title: draft.title,
          body: draft.body,
          kind: draft.kind,
          visibility: draft.visibility,
          theme: draft.theme,
          date: draft.date || null,
          items: draft.items.filter((item) => item.text.trim())
        }),
      () => setOpen(false)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-[28px] font-bold tracking-tight">Anotações</h1>
          <p className="max-w-2xl text-[13px] text-muted-foreground">
            Agenda do dia e notas soltas. Pode ser tarefa, lembrete ou nota, com checklist.
            O padrão é só seu; dá para abrir para {workspaceName}.
          </p>
        </div>
        <Button type="button" size="sm" variant="accent" onClick={() => openCreate(view === "agenda" ? selected : "")}>
          Nova anotação
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-card-secondary/30 p-1">
          <FilterButton active={view === "agenda"} onClick={() => setView("agenda")}>
            Agenda
          </FilterButton>
          <FilterButton active={view === "loose"} onClick={() => setView("loose")}>
            Avulsas
          </FilterButton>
        </div>
        <Select value={kind} onChange={(value) => setKind(value as KindFilter)} label="Tipo">
          <option value="ALL">Todos os tipos</option>
          <option value="NOTE">Notas</option>
          <option value="TASK">Tarefas</option>
          <option value="REMINDER">Lembretes</option>
        </Select>
        <Select value={status} onChange={(value) => setStatus(value as StatusFilter)} label="Situação">
          <option value="OPEN">A concluir</option>
          <option value="DONE">Concluídas</option>
          <option value="ALL">Todas</option>
        </Select>
        <Select value={origin} onChange={(value) => setOrigin(value as OriginFilter)} label="Origem">
          <option value="ALL">Minhas e do workspace</option>
          <option value="PRIVATE">Só minhas</option>
          <option value="WORKSPACE">Do workspace</option>
        </Select>
        <Select value={theme} onChange={setTheme} label="Tema">
          <option value="ALL">Todos os temas</option>
          {themes.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      {view === "agenda" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <section className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(-1)}>
                Mês anterior
              </Button>
              <h2 className="text-sm font-semibold capitalize">{formatMonthTitle(year, monthIndex)}</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(1)}>
                Próximo mês
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell) => {
                const count = byDate.get(cell.key)?.length ?? 0;
                const isSelected = cell.key === selected;
                const isToday = cell.key === initial.today;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => {
                      setSelected(cell.key);
                      const [nextYear, nextMonth] = cell.key.split("-").map(Number);
                      setYear(nextYear);
                      setMonthIndex(nextMonth - 1);
                    }}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center rounded-xl text-sm transition-colors",
                      cell.inMonth ? "text-foreground" : "text-muted-foreground/50",
                      isSelected ? "bg-primary text-primary-foreground" : "hover:bg-white/5",
                      isToday && !isSelected && "ring-1 ring-primary/60"
                    )}
                  >
                    <span>{Number(cell.key.slice(8))}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "mt-0.5 h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-primary-foreground" : "bg-accent"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold capitalize">{formatDayTitle(selected)}</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => openCreate(selected)}>
                Neste dia
              </Button>
            </div>
            {dayNotes.length === 0 ? (
              <EmptyState text="Nada neste dia com os filtros atuais." />
            ) : (
              dayNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  pending={pending}
                  onOpen={() => openEdit(note)}
                  onToggleStatus={() =>
                    run(() => setNoteStatus(note.id, note.status === "DONE" ? "OPEN" : "DONE"))
                  }
                  onToggleItem={(id) => run(() => toggleChecklistItem(id))}
                />
              ))
            )}
          </section>
        </div>
      ) : looseGroups.length === 0 ? (
        <EmptyState text="Nenhuma nota avulsa com os filtros atuais." />
      ) : (
        <div className="space-y-6">
          {looseGroups.map((group) => (
            <section key={group.key} className="space-y-3">
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#9ca9a1]">{group.label}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {group.notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    pending={pending}
                    onOpen={() => openEdit(note)}
                    onToggleStatus={() =>
                      run(() => setNoteStatus(note.id, note.status === "DONE" ? "OPEN" : "DONE"))
                    }
                    onToggleItem={(id) => run(() => toggleChecklistItem(id))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{draft.id ? "Editar anotação" : "Nova anotação"}</SheetTitle>
            <SheetDescription>
              Nota, tarefa ou lembrete. Lembrete fica no dia escolhido da agenda.
            </SheetDescription>
          </SheetHeader>
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Field label="Título">
              <Input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                maxLength={160}
                required
                placeholder="O que você quer guardar"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select
                  className={fieldClass}
                  value={draft.kind}
                  onChange={(event) => {
                    const nextKind = event.target.value as NoteKind;
                    setDraft({
                      ...draft,
                      kind: nextKind,
                      date: nextKind === "REMINDER" && !draft.date ? selected : draft.date
                    });
                  }}
                >
                  <option value="NOTE">Nota</option>
                  <option value="TASK">Tarefa</option>
                  <option value="REMINDER">Lembrete</option>
                </select>
              </Field>
              <Field label={draft.kind === "REMINDER" ? "Data" : "Data (opcional)"}>
                <Input
                  type="date"
                  value={draft.date}
                  required={draft.kind === "REMINDER"}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                />
              </Field>
            </div>
            <Field label="Tema (opcional)">
              <Input
                value={draft.theme}
                list="note-themes"
                maxLength={60}
                placeholder="Viagem, casa, trabalho"
                onChange={(event) => setDraft({ ...draft, theme: event.target.value })}
              />
              <datalist id="note-themes">
                {themes.map((item) => (
                  <option key={item.key} value={item.label} />
                ))}
              </datalist>
            </Field>
            <Field label="Quem vê">
              <select
                className={fieldClass}
                value={draft.visibility}
                disabled={Boolean(draft.id && !notes.find((note) => note.id === draft.id)?.mine)}
                onChange={(event) =>
                  setDraft({ ...draft, visibility: event.target.value as NoteVisibility })
                }
              >
                <option value="PRIVATE">Só eu</option>
                <option value="WORKSPACE">Este workspace ({workspaceName})</option>
              </select>
            </Field>
            <Field label="Texto">
              <textarea
                value={draft.body}
                maxLength={8000}
                rows={4}
                placeholder="Detalhes, contexto, o que não pode esquecer"
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </Field>
            <fieldset className="space-y-2">
              <legend className="text-[11px] font-medium text-muted-foreground">Checklist</legend>
              {draft.items.map((item, index) => (
                <label key={`${index}-${item.text}`} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 shrink-0 accent-[#ac93ff]"
                    checked={item.done}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        items: draft.items.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, done: !entry.done } : entry
                        )
                      })
                    }
                  />
                  <span className={cn("relative min-w-0 flex-1", item.done && "text-[#8d7d74]")}>
                    {item.text}
                    {item.done && (
                      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#6a4034]/80" />
                    )}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        items: draft.items.filter((_, entryIndex) => entryIndex !== index)
                      })
                    }
                  >
                    Tirar
                  </button>
                </label>
              ))}
              <div className="flex gap-2">
                <Input
                  value={itemText}
                  maxLength={300}
                  placeholder="Novo item"
                  onChange={(event) => setItemText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addItem();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  Adicionar
                </Button>
              </div>
            </fieldset>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {draft.id ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Apagar de vez?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => deleteNote(draft.id!),
                          () => setOpen(false)
                        )
                      }
                    >
                      Apagar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                    Apagar
                  </Button>
                )
              ) : (
                <span />
              )}
              <Button type="submit" size="sm" variant="accent" disabled={pending}>
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NoteCard({
  note,
  pending,
  onOpen,
  onToggleStatus,
  onToggleItem
}: {
  note: NoteDTO;
  pending: boolean;
  onOpen: () => void;
  onToggleStatus: () => void;
  onToggleItem: (id: string) => void;
}) {
  const doneCount = note.items.filter((item) => item.done).length;
  const statusLabel = note.status === "DONE" ? "Reabrir" : note.kind === "NOTE" ? "Arquivar" : "Concluir";

  return (
    <article className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-[#ac93ff]"
          checked={note.status === "DONE"}
          disabled={pending}
          aria-label={statusLabel}
          onChange={onToggleStatus}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <button type="button" onClick={onOpen} className="block w-full text-left">
            <span
              className={cn(
                "font-medium",
                note.status === "DONE" && "text-muted-foreground line-through"
              )}
            >
              {note.title}
            </span>
            {note.body && (
              <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{note.body}</span>
            )}
          </button>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <Badge>{NOTE_KIND_LABEL[note.kind]}</Badge>
            {note.theme && <Badge>{note.theme}</Badge>}
            <Badge>{note.visibility === "PRIVATE" ? "Só eu" : "Workspace"}</Badge>
            {note.items.length > 0 && (
              <Badge>
                {doneCount}/{note.items.length}
              </Badge>
            )}
          </div>
          {note.items.length > 0 && (
            <ul className="space-y-1">
              {note.items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 shrink-0 accent-[#ac93ff]"
                      checked={item.done}
                      disabled={pending}
                      onChange={() => onToggleItem(item.id)}
                    />
                    <span className={cn("relative min-w-0 flex-1", item.done && "text-[#8d7d74]")}>
                      {item.text}
                      {item.done && (
                        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#6a4034]/80" />
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">
      {children}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  label,
  children
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={label}
      className="h-8 rounded-lg border border-white/10 bg-card px-2 text-xs"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}
