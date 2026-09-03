"use client";

import { useState } from "react";

export type ProductShot = {
  id: string;
  tab: string;
  title: string;
  caption: string;
  src: string;
  alt: string;
};

export const PRODUCT_SHOTS: ProductShot[] = [
  {
    id: "caixa",
    tab: "Caixa",
    title: "fluxo de caixa · cards",
    caption:
      "Lucro, receita, saída e projeção do período — no mesmo lugar, sem abrir planilha.",
    src: "/images/lp/cashflow-cards.png",
    alt: "Tela de fluxo de caixa do Cashflow com cards de lucro, receita, saídas e projeção",
  },
  {
    id: "evolucao",
    tab: "Evolução",
    title: "fluxo de caixa · gráfico",
    caption:
      "Entradas, saídas e saldo no gráfico do mês. O insight avisa quando uma origem concentra demais a receita.",
    src: "/images/lp/cashflow-chart.png",
    alt: "Gráfico de evolução do cashflow com entradas, saídas e saldo acumulado",
  },
  {
    id: "ofertas",
    tab: "Ofertas",
    title: "ofertas · ROI",
    caption:
      "Radar das ofertas: ROI, faturamento e país. Só na edição Pro.",
    src: "/images/lp/offers.png",
    alt: "Grade de ofertas do Cashflow Pro com ROI e faturamento de cada campanha",
  },
  {
    id: "projetos",
    tab: "Projetos",
    title: "projetos · teto",
    caption:
      "Planejado não mistura com o caixa. Pago vira despesa de verdade. Reforma, estoque, viagem — separado.",
    src: "/images/lp/plans.png",
    alt: "Tela de projetos do Cashflow com planejado, pago e itens ainda a pagar",
  },
  {
    id: "despesas",
    tab: "Despesas",
    title: "fluxo de caixa · lançamentos",
    caption:
      "Onde o dinheiro saiu: categoria, Pix ou cartão, banco. Dá para lançar entrada e investimento na mesma tela.",
    src: "/images/lp/cashflow-expenses.png",
    alt: "Lista de despesas do período no Cashflow, com categoria e forma de pagamento",
  },
];

function ShotWindow({
  title,
  src,
  alt,
}: {
  title: string;
  src: string;
  alt: string;
}) {
  return (
    <div className="panel glass shot-window">
      <div className="panel-bar">
        <span />
        <span />
        <span />
        <span className="title">{title}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="shot-img" />
    </div>
  );
}

export function HeroShot() {
  const shot = PRODUCT_SHOTS[0];
  return (
    <ShotWindow title="fluxo de caixa · agosto" src={shot.src} alt={shot.alt} />
  );
}

export function ProductShots() {
  const [active, setActive] = useState(0);
  const shot = PRODUCT_SHOTS[active];

  return (
    <div className="shots">
      <div className="shot-tabs" role="tablist" aria-label="Telas do programa">
        {PRODUCT_SHOTS.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`shot-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`shot-panel-${item.id}`}
              className={`shot-tab${selected ? " is-active" : ""}`}
              onClick={() => setActive(index)}
            >
              {item.tab}
            </button>
          );
        })}
      </div>

      <div
        id={`shot-panel-${shot.id}`}
        role="tabpanel"
        aria-labelledby={`shot-tab-${shot.id}`}
        className="shot-stage"
      >
        <ShotWindow title={shot.title} src={shot.src} alt={shot.alt} />
        <p className="shot-caption">{shot.caption}</p>
      </div>

      <div className="shot-thumbs">
        {PRODUCT_SHOTS.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={`${item.id}-thumb`}
              type="button"
              className={`shot-thumb${selected ? " is-active" : ""}`}
              onClick={() => setActive(index)}
              aria-label={item.tab}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt="" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
