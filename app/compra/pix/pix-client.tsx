"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type PixState =
  | { status: "invalid" }
  | { status: "canceled" }
  | { status: "paid"; sessionId: string }
  | {
      status: "pending";
      sessionId?: string;
      email?: string | null;
      amountCents?: number;
      qrCode?: string | null;
      qrCodeImage?: string | null;
      wait?: boolean;
      message?: string;
    };

function isPixState(value: unknown): value is PixState {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof (value as { status: unknown }).status === "string"
  );
}

function qrSrc(image?: string | null) {
  if (!image) return null;
  if (image.startsWith("data:")) return image;
  return `data:image/png;base64,${image}`;
}

export function PixCheckoutClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const [state, setState] = useState<PixState | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(
          `/api/compra/pix?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        const data: unknown = await res.json();
        if (cancelled || !isPixState(data)) return;
        setState(data);
        if (data.status === "paid") {
          window.location.assign(
            `/compra/sucesso?session_id=${encodeURIComponent(sessionId)}`
          );
          return;
        }
        if (data.status === "invalid" || data.status === "canceled") return;
      } catch {
        if (cancelled) return;
      }
      window.setTimeout(tick, 3000);
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const pending = state?.status === "pending" ? state : null;
  const image = qrSrc(pending?.qrCodeImage);

  const heading = useMemo(() => {
    if (!sessionId) return "Não encontramos este PIX.";
    if (state?.status === "canceled") return "Este PIX foi cancelado.";
    if (state?.status === "invalid") return "Este PIX não vale.";
    if (state?.status === "paid") return "Pagamento confirmado.";
    return "Pague no PIX para liberar a chave.";
  }, [sessionId, state]);

  async function copyCode() {
    const code = pending?.qrCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function alreadyPaid() {
    setConfirming(true);
    try {
      const res = await fetch("/api/compra/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data: unknown = await res.json();
      if (!isPixState(data)) return;
      setState(data);
      if (data.status === "paid") {
        window.location.assign(
          `/compra/sucesso?session_id=${encodeURIComponent(sessionId)}`
        );
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="cta-final glass success-panel">
      <div className="cta-glow" />
      <h2>{heading}</h2>

      {!sessionId && (
        <p>Volte aos planos e gere um PIX novo. Esta tela não inventa cobrança.</p>
      )}

      {pending && (
        <>
          <p>
            Escaneie o QR ou copie o código. Assim que o PIX cair, geramos o
            serial e mandamos para {pending.email || "o e-mail informado"}. O
            prazo da licença ainda não começou.
          </p>
          {image ? (
            <img
              className="pix-qr"
              src={image}
              alt="QR Code PIX"
              width={220}
              height={220}
            />
          ) : null}
          {pending.qrCode ? (
            <div className="serial-box">
              <span className="serial-label">Copia e cola</span>
              <code className="serial-code pix-emv">{pending.qrCode}</code>
              <button type="button" className="btn btn-ghost" onClick={() => void copyCode()}>
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          ) : (
            <p>O QR ainda está a chegar. Atualize se esta tela ficar vazia.</p>
          )}
          <p className="serial-note">
            PIX processado pela Pushin Pay. Não feche esta página até a
            confirmação — se já pagou, use o botão abaixo (no máximo uma
            consulta por minuto).
          </p>
          <div className="success-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void alreadyPaid()}
              disabled={confirming}
            >
              {confirming ? "Consultando…" : "Já paguei"}
            </button>
            <a href="/#planos" className="btn btn-ghost">
              Voltar aos planos
            </a>
          </div>
          {pending.message ? <p className="plan-error">{pending.message}</p> : null}
        </>
      )}

      {state?.status === "canceled" || state?.status === "invalid" ? (
        <a href="/#planos" className="btn btn-ghost">
          Voltar aos planos
        </a>
      ) : null}
    </div>
  );
}
