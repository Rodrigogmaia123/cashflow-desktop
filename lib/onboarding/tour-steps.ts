// Tipo baseado na estrutura esperada pelo driver.js
// Nota: driver.js não aceita "center" como valor de side, mas aceitamos no tipo para flexibilidade
// e fazemos type assertion ao usar no driver()
type TourStep = {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left" | "center";
    align?: "start" | "center" | "end";
    buttons?: Array<{
      text: string;
      action?: () => void;
      class?: string;
    }>;
  };
};

export const TOUR_STEPS: TourStep[] = [
  {
    element: undefined,
    popover: {
      title: "Bem-vindo ao Cashflow Pro",
      description: "Em menos de 2 minutos você vai entender como controlar seu caixa e ter visibilidade financeira completa.",
      side: "center",
      align: "center",
      buttons: [
        {
          text: "Pular",
          action: () => {
            // Será tratado pelo hook
          }
        },
        {
          text: "Começar",
          action: () => {
            // Será tratado pelo hook
          }
        }
      ]
    }
  },
  {
    element: "[data-tour='workspace-selector']",
    popover: {
      title: "Workspace",
      description: "Tudo no sistema é organizado por empresa ou contexto financeiro. Você pode separar negócios diferentes ou até controle pessoal.",
      side: "top",
      align: "start"
    }
  },
  {
    element: "[data-tour='overview-link']",
    popover: {
      title: "Visão Geral",
      description: "Este é o painel principal. Aqui você vê a situação financeira real: quanto entrou, quanto saiu e o lucro final.",
      side: "right",
      align: "start",
      // Se já estiver na página de overview, este passo será pulado automaticamente
      // pelo driver.js quando o elemento não for encontrado ou não estiver visível
    }
  },
  {
    element: "[data-tour='overview-metrics']",
    popover: {
      title: "Métricas Principais",
      description: "Aqui você vê a situação financeira real: quanto entrou (Receita Total), quanto saiu (Despesas Totais) e o lucro final. Os valores são calculados automaticamente com base nas suas ofertas, despesas e entradas manuais. Quando você começar a adicionar dados, eles aparecerão aqui automaticamente.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "[data-tour='dashboard-link']",
    popover: {
      title: "Dashboard Analítico",
      description: "Clique aqui para analisar de onde vem o dinheiro e onde ele está sendo gasto.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "[data-tour='dashboard-kpis']",
    popover: {
      title: "Dashboard Analítico",
      description: "Aqui você analisa de onde vem o dinheiro e onde ele está sendo gasto.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "[data-tour='cashflow-link']",
    popover: {
      title: "Fluxo de Caixa",
      description: "Este é o coração financeiro do sistema. Clique aqui para controlar entradas, saídas e saldo real — profissional ou pessoal.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "[data-tour='manual-income']",
    popover: {
      title: "Entradas Manuais",
      description: "Nem todo dinheiro vem de ofertas. Aqui você registra entradas manuais como salários, serviços ou vendas externas.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "[data-tour='expenses-section']",
    popover: {
      title: "Despesas",
      description: "Toda saída de dinheiro deve estar aqui. Despesas pessoais ou da empresa, categorizadas e visíveis.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "[data-tour='offers-link']",
    popover: {
      title: "Ofertas",
      description: "Ofertas são uma das fontes de receita. Clique aqui se você trabalha com campanhas ou produtos e quer acompanhar performance e ROI.",
      side: "right",
      align: "start"
    }
  },
  {
    element: "[data-tour='create-offer-button']",
    popover: {
      title: "Criar Oferta",
      description: "Se você trabalha com campanhas ou produtos, crie uma oferta para acompanhar resultados.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: undefined,
    popover: {
      title: "Pronto!",
      description: "Você não precisa se adaptar ao sistema. O sistema se adapta à sua realidade financeira.",
      side: "center",
      align: "center",
      buttons: [
        {
          text: "Finalizar",
          action: () => {
            // Será tratado pelo hook
          }
        }
      ]
    }
  }
];

export function getTourSteps(edition: "pro" | "pessoal" = "pro"): TourStep[] {
  if (edition !== "pessoal") return TOUR_STEPS;
  const hidden = new Set(["dashboard-link", "dashboard-kpis", "offers-link", "create-offer-button"]);
  return TOUR_STEPS.filter((step) => {
    const element = step.element ?? "";
    return ![...hidden].some((key) => element.includes(key));
  }).map((step) => {
    if (!step.element && step.popover.title.startsWith("Bem-vindo")) {
      return {
        ...step,
        popover: {
          ...step.popover,
          title: "Bem-vindo ao Cashflow Pessoal",
          description:
            "Em menos de 2 minutos você vai entender como controlar seus gastos, entradas e workspaces.",
        },
      };
    }
    if (step.element === "[data-tour='overview-metrics']") {
      return {
        ...step,
        popover: {
          ...step.popover,
          description:
            "Aqui você vê quanto entrou, quanto saiu e o saldo do período. Os valores atualizam quando você registra entradas e despesas.",
        },
      };
    }
    if (step.element === "[data-tour='manual-income']") {
      return {
        ...step,
        popover: {
          ...step.popover,
          title: "Entradas",
          description: "Registre salários, freelance ou qualquer dinheiro que entrou.",
        },
      };
    }
    return step;
  });
}
