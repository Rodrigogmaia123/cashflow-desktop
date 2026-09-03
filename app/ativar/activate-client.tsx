"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSerialInput } from "@/lib/license/serial-format";
import { activateDesktopLicense } from "./actions";

export function ActivateLicenseClient({
  productName,
}: {
  productName: string;
}) {
  const [serial, setSerial] = useState("CF-");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await activateDesktopLicense(serial);
      if (!result.ok) {
        setError(result.message);
        setPending(false);
        return;
      }
      window.location.replace("/app/overview");
    } catch {
      window.location.replace("/app/overview");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Serial Key
        </span>
        <Input
          autoFocus
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          value={serial}
          onChange={(event) => setSerial(formatSerialInput(event.target.value))}
          onPaste={(event) => {
            event.preventDefault();
            setSerial(formatSerialInput(event.clipboardData.getData("text")));
          }}
          placeholder="CF-XXXX-XXXX-XXXX-XXXX"
          className="h-12 font-mono text-base tracking-[0.12em]"
        />
      </label>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full h-11" disabled={pending}>
        {pending ? "Ativando…" : `Ativar ${productName}`}
      </Button>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Esta cópia confirma a chave de tempos em tempos. Sem internet, segue
        por alguns dias no último sim. Pendrive da mesma pasta continua
        válido; instalador novo sem essa cópia não abre.
      </p>
    </form>
  );
}
