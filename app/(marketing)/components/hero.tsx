import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Hero Section - Primeira impressão da landing page
 * 
 * Apresenta:
 * - Headline principal impactante
 * - Subheadline explicativa
 * - CTAs primário e secundário
 * - Visual com gradiente sutil
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-background via-background to-background-secondary py-20 sm:py-28 lg:py-32">
      {/* Gradiente decorativo de fundo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Headline Principal */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Veja exatamente para onde seu{" "}
            <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              dinheiro está indo
            </span>{" "}
            — pessoal e profissional
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            Um painel simples e poderoso para acompanhar seu fluxo de caixa,
            desempenho financeiro e decisões importantes em um só lugar.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="accent" size="lg" asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">Ver planos e preços</Link>
            </Button>
          </div>

          {/* Subtexto de confiança */}
          <p className="mt-8 text-xs text-muted-foreground">
            Sem cartão de crédito • Comece em segundos
          </p>
        </div>
      </div>
    </section>
  );
}

