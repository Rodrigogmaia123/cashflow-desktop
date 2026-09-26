import { Suspense } from "react";
import "../../(marketing)/landing.css";
import { display, mono, sans } from "../../(marketing)/landing/fonts";
import { PurchaseSuccessClient } from "./success-client";

export const metadata = {
  title: "Pagamento recebido — Cashflow",
  description: "Serial e instalador da sua licença desktop.",
};

function SuccessFallback() {
  return (
    <div className="cta-final glass success-panel">
      <div className="cta-glow" />
      <h2>Confirmando o pagamento…</h2>
      <p>Estamos esperando a confirmação do pagamento.</p>
    </div>
  );
}

export default function PurchaseSuccessPage() {
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
          <a href="/" className="btn btn-ghost">
            Voltar ao início
          </a>
        </div>
      </header>
      <main>
        <section>
          <div className="wrap">
            <Suspense fallback={<SuccessFallback />}>
              <PurchaseSuccessClient />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
