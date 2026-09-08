"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import {
  startLicenseCheckout,
  startPixCheckout,
  type LicenseEdition,
} from "./checkout";
import type { LicenseDuration } from "@/lib/prisma-enums";
import {
  editionLabel,
  formatLicensePrice,
  listLicenseOffers,
} from "@/lib/license/catalog";
import {
  readClientAdsContext,
  trackMetaBrowserEvent,
} from "@/lib/ads/meta-client";

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

type PayMethod = "card" | "pix";

export function PlansSection() {
  const [edition, setEdition] = useState<LicenseEdition>("pro");
  const [duration, setDuration] = useState<LicenseDuration>("3m");
  const [method, setMethod] = useState<PayMethod>("card");
  const [email, setEmail] = useState("");
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

  function traffic() {
    const params = new URLSearchParams(window.location.search);
    const ads = readClientAdsContext();
    return {
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      fbp: ads.fbp,
      fbc: ads.fbc,
      eventId: ads.eventId,
      ads,
    };
  }

  function fireCheckoutPixels(eventId: string, value: number) {
    const params = {
      value: value / 100,
      currency: "BRL",
      content_name: `${editionLabel(edition)} · ${offer.label}`,
      content_ids: [`desktop-license:${edition}:${duration}`],
      content_type: "product",
    };
    trackMetaBrowserEvent("InitiateCheckout", `${eventId}:checkout`, params);
    trackMetaBrowserEvent("Lead", `${eventId}:lead`, params);
  }

  function buy() {
    if (!priced) {
      setError("Este prazo ainda não está à venda.");
      return;
    }
    if (method === "pix" && !email.trim().includes("@")) {
      setError("Para PIX, informa o e-mail onde a chave deve chegar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const ctx = traffic();
      fireCheckoutPixels(ctx.eventId, offer.amountCents!);
      const result =
        method === "pix"
          ? await startPixCheckout(edition, duration, email, ctx)
          : await startLicenseCheckout(edition, duration, ctx);
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
                Escolhe a edição, o prazo e como pagar. O serial só nasce se o
                pagamento passar. O relógio começa na ativação, não na compra.
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

              <div className="pay-methods" role="tablist" aria-label="Forma de pagamento">
                <button
                  type="button"
                  className={method === "card" ? "is-active" : undefined}
                  onClick={() => {
                    setMethod("card");
                    setError(null);
                  }}
                >
                  Cartão
                </button>
                <button
                  type="button"
                  className={method === "pix" ? "is-active" : undefined}
                  onClick={() => {
                    setMethod("pix");
                    setError(null);
                  }}
                >
                  PIX
                </button>
              </div>

              {method === "pix" ? (
                <label className="pay-email">
                  <span>E-mail da chave</span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              ) : null}

              <button
                type="button"
                className="btn btn-primary"
                onClick={buy}
                disabled={pending || !priced}
              >
                {pending
                  ? method === "pix"
                    ? "Gerando o PIX…"
                    : "Abrindo o pagamento…"
                  : priced
                    ? method === "pix"
                      ? `Pagar no PIX — ${priceLabel}`
                      : `Comprar no cartão — ${priceLabel}`
                    : "Preço a definir"}
              </button>
              {method === "pix" ? (
                <p className="pay-note">
                  O PIX é processado pela Pushin Pay. Depois do pagamento, a
                  chave e o instalador (Windows e Mac) saem no e-mail e nesta
                  tela.
                </p>
              ) : (
                <p className="pay-note">
                  Cartão via Stripe. O e-mail da chave é o que você informa no
                  checkout.
                </p>
              )}
              {error ? <p className="plan-error">{error}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
