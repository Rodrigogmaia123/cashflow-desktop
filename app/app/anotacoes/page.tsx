import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireActiveWorkspaceId } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { NotesClient } from "@/components/notes/notes-client";
import {
  NOTE_KINDS,
  NOTE_STATUSES,
  NOTE_VISIBILITIES,
  type NoteDTO,
  type NoteKind,
  type NoteStatus,
  type NoteVisibility
} from "@/lib/domain/notes";
import { utcKey } from "@/lib/utils/date-utc";

export const metadata = {
  title: "Anotações | Cashflow Pro",
  description: "Agenda, tarefas e notas avulsas"
};

function asKind(value: string): NoteKind {
  return (NOTE_KINDS as readonly string[]).includes(value) ? (value as NoteKind) : "NOTE";
}

function asVisibility(value: string): NoteVisibility {
  return (NOTE_VISIBILITIES as readonly string[]).includes(value)
    ? (value as NoteVisibility)
    : "PRIVATE";
}

function asStatus(value: string): NoteStatus {
  return (NOTE_STATUSES as readonly string[]).includes(value) ? (value as NoteStatus) : "OPEN";
}

export default async function AnotacoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = await requireActiveWorkspaceId();
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true }
  });

  const rows = await prisma.note.findMany({
    where: {
      OR: [
        { userId: user.id, visibility: "PRIVATE" },
        { workspaceId, visibility: "WORKSPACE" }
      ]
    },
    include: { items: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" }
  });

  const notes: NoteDTO[] = rows.map((note) => ({
    id: note.id,
    kind: asKind(note.kind),
    visibility: asVisibility(note.visibility),
    status: asStatus(note.status),
    title: note.title,
    body: note.body,
    theme: note.theme,
    date: note.date ? utcKey(note.date) : null,
    mine: note.userId === user.id,
    items: note.items.map((item) => ({
      id: item.id,
      text: item.text,
      done: item.done,
      position: item.position
    }))
  }));

  return <NotesClient notes={notes} workspaceName={workspace?.name ?? "Workspace"} />;
}
