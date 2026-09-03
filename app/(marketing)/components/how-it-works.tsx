/**
 * Seção "Como funciona"
 * 
 * Apresenta o processo em 3 passos simples:
 * 1. Crie sua conta gratuitamente
 * 2. Organize seus dados financeiros
 * 3. Tome decisões melhores
 */
export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Crie sua conta gratuitamente",
      description:
        "Cadastre-se em segundos, sem necessidade de cartão de crédito.",
    },
    {
      number: "2",
      title: "Organize seus dados financeiros",
      description:
        "Configure seus workspaces, categorias e comece a registrar transações.",
    },
    {
      number: "3",
      title: "Tome decisões melhores",
      description:
        "Use insights e análises para otimizar seu fluxo de caixa e aumentar lucros.",
    },
  ];

  return (
    <section id="como-funciona" className="border-t border-white/5 py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Título da seção */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Simples, rápido e eficiente
            </p>
          </div>

          {/* Lista de passos */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-6 rounded-xl border border-white/5 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                {/* Número do passo */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-lg font-bold text-accent-foreground">
                  {step.number}
                </div>

                {/* Conteúdo */}
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

