"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  NOTE_KINDS,
  NOTE_STATUSES,
  NOTE_VISIBILITIES,
  normalizeTheme,
  type NoteKind,
  type NoteStatus,
  type NoteVisibility
} from "@/lib/domain/notes";
import { utcDateFromKey } from "@/lib/utils/date-utc";

const itemSchema = z.object({
  text: z.string().trim().min(1).max(300),
  done: z.boolean()
});

const noteSchema = z
  .object({
    id: z.string().min(1).optional(),
    title: z.string().trim().min(1, "Escreva um título.").max(160),
    body: z.string().trim().max(8000).optional().nullable(),
    kind: z.enum(NOTE_KINDS),
    visibility: z.enum(NOTE_VISIBILITIES),
    theme: z.string().trim().max(60).optional().nullable(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
      .optional()
      .nullable(),
    items: z.array(itemSchema).max(50)
  })
  .superRefine((value, ctx) => {
    if (value.kind === "REMINDER" && !value.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lembrete precisa de uma data.",
        path: ["date"]
      });
    }
  });

export type SaveNoteInput = z.input<typeof noteSchema>;

type ActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/app/anotacoes");
}

type Actor =
  | { ok: true; userId: string; workspaceId: string }
  | { ok: false; error: string };

async function requireActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const workspaceId = user.activeWorkspaceId;
  if (!workspaceId) redirect("/app/workspaces?missing=1");

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId }
    }
  });
  if (!membership) {
    return { ok: false, error: "Sem acesso a este workspace." };
  }
  return { ok: true, userId: user.id, workspaceId };
}

async function loadEditable(id: string, userId: string, workspaceId: string) {
  const note = await prisma.note.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } }
  });
  if (!note) return null;
  if (note.visibility === "PRIVATE") {
    return note.userId === userId ? note : null;
  }
  if (note.visibility === "WORKSPACE" && note.workspaceId === workspaceId) {
    return note;
  }
  return null;
}

function nextTaskStatus(
  kind: NoteKind,
  items: { done: boolean }[],
  previousItems: { done: boolean }[],
  previousStatus: string
): NoteStatus {
  if (kind !== "TASK") {
    return previousStatus === "DONE" ? "DONE" : "OPEN";
  }
  const nextAllDone = items.length > 0 && items.every((item) => item.done);
  const previousAllDone =
    previousItems.length > 0 && previousItems.every((item) => item.done);
  if (nextAllDone) return "DONE";
  if (previousAllDone && !nextAllDone) return "OPEN";
  return previousStatus === "DONE" ? "DONE" : "OPEN";
}

export async function saveNote(input: SaveNoteInput): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor.ok) return actor;

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const theme = normalizeTheme(data.theme);
  const date = data.date ? utcDateFromKey(data.date) : null;
  const body = data.body?.trim() ? data.body.trim() : null;
  const items = data.items.map((item, position) => ({
    text: item.text.trim(),
    done: item.done,
    position
  }));

  if (data.id) {
    const existing = await loadEditable(data.id, actor.userId, actor.workspaceId);
    if (!existing) return { ok: false, error: "Anotação não encontrada." };

    let visibility: NoteVisibility = existing.visibility === "WORKSPACE" ? "WORKSPACE" : "PRIVATE";
    let workspaceId = existing.workspaceId;
    if (existing.userId === actor.userId) {
      visibility = data.visibility;
      workspaceId = visibility === "WORKSPACE" ? actor.workspaceId : null;
    }

    const status = nextTaskStatus(
      data.kind,
      items,
      existing.items,
      existing.status
    );

    await prisma.$transaction(async (tx) => {
      await tx.noteChecklistItem.deleteMany({ where: { noteId: existing.id } });
      await tx.note.update({
        where: { id: existing.id },
        data: {
          visibility,
          workspaceId,
          kind: data.kind,
          title: data.title.trim(),
          body,
          theme,
          date,
          status,
          items: { create: items }
        }
      });
    });
    refresh();
    return { ok: true };
  }

  await prisma.note.create({
    data: {
      userId: actor.userId,
      workspaceId: data.visibility === "WORKSPACE" ? actor.workspaceId : null,
      visibility: data.visibility,
      kind: data.kind,
      title: data.title.trim(),
      body,
      theme,
      date,
      status: data.kind === "TASK" && items.length > 0 && items.every((item) => item.done)
        ? "DONE"
        : "OPEN",
      items: { create: items }
    }
  });
  refresh();
  return { ok: true };
}

export async function setNoteStatus(id: string, status: NoteStatus): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor.ok) return actor;
  if (!NOTE_STATUSES.includes(status)) return { ok: false, error: "Situação inválida." };

  const existing = await loadEditable(id, actor.userId, actor.workspaceId);
  if (!existing) return { ok: false, error: "Anotação não encontrada." };

  await prisma.note.update({
    where: { id: existing.id },
    data: { status }
  });
  refresh();
  return { ok: true };
}

export async function toggleChecklistItem(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor.ok) return actor;

  const item = await prisma.noteChecklistItem.findUnique({
    where: { id },
    include: { note: true }
  });
  if (!item) return { ok: false, error: "Item não encontrado." };

  const note = await loadEditable(item.noteId, actor.userId, actor.workspaceId);
  if (!note) return { ok: false, error: "Anotação não encontrada." };

  const done = !item.done;
  await prisma.noteChecklistItem.update({
    where: { id: item.id },
    data: { done }
  });

  if (note.kind === "TASK") {
    const items = await prisma.noteChecklistItem.findMany({
      where: { noteId: note.id }
    });
    const allDone = items.length > 0 && items.every((entry) => entry.done);
    if (allDone) {
      await prisma.note.update({ where: { id: note.id }, data: { status: "DONE" } });
    } else if (!done && note.status === "DONE") {
      await prisma.note.update({ where: { id: note.id }, data: { status: "OPEN" } });
    }
  }

  refresh();
  return { ok: true };
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const actor = await requireActor();
  if (!actor.ok) return actor;

  const existing = await loadEditable(id, actor.userId, actor.workspaceId);
  if (!existing) return { ok: false, error: "Anotação não encontrada." };

  await prisma.note.delete({ where: { id: existing.id } });
  refresh();
  return { ok: true };
}
