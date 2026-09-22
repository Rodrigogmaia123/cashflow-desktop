import { Suspense } from "react";
import "../../(marketing)/landing.css";
import { display, mono, sans } from "../../(marketing)/landing/fonts";
import { PixCheckoutClient } from "./pix-client";

export const metadata = {
  title: "Pagar no PIX — Cashflow",
  description: "QR Code PIX para liberar o serial da licença desktop.",
};

function PixFallback() {
  return (
    <div className="cta-final glass success-panel">
      <div className="cta-glow" />
      <h2>Gerando o PIX…</h2>
      <p>Estamos montando o QR Code da cobrança.</p>
    </div>
  );
}

export default function PixCheckoutPage() {
  return (
    <div className={`lp ${display.variable} ${sans.variable} ${mono.variable}`}>
      <div className="bg-fx" aria-hidden>
        <div className="blob blob-lime" />
        <div className="blob blob-violet" />
      </div>
      <header>
        <div className="nav">
          <a href="/" className="brand">
            <img src="/brand/cashflow-icon.png" alt="" className="brand-mark" />
            Cashflow
          </a>
          <a href="/#planos" className="btn btn-ghost">
            Voltar aos planos
          </a>
        </div>
      </header>
      <main>
        <section>
          <div className="wrap">
            <Suspense fallback={<PixFallback />}>
              <PixCheckoutClient />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
