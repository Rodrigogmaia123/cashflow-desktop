import { Card, CardContent } from "@/components/ui/card";

/**
 * Seção "Para quem é"
 * 
 * Apresenta os diferentes perfis de usuários que se beneficiam do produto:
 * - Pessoa Física (PF)
 * - Profissionais e PJ
 * - Negócios digitais
 */
export function UseCases() {
  const useCases = [
    {
      emoji: "👤",
      title: "Pessoa Física (PF)",
      description: "Controle financeiro pessoal com clareza.",
    },
    {
      emoji: "🧾",
      title: "Profissionais e PJ",
      description: "Separe pessoal e profissional sem dor.",
    },
    {
      emoji: "🚀",
      title: "Negócios digitais",
      description: "Entenda lucro real e ROI.",
    },
  ];

  return (
    <section id="para-quem-e" className="py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Título da seção */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Para quem é
            </h2>
            <p className="text-lg text-muted-foreground">
              O Cashflow Pro se adapta às suas necessidades financeiras
            </p>
          </div>

          {/* Grid de cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {useCases.map((useCase, index) => (
              <Card
                key={index}
                className="group transition-all duration-300 hover:border-primary/30"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 text-4xl">{useCase.emoji}</div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {useCase.description}
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

