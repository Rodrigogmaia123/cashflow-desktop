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
    id: "dashboard",
    tab: "Dashboard",
    title: "dashboard · setembro",
    caption:
      "Investimento, faturamento, taxas, lucro e ROI do mês — e a evolução logo abaixo.",
    src: "/images/lp/dashboard-hero.png",
    alt: "Dashboard do Cashflow Pro com investimento, faturamento, taxas, lucro, ROI e gráfico do período",
  },
  {
    id: "visao",
    tab: "Visão geral",
    title: "visão geral · lucro",
    caption:
      "Receita, despesa, lucro líquido e ROI. A saúde do caixa fica no mesmo painel.",
    src: "/images/lp/visao-geral.png",
    alt: "Visão geral do Cashflow Pro com receita, despesas, lucro líquido e ROI",
  },
  {
    id: "ofertas",
    tab: "Ofertas",
    title: "ofertas · radar",
    caption:
      "Cria a oferta e vê o radar: ROI, país e se a campanha está ativa.",
    src: "/images/lp/ofertas.png",
    alt: "Lista de ofertas do Cashflow Pro com ROI de cada campanha e formulário para criar oferta",
  },
  {
    id: "oferta",
    tab: "Uma oferta",
    title: "oferta · resultado",
    caption:
      "Uma campanha aberta: investimento, faturamento, taxa, lucro e ROI real.",
    src: "/images/lp/oferta.png",
    alt: "Dashboard de uma oferta do Cashflow Pro com investimento, faturamento, taxa, lucro e ROI",
  },
  {
    id: "comparar",
    tab: "Comparar",
    title: "ofertas · comparação",
    caption:
      "Até três ofertas na mesma métrica, para ver qual deixou mais.",
    src: "/images/lp/comparar-ofertas.png",
    alt: "Comparação de lucro entre ofertas no dashboard do Cashflow Pro",
  },
  {
    id: "despesas",
    tab: "Despesas",
    title: "fluxo de caixa · saídas",
    caption:
      "Para onde saiu: origem, categoria e taxa da oferta. Anúncio e ferramenta no mesmo lugar.",
    src: "/images/lp/despesas.png",
    alt: "Fluxo de caixa do Cashflow Pro com gráficos de saída e lista de despesas",
  },
  {
    id: "entradas",
    tab: "Entradas",
    title: "fluxo de caixa · entradas",
    caption:
      "O que entrou e o que foi aportado, separado da despesa do dia.",
    src: "/images/lp/investimentos.png",
    alt: "Lançamentos de receita e investimentos do período no Cashflow Pro",
  },
  {
    id: "projetos",
    tab: "Projetos",
    title: "projetos · planejado",
    caption:
      "Planejado não entra no caixa. Quando você paga, vira despesa de verdade.",
    src: "/images/lp/projetos.png",
    alt: "Projeto de escala no Cashflow Pro com planejado, pago e o que ainda falta pagar",
  },
  {
    id: "orcamentos",
    tab: "Orçamentos",
    title: "orçamentos · teto",
    caption:
      "Teto por categoria. O que estourou aparece aqui, não só no extrato.",
    src: "/images/lp/orcamentos.png",
    alt: "Orçamentos do Cashflow Pro com categorias no limite e categorias que estouraram",
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
    <ShotWindow title={shot.title} src={shot.src} alt={shot.alt} />
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
