"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSerialInput } from "@/lib/license/serial-format";
import { SUPPORT_CUSTOMER_POLL_MS } from "@/lib/support/constants";
import {
  desktopSupportSend,
  desktopSupportState,
  desktopSupportUnlock,
  type DesktopSupportView,
} from "@/app/app/support/desktop-actions";
import { SupportComposer, SupportMessageList } from "./support-chat";

export function CustomerSupportDesk({ compact }: { compact?: boolean }) {
  const [view, setView] = useState<DesktopSupportView | null>(null);
  const [draft, setDraft] = useState("");
  const [serial, setSerial] = useState("CF-");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    const next = await desktopSupportState();
    setView(next);
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), SUPPORT_CUSTOMER_POLL_MS);
    const onVis = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  async function unlock(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const next = await desktopSupportUnlock({ serial, email });
    setView(next);
    if (next.error) setError(next.error);
    setBusy(false);
  }

  async function send() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    const next = await desktopSupportSend(draft);
    setView(next);
    if (next.error) setError(next.error);
    else setDraft("");
    setBusy(false);
  }

  const needsProof = view?.needsProof ?? true;

  return (
    <Card className={compact ? "border-white/10" : undefined}>
      <CardHeader>
        <div className="space-y-1">
          <h2 className="font-semibold">Falar com o suporte</h2>
          <p className="text-xs font-normal text-muted-foreground">
            {view?.offline
              ? "Sem internet agora. O programa segue; a conversa sobe quando conectar."
              : view?.emailMasked
                ? `Atendimento como ${view.emailMasked}`
                : "Mesmo canal da operação. Pro e Pessoal entram no mesmo e-mail de compra."}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsProof ? (
          <form onSubmit={unlock} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Quem já pagou e ainda não ativou também entra: use a chave ou o
              e-mail da compra.
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Chave (se tiver)</span>
              <Input
                spellCheck={false}
                value={serial}
                onChange={(event) => setSerial(formatSerialInput(event.target.value))}
                placeholder="CF-XXXX-XXXX-XXXX-XXXX"
                className="font-mono"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">E-mail da compra</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
              />
            </label>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Abrindo…" : "Abrir conversa"}
            </Button>
          </form>
        ) : (
          <>
            {view?.status === "resolved" && (
              <p className="text-xs text-muted-foreground rounded-xl border border-white/10 px-3 py-2">
                Este atendimento foi encerrado. Uma nova mensagem reabre o
                chamado. O histórico some depois de {view.historyDays} dias.
              </p>
            )}
            <div className={compact ? "max-h-[280px] overflow-y-auto pr-1 scrollbar-thin" : "max-h-[420px] overflow-y-auto pr-1 scrollbar-thin"}>
              <SupportMessageList
                messages={view?.messages ?? []}
                pending={view?.pending ?? []}
                emptyLabel="Nenhuma mensagem ainda. Descreva o que aconteceu."
              />
            </div>
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
              placeholder="Escreva para o suporte…"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
