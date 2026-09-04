"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SUPPORT_ADMIN_LIST_POLL_MS,
  SUPPORT_ADMIN_THREAD_POLL_MS,
} from "@/lib/support/constants";
import {
  getAdminSupportThread,
  listAdminSupportThreads,
  resolveAdminSupportThread,
  sendAdminSupportMessage,
} from "@/app/app/admin/support-actions";
import type { SupportMessageDTO, SupportThreadDTO } from "@/lib/support/types";
import { SupportComposer, SupportMessageList } from "@/components/support/support-chat";

export function AdminSupportDesk() {
  const [threads, setThreads] = useState<SupportThreadDTO[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageDTO[]>([]);
  const [thread, setThread] = useState<SupportThreadDTO | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    const result = await listAdminSupportThreads();
    if (result.ok) setThreads(result.threads);
  }, []);

  const refreshThread = useCallback(async (id: string) => {
    if (typeof document !== "undefined" && document.hidden) return;
    const result = await getAdminSupportThread(id);
    if (!result.ok || !result.thread || !result.messages) return;
    setThread(result.thread);
    setMessages(result.messages);
    setThreads((current) =>
      current.map((item) =>
        item.id === id ? { ...item, unreadAdmin: 0 } : item
      )
    );
  }, []);

  useEffect(() => {
    void refreshList();
    const id = window.setInterval(() => void refreshList(), SUPPORT_ADMIN_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId) return;
    void refreshThread(selectedId);
    const id = window.setInterval(
      () => void refreshThread(selectedId),
      SUPPORT_ADMIN_THREAD_POLL_MS
    );
    return () => window.clearInterval(id);
  }, [selectedId, refreshThread]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (item) =>
        item.email.includes(q) ||
        item.editionsLabel.toLowerCase().includes(q) ||
        (item.lastPreview ?? "").toLowerCase().includes(q)
    );
  }, [threads, query]);

  async function send() {
    if (!selectedId || !draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await sendAdminSupportMessage(selectedId, draft);
    if (!result.ok) {
      setError(result.reason ?? "Não foi possível enviar.");
      setBusy(false);
      return;
    }
    setDraft("");
    if (result.thread) setThread(result.thread);
    if (result.messages) setMessages(result.messages);
    await refreshList();
    setBusy(false);
  }

  async function resolve() {
    if (!selectedId || busy) return;
    setBusy(true);
    const result = await resolveAdminSupportThread(selectedId);
    if (!result.ok) setError(result.reason ?? "Não foi possível encerrar.");
    await Promise.all([refreshList(), refreshThread(selectedId)]);
    setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] min-h-[70vh]">
      <aside className="rounded-2xl border border-white/10 bg-card overflow-hidden flex flex-col">
        <div className="p-3 border-b border-white/5 space-y-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar e-mail…"
          />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">
              Nenhuma conversa ainda. Elas aparecem quando o cliente envia a
              primeira mensagem.
            </p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5",
                  selectedId === item.id && "bg-primary-soft"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{item.email}</p>
                  {item.unreadAdmin > 0 && (
                    <span className="text-[10px] rounded-full bg-primary text-primary-foreground px-1.5 py-0.5">
                      {item.unreadAdmin}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {item.editionsLabel} ·{" "}
                  {item.status === "open"
                    ? "Aberto"
                    : item.status === "resolved"
                      ? "Encerrado"
                      : "Arquivado"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {item.lastPreview || "—"}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="rounded-2xl border border-white/10 bg-card flex flex-col min-h-[70vh]">
        {!selectedId || !thread ? (
          <div className="m-auto text-sm text-muted-foreground p-8 text-center">
            Escolha uma conversa à esquerda. Cada e-mail de compra é um fio —
            Pro e Pessoal juntos.
          </div>
        ) : (
          <>
            <header className="px-5 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{thread.email}</p>
                <p className="text-xs text-muted-foreground">
                  {thread.editionsLabel}
                  {thread.resolvedAt
                    ? ` · encerrado em ${new Date(thread.resolvedAt).toLocaleString("pt-BR")}`
                    : ""}
                </p>
              </div>
              {thread.status === "open" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void resolve()}
                >
                  Encerrar atendimento
                </Button>
              )}
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
              <SupportMessageList
                messages={messages}
                perspective="admin"
                emptyLabel="Sem mensagens neste fio."
              />
            </div>
            <div className="px-5 py-4 border-t border-white/5 space-y-2">
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <SupportComposer
                value={draft}
                onChange={setDraft}
                onSend={() => void send()}
                disabled={busy}
                placeholder="Responder ao cliente…"
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
