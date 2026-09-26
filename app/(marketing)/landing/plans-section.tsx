"use client";

import { useState, useTransition } from "react";
import { startLicenseCheckout, startPixCheckout } from "./checkout";
import type { LicenseDuration } from "@/lib/prisma-enums";
import {
  editionLabel,
  formatLicensePrice,
  type LicenseOffer,
} from "@/lib/license/catalog";
import {
  readClientAdsContext,
  trackMetaBrowserEvent,
} from "@/lib/ads/meta-client";

const INCLUDES = [
  "Visão geral, fluxo de caixa e orçamentos",
  "Ofertas, taxas e ROI de campanha",
  "Relatórios do período, PDF e Excel",
  "1 serial = 1 cópia do app (vale no pendrive)",
];

type PayMethod = "card" | "pix";

export function PlansSection({ offers }: { offers: LicenseOffer[] }) {
  const [duration, setDuration] = useState<LicenseDuration>(
    offers[0]?.duration ?? "annual"
  );
  const [method, setMethod] = useState<PayMethod>("card");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lifetimeOn = offers.some((item) => item.duration === "lifetime");
  const offer = offers.find((item) => item.duration === duration) ?? offers[0];
  const priced = offer?.amountCents != null;
  const priceLabel = priced
    ? formatLicensePrice(offer.amountCents!)
    : "A definir";
  const monthlyHint =
    offer?.duration === "annual" && offer.amountCents != null
      ? `Equivale a cerca de ${formatLicensePrice(Math.round(offer.amountCents / 12))} por mês no período de 12 meses`
      : null;

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
    if (!offer) return;
    const params = {
      value: value / 100,
      currency: "BRL",
      content_name: `${editionLabel("pro")} · ${offer.label}`,
      content_ids: [`desktop-license:pro:${duration}`],
      content_type: "product",
    };
    trackMetaBrowserEvent("InitiateCheckout", `${eventId}:checkout`, params);
    trackMetaBrowserEvent("Lead", `${eventId}:lead`, params);
  }

  function buy() {
    if (!offer || !priced) {
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
          ? await startPixCheckout("pro", duration, email, ctx)
          : await startLicenseCheckout("pro", duration, ctx);
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
              <h2>Cashflow Pro, pagamento único</h2>
              <p>
                {lifetimeOn
                  ? "12 meses por R$ 97 ou vitalício por R$ 147. Nenhum dos dois é mensalidade. O serial só nasce se o pagamento passar. Nos 12 meses, o relógio começa na ativação — não na compra."
                  : "12 meses por R$ 97, sem mensalidade recorrente. O serial só nasce se o pagamento passar. O relógio começa na ativação — não na compra."}
              </p>
            </div>

            <div className="plan-durations" role="tablist" aria-label="Prazo">
              {offers.map((item) => (
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
              <li>
                {offer?.duration === "lifetime"
                  ? "Vitalício: sem data de validade, a partir da ativação."
                  : "12 meses contam a partir da ativação, não do pagamento."}
              </li>
              <li>O caixa fica no seu computador, não na nuvem.</li>
              <li>Um serial, uma cópia — vale no pendrive.</li>
            </ul>
          </div>

          <div className="plans-single reveal in">
            <div className="plan-card destaque glass">
              <div className="badge">PAGAMENTO ÚNICO</div>
              <div className="plan-name">
                {editionLabel("pro")} · {offer?.label ?? "12 meses"}
              </div>
              <div className="plan-price">{priceLabel}</div>
              {monthlyHint ? <p className="equiv">{monthlyHint}</p> : null}
              <div className="plan-sub">{offer?.sublabel} · sem mensalidade</div>
              <ul>
                {INCLUDES.map((item) => (
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
