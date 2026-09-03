import { Card, CardContent } from "@/components/ui/card";

/**
 * Seção de Funcionalidades
 * 
 * Destaca as principais capacidades do produto:
 * - Visão geral financeira
 * - Fluxo de caixa inteligente
 * - Performance por oferta
 * - Decisões baseadas em dados
 */
export function Features() {
  const features = [
    {
      emoji: "📊",
      title: "Visão geral financeira",
      description:
        "Painel completo com métricas essenciais para entender sua saúde financeira.",
    },
    {
      emoji: "💰",
      title: "Fluxo de caixa inteligente",
      description:
        "Acompanhe entradas, saídas e saldo em tempo real com visualizações claras.",
    },
    {
      emoji: "📈",
      title: "Performance por oferta",
      description:
        "Analise o ROI e lucro real de cada oferta ou produto digital.",
    },
    {
      emoji: "🧠",
      title: "Decisões baseadas em dados",
      description:
        "Insights e alertas inteligentes para tomar decisões financeiras melhores.",
    },
  ];

  return (
    <section id="funcionalidades" className="border-t border-white/5 bg-background-secondary py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Título da seção */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Funcionalidades
            </h2>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para controlar suas finanças
            </p>
          </div>

          {/* Grid de features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group transition-all duration-300 hover:border-accent/30 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-4 text-4xl">{feature.emoji}</div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

