"use client";

import { useRef, useState } from "react";

export type ProductShot = {
  id: string;
  tab: string;
  title: string;
  caption: string;
  src: string;
  beforeSrc?: string;
  alt: string;
  seal?: string;
};

export const PRODUCT_SHOTS: ProductShot[] = [
  {
    id: "dashboard",
    tab: "Dashboard",
    title: "dashboard · setembro",
    caption:
      "Investimento, faturamento, taxas, lucro e ROI do mês — e a evolução logo abaixo.",
    src: "/images/lp/dashboard-hero.png",
    beforeSrc: "/images/lp/antes/dashboard-hero.png",
    alt: "Dashboard do Cashflow Pro com investimento, faturamento, taxas, lucro, ROI e gráfico do período",
  },
  {
    id: "visao",
    tab: "Visão geral",
    title: "visão geral · lucro",
    caption:
      "Receita, despesa, lucro líquido e ROI. A saúde do caixa fica no mesmo painel.",
    src: "/images/lp/visao-geral.png",
    beforeSrc: "/images/lp/antes/visao-geral.png",
    alt: "Visão geral do Cashflow Pro com receita, despesas, lucro líquido e ROI",
  },
  {
    id: "ofertas",
    tab: "Ofertas",
    title: "ofertas · radar",
    caption:
      "Cria a oferta e vê o radar: ROI, país e se a campanha está ativa.",
    src: "/images/lp/ofertas.png",
    beforeSrc: "/images/lp/antes/ofertas.png",
    alt: "Lista de ofertas do Cashflow Pro com ROI de cada campanha e formulário para criar oferta",
  },
  {
    id: "oferta",
    tab: "Uma oferta",
    title: "oferta · resultado",
    caption:
      "Uma campanha aberta: investimento, faturamento, taxa, lucro e ROI real.",
    src: "/images/lp/oferta.png",
    beforeSrc: "/images/lp/antes/oferta.png",
    alt: "Dashboard de uma oferta do Cashflow Pro com investimento, faturamento, taxa, lucro e ROI",
  },
  {
    id: "comparar",
    tab: "Comparar",
    title: "ofertas · comparação",
    caption:
      "Até três ofertas na mesma métrica, para ver qual deixou mais.",
    src: "/images/lp/comparar-ofertas.png",
    beforeSrc: "/images/lp/antes/comparar-ofertas.png",
    alt: "Comparação de lucro entre ofertas no dashboard do Cashflow Pro",
  },
  {
    id: "despesas",
    tab: "Despesas",
    title: "fluxo de caixa · saídas",
    caption:
      "Para onde saiu: origem, categoria e taxa da oferta. Anúncio e ferramenta no mesmo lugar.",
    src: "/images/lp/despesas.png",
    beforeSrc: "/images/lp/antes/despesas.png",
    alt: "Fluxo de caixa do Cashflow Pro com gráficos de saída e lista de despesas",
  },
  {
    id: "entradas",
    tab: "Entradas",
    title: "fluxo de caixa · entradas",
    caption:
      "O que entrou e o que foi aportado, separado da despesa do dia.",
    src: "/images/lp/investimentos.png",
    beforeSrc: "/images/lp/antes/investimentos.png",
    alt: "Lançamentos de receita e investimentos do período no Cashflow Pro",
  },
  {
    id: "projetos",
    tab: "Projetos",
    title: "projetos · planejado",
    caption:
      "Planejado não entra no caixa. Quando você paga, vira despesa de verdade.",
    src: "/images/lp/projetos.png",
    beforeSrc: "/images/lp/antes/projetos.png",
    alt: "Projeto de escala no Cashflow Pro com planejado, pago e o que ainda falta pagar",
  },
  {
    id: "orcamentos",
    tab: "Orçamentos",
    title: "orçamentos · teto",
    caption:
      "Teto por categoria. O que estourou aparece aqui, não só no extrato.",
    src: "/images/lp/orcamentos.png",
    beforeSrc: "/images/lp/antes/orcamentos.png",
    alt: "Orçamentos do Cashflow Pro com categorias no limite e categorias que estouraram",
  },
  {
    id: "anotacoes",
    tab: "Anotações",
    title: "anotações · agenda",
    caption:
      "Agenda do dia e notas avulsas, com tarefa, lembrete e checklist.",
    src: "/images/lp/anotacoes.png",
    alt: "Anotações do Cashflow Pro com calendário e lista do dia",
    seal: "Novo",
  },
];

function BeforeAfter({
  before,
  after,
  alt,
}: {
  before: string;
  after: string;
  alt: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const [pos, setPos] = useState(58);

  function move(clientX: number) {
    const el = frame.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(94, Math.max(6, next)));
  }

  return (
    <div
      ref={frame}
      className="compare"
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      aria-label="Arraste para comparar o visual anterior e o novo"
      onPointerDown={(event) => {
        drag.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        move(event.clientX);
      }}
      onPointerUp={() => {
        drag.current = false;
      }}
      onPointerCancel={() => {
        drag.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") setPos((value) => Math.max(6, value - 4));
        if (event.key === "ArrowRight") setPos((value) => Math.min(94, value + 4));
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={alt} className="shot-img" draggable={false} />
      <div className="compare-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="" draggable={false} />
      </div>
      <div className="compare-bar" style={{ left: `${pos}%` }}>
        <span className="compare-grip" aria-hidden>
          <i />
          <i />
        </span>
      </div>
      <span className="compare-tag compare-tag-before">Antes</span>
      <span className="compare-tag compare-tag-after">Depois</span>
    </div>
  );
}

function ShotWindow({ shot }: { shot: ProductShot }) {
  return (
    <div className="panel glass shot-window">
      <div className="panel-bar">
        <span />
        <span />
        <span />
        <span className="title">{shot.title}</span>
      </div>
      <div className="shot-frame">
        {shot.beforeSrc ? (
          <BeforeAfter before={shot.beforeSrc} after={shot.src} alt={shot.alt} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={shot.src} alt={shot.alt} className="shot-img" />
        )}
        {shot.seal ? <span className="shot-seal">{shot.seal}</span> : null}
      </div>
    </div>
  );
}

export function HeroShot() {
  return <ShotWindow shot={PRODUCT_SHOTS[0]} />;
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
        <ShotWindow key={shot.id} shot={shot} />
        <p className="shot-caption">
          {shot.caption}
          {shot.beforeSrc ? " Arraste a barra para ver o antes e o depois." : ""}
        </p>
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
              {item.seal ? <span className="shot-thumb-seal">{item.seal}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
