"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import {
  startLicenseCheckout,
  type LicenseEdition,
} from "./checkout";
import type { LicenseDuration } from "@/lib/prisma-enums";
import {
  editionLabel,
  formatLicensePrice,
  listLicenseOffers,
} from "@/lib/license/catalog";

const INCLUDES: Record<LicenseEdition, string[]> = {
  pro: [
    "Visão geral, fluxo de caixa e orçamentos",
    "Ofertas, taxas e ROI de campanha",
    "Relatórios do período, PDF e Excel",
    "1 serial = 1 cópia do app (vale no pendrive)",
  ],
  pessoal: [
    "Visão geral, fluxo de caixa e orçamentos",
    "Contas recorrentes e captura rápida",
    "Relatórios do período",
    "1 serial = 1 cópia do app (vale no pendrive)",
  ],
};

const OFFERS = listLicenseOffers();

export function PlansSection() {
  const [edition, setEdition] = useState<LicenseEdition>("pro");
  const [duration, setDuration] = useState<LicenseDuration>("3m");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const proRef = useRef<HTMLButtonElement>(null);
  const pessoalRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState({ width: 0, x: 0 });

  const offer = OFFERS.find((item) => item.duration === duration) ?? OFFERS[0];
  const priced = offer.amountCents != null;
  const priceLabel = priced
    ? formatLicensePrice(offer.amountCents!)
    : "A definir";

  useLayoutEffect(() => {
    const active = edition === "pro" ? proRef.current : pessoalRef.current;
    if (!active) return;
    setIndicator({ width: active.offsetWidth, x: active.offsetLeft });
  }, [edition]);

  function buy() {
    if (!priced) {
      setError("Este prazo ainda não está à venda.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const params = new URLSearchParams(window.location.search);
      const result = await startLicenseCheckout(edition, duration, {
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <section id="planos">
      <div className="wrap">
        <div className="plans-layout">
          <div className="plans-copy reveal in">
            <div className="head">
              <div className="kicker">PLANO</div>
              <h2>Um prazo, uma chave, uma cópia do programa</h2>
              <p>
                Escolhe a edição e o prazo. O serial só nasce se o pagamento
                passar. O relógio começa na ativação, não na compra.
              </p>
            </div>

            <div
              ref={wrapRef}
              className="toggle glass"
              role="tablist"
              aria-label="Edição"
            >
              <div
                className="toggle-indicator"
                style={{
                  width: indicator.width,
                  transform: `translateX(${indicator.x}px)`,
                }}
              />
              <button
                ref={proRef}
                type="button"
                className={edition === "pro" ? "active" : undefined}
                onClick={() => setEdition("pro")}
              >
                Cashflow Pro
              </button>
              <button
                ref={pessoalRef}
                type="button"
                className={edition === "pessoal" ? "active" : undefined}
                onClick={() => setEdition("pessoal")}
              >
                Cashflow Pessoal
              </button>
            </div>

            <div className="plan-durations" role="tablist" aria-label="Prazo">
              {OFFERS.map((item) => (
                <button
                  key={item.duration}
                  type="button"
                  className={duration === item.duration ? "is-active" : undefined}
                  onClick={() => {
                    setDuration(item.duration);
                    setError(null);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <ul className="plans-points">
              <li>O prazo começa quando você ativa, não quando paga.</li>
              <li>O caixa fica no seu computador, não na nuvem.</li>
              <li>Um serial, uma cópia — vale no pendrive.</li>
            </ul>
          </div>

          <div className="plans-single reveal in">
            <div className="plan-card destaque glass">
              <div className="badge">PAGAMENTO ÚNICO</div>
              <div className="plan-name">
                {editionLabel(edition)} · {offer.label}
              </div>
              <div className="plan-price">{priceLabel}</div>
              <div className="plan-sub">{offer.sublabel} · sem mensalidade</div>
              <ul>
                {INCLUDES[edition].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                onClick={buy}
                disabled={pending || !priced}
              >
                {pending
                  ? "Abrindo o pagamento…"
                  : priced
                    ? `Comprar ${offer.label} — ${priceLabel}`
                    : "Preço a definir"}
              </button>
              {error ? <p className="plan-error">{error}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
