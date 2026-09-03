"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Seção "Veja exatamente o que você vai ter acesso"
 * 
 * Mostra screenshots reais do produto com sistema de abas interativo.
 * Cada screenshot tem título e descrição focada em benefício.
 * 
 * Design: Elegante, moderno, dark mode, animações suaves
 */
type PreviewItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

const previews: PreviewItem[] = [
  {
    id: "overview",
    title: "Visão Geral Executiva",
    description:
      "Tenha uma visão completa da saúde financeira do seu negócio em um único lugar. Métricas essenciais, tendências e insights automáticos.",
    image: "/images/preview-overview.png",
    imageAlt: "Preview da visão geral executiva do Cashflow Pro",
  },
  {
    id: "dashboard",
    title: "Dashboard Inteligente",
    description:
      "Acompanhe investimento, retorno, lucro e ROI em tempo real. Sem planilhas confusas, tudo organizado e visual.",
    image: "/images/preview-dashboard.png",
    imageAlt: "Preview do dashboard principal com métricas financeiras",
  },
  {
    id: "cashflow",
    title: "Fluxo de Caixa Detalhado",
    description:
      "Entradas, saídas, despesas e saldo acumulado organizados por período. Visualize padrões e tome decisões mais inteligentes.",
    image: "/images/preview-cashflow.png",
    imageAlt: "Preview da visualização de fluxo de caixa",
  },
  {
    id: "offers",
    title: "Performance por Oferta",
    description:
      "Descubra quais ofertas realmente dão lucro e onde ajustar sua estratégia. Análise profunda de ROI e rentabilidade.",
    image: "/images/preview-offers.png",
    imageAlt: "Preview da análise de performance por oferta",
  },
];

export function ProductPreview() {
  const [activeTab, setActiveTab] = useState(previews[0].id);

  const activePreview = previews.find((p) => p.id === activeTab) || previews[0];

  return (
    <section
      id="veja-como-funciona"
      className="border-t border-white/5 bg-background py-20 sm:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header da seção */}
          <div className="mb-12 text-center sm:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Veja exatamente o que você vai ter acesso
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Nada de promessas vagas. Explore o painel antes mesmo de criar
              conta.
            </p>
          </div>

          {/* Sistema de abas */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {previews.map((preview) => {
                const isActive = activeTab === preview.id;
                return (
                  <button
                    key={preview.id}
                    onClick={() => setActiveTab(preview.id)}
                    className={cn(
                      "group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 sm:px-6 sm:py-3 sm:text-base",
                      "border border-white/10 bg-card-secondary/50 backdrop-blur-sm",
                      "hover:border-primary/30 hover:bg-card-hover",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive &&
                        "border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-foreground shadow-lg shadow-primary/10"
                    )}
                  >
                    <span className="relative z-10">{preview.title}</span>
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview ativo com animação fade-in */}
          <div
            key={activeTab}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-card via-card-hover to-background-secondary shadow-2xl transition-all duration-500 hover:border-primary/30 hover:shadow-primary/10"
          >
            {/* Conteúdo do preview */}
            <div className="grid gap-8 p-6 sm:gap-12 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-12">
              {/* Texto */}
              <div className="space-y-4 lg:space-y-6">
                <div>
                  <h3 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                    {activePreview.title}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
                    {activePreview.description}
                  </p>
                </div>
              </div>

              {/* Imagem otimizada com Next.js Image */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-background-secondary">
                <Image
                  src={activePreview.image}
                  alt={activePreview.imageAlt}
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                  priority={activeTab === previews[0].id}
                  quality={90}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  unoptimized={true}
                />
                {/* Overlay sutil no hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </div>

            {/* Indicador de borda animado */}
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 transition-all duration-500 group-hover:border-primary/20" />
          </div>

          {/* Grid de mini previews (opcional - visual alternativo) */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-12 sm:grid-cols-4 sm:gap-6">
            {previews.map((preview) => {
              const isActive = activeTab === preview.id;
              return (
                <button
                  key={preview.id}
                  onClick={() => setActiveTab(preview.id)}
                  className={cn(
                    "group relative aspect-video overflow-hidden rounded-lg border transition-all duration-300",
                    isActive
                      ? "border-primary/50 shadow-lg shadow-primary/10 ring-2 ring-primary/30"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <Image
                    src={preview.image}
                    alt={preview.imageAlt}
                    fill
                    className={cn(
                      "object-contain transition-all duration-300",
                      isActive
                        ? "scale-100 opacity-100"
                        : "scale-105 opacity-60 group-hover:scale-100 group-hover:opacity-80"
                    )}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    unoptimized={true}
                  />
                  {/* Overlay escuro quando não ativo */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-background/40 transition-all duration-300 group-hover:bg-background/20" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Micro CTA */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground sm:text-base">
              Não precisa cartão de crédito • Comece grátis em menos de 1 minuto
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
