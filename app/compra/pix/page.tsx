import { Suspense } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "../../(marketing)/landing.css";
import { PixCheckoutClient } from "./pix-client";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-lp-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lp-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-lp-mono",
});

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
            <span className="brand-mark" />
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
