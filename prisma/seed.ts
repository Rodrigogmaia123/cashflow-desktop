import { prisma } from "@/lib/db";
import { calculateRoiAndProfit } from "@/lib/domain/finance";

async function main() {
  // Usuário inicial
  const user = await prisma.user.upsert({
    where: { email: "founder@example.com" },
    update: {},
    create: {
      name: "Founder",
      email: "founder@example.com"
    }
  });

  // Workspace inicial
  const workspace = await prisma.workspace.create({
    data: {
      name: "Workspace Principal"
    }
  });

  // Configuração de taxas padrão para o workspace
  const workspaceFeeConfig = await prisma.workspaceFeeConfig.create({
    data: {
      workspaceId: workspace.id,
      checkoutPercentage: 0.1, // 10%
      gatewayFeePerSale: 0.3,  // R$ 0,30 por venda
      taxPercentage: 0.06      // 6%
    }
  });

  // FeeProfile padrão do workspace
  const defaultFeeProfile = await prisma.feeProfile.create({
    data: {
      workspaceId: workspace.id,
      name: "Padrão",
      checkoutPercentage: workspaceFeeConfig.checkoutPercentage,
      gatewayFeePerSale: workspaceFeeConfig.gatewayFeePerSale,
      taxPercentage: workspaceFeeConfig.taxPercentage
    }
  });

  // Relacionamento usuário-workspace (admin)
  await prisma.userWorkspace.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "ADMIN"
    }
  });

  // Oferta inicial
  const offer = await prisma.offer.create({
    data: {
      workspaceId: workspace.id,
      name: "Oferta Exemplo",
      status: "ACTIVE",
      feeProfileId: defaultFeeProfile.id
    }
  });

  // DailyPerformance de exemplo
  const daily = await prisma.dailyPerformance.create({
    data: {
      offerId: offer.id,
      date: new Date(),
      investment: 500,
      revenue: 1500,
      sales: 20,
      checkoutPercentageSnapshot: defaultFeeProfile.checkoutPercentage,
      gatewayFeePerSaleSnapshot: defaultFeeProfile.gatewayFeePerSale,
      taxPercentageSnapshot: defaultFeeProfile.taxPercentage
    }
  });

  // PeriodPerformance calculado com base nas regras de negócio e taxas do workspace
  const { fee, roi, profit } = calculateRoiAndProfit({
    investment: daily.investment,
    revenue: daily.revenue,
    sales: daily.sales,
    checkoutPercentage: workspaceFeeConfig.checkoutPercentage,
    gatewayFeePerSale: workspaceFeeConfig.gatewayFeePerSale,
    taxPercentage: workspaceFeeConfig.taxPercentage
  });

  await prisma.periodPerformance.create({
    data: {
      offerId: offer.id,
      startDate: daily.date,
      endDate: daily.date,
      investment: daily.investment,
      revenue: daily.revenue,
      sales: daily.sales,
      fee,
      roi,
      profit
    }
  });

  // Despesas gerais do workspace
  const [catToolsExpense, catServicesIncome] = await Promise.all([
    prisma.category.create({
      data: {
        workspaceId: workspace.id,
        name: "Ferramentas",
        type: "EXPENSE"
      }
    }),
    prisma.category.create({
      data: {
        workspaceId: workspace.id,
        name: "Serviços",
        type: "INCOME"
      }
    })
  ]);

  await prisma.expense.create({
    data: {
      workspaceId: workspace.id,
      type: "VARIABLE",
      description: "Ferramentas",
      amount: 200,
      date: new Date(),
      categoryId: catToolsExpense.id
    }
  });

  await prisma.manualIncome.create({
    data: {
      workspaceId: workspace.id,
      description: "Serviços",
      amount: 800,
      date: new Date(),
      categoryId: catServicesIncome.id
    }
  });

  // Despesas pessoais do usuário
  await prisma.personalExpense.createMany({
    data: [
      {
        userId: user.id,
        tag: "Pro-labore",
        amount: 300,
        date: new Date()
      },
      {
        userId: user.id,
        tag: "Cartão de crédito",
        amount: 150,
        date: new Date()
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


