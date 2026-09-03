"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LicenseReveal } from "@/lib/license/types";

const POLL_MS = 2000;
const TIMEOUT_MS = 60_000;

function isReveal(value: unknown): value is LicenseReveal {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof (value as { status: unknown }).status === "string"
  );
}

export function PurchaseSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const [reveal, setReveal] = useState<LicenseReveal | null>(null);
  const [copied, setCopied] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const heading = useMemo(() => {
    if (!sessionId) return "Não encontramos esta compra.";
    if (reveal?.status === "ready") return "Sua chave está pronta.";
    if (reveal?.status === "unpaid") return "O pagamento ainda não caiu.";
    if (reveal?.status === "invalid") return "Esta sessão de pagamento não vale.";
    if (timedOut) return "A confirmação está demorando.";
    return "Confirmando o pagamento…";
  }, [reveal, sessionId, timedOut]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const started = Date.now();

    async function tick() {
      try {
        const res = await fetch(
          `/api/compra/licenca?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        const data: unknown = await res.json();
        if (cancelled || !isReveal(data)) return;
        setReveal(data);
        if (data.status === "ready" || data.status === "invalid") {
          return;
        }
      } catch {
        if (cancelled) return;
      }

      if (Date.now() - started >= TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }
      window.setTimeout(tick, POLL_MS);
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function copySerial(serial: string) {
    try {
      await navigator.clipboard.writeText(serial);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const ready = reveal?.status === "ready" ? reveal : null;

  return (
    <div className="cta-final glass success-panel">
      <div className="cta-glow" />
      <h2>{heading}</h2>

      {!sessionId && (
        <p>
          Abra o link que o Stripe envia depois do pagamento, ou o que chegou
          no e-mail. Esta página não inventa serial.
        </p>
      )}

      {sessionId && !ready && reveal?.status !== "unpaid" && reveal?.status !== "invalid" && (
        <p>
          {timedOut
            ? "O webhook do Stripe ainda não confirmou esta sessão. Atualize a página daqui a um minuto — a chave só aparece depois do pagamento registrado no servidor."
            : "Estamos esperando a confirmação do Stripe. Se o e-mail atrasar, esta tela consulta de novo sozinha. O prazo da licença ainda não começou."}
        </p>
      )}

      {reveal?.status === "unpaid" && (
        <p>
          Esta sessão ainda não está paga. Se você acabou de pagar, espere um
          instante e atualize. Nada é gerado no navegador.
        </p>
      )}

      {reveal?.status === "invalid" && (
        <p>
          O identificador da sessão não corresponde a uma compra de licença
          desktop.
        </p>
      )}

      {ready && (
        <>
          <p>
            {ready.editionLabel} · {ready.durationLabel}. O relógio só anda
            quando você colar esta chave no programa — ainda não é nesta
            tela.
          </p>
          <div className="serial-box">
            <span className="serial-label">Serial</span>
            <code className="serial-code">{ready.serial}</code>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void copySerial(ready.serial)}
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="serial-note">
            A mesma chave vale para {ready.email}
            {ready.emailed ? ", e também vai por e-mail." : ". O e-mail pode ter ficado na fila."}{" "}
            Uma chave, uma cópia.
          </p>
          <div className="success-actions">
            <a
              href={
                ready.installerUrl ||
                `/download/${ready.edition === "pessoal" ? "pessoal" : "pro"}`
              }
              className="btn btn-primary"
            >
              Baixar o instalador
            </a>
            <a href="/" className="btn btn-ghost">
              Voltar ao início
            </a>
          </div>
        </>
      )}

      {!ready && (
        <a href="/" className="btn btn-ghost">
          Voltar ao início
        </a>
      )}
    </div>
  );
}
