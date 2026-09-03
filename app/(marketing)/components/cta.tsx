import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * CTA Final - Call to Action principal
 * 
 * Última oportunidade de conversão antes do footer.
 * Foca em eliminar objeções e direcionar para cadastro.
 */
export function CTA() {
  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-background-secondary to-background py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Título principal */}
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Comece a ter controle financeiro de verdade hoje
          </h2>

          {/* Subtexto */}
          <p className="mb-8 text-lg text-muted-foreground">
            Junte-se a quem já está tomando decisões financeiras mais
            inteligentes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="accent" size="lg" className="text-base" asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base" asChild>
              <Link href="/pricing">Ver planos e preços</Link>
            </Button>
          </div>

          {/* Subtexto de confiança */}
          <p className="mt-6 text-sm text-muted-foreground">
            Sem cartão de crédito • Setup em minutos • Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}

