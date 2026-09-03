# Setup do Sistema de Onboarding

## Migration do Prisma

Execute o seguinte comando para criar a migration:

```bash
npm run prisma:migrate
```

Quando solicitado, digite o nome da migration:
```
add_onboarding_completed
```

Ou execute diretamente:
```bash
npx prisma migrate dev --name add_onboarding_completed
```

## Verificação

Após executar a migration, verifique se o campo `onboardingCompleted` foi adicionado ao model `User` no banco de dados.

## Teste

1. Faça login com um usuário novo (ou um que ainda não completou o onboarding)
2. O tour deve iniciar automaticamente após 500ms
3. Teste os botões "Pular" e "Começar"
4. Complete o tour e verifique se `onboardingCompleted` foi atualizado para `true`
5. Teste o botão "Guia do Sistema" na sidebar para reexecutar o tour

## Estrutura Criada

- `lib/onboarding/tour-steps.ts` - Definição dos passos do tour
- `lib/onboarding/use-onboarding.ts` - Hook para controlar o tour
- `components/onboarding/onboarding-provider.tsx` - Provider do onboarding
- `components/onboarding/onboarding-trigger.tsx` - Botão para reexecutar tour
- `app/app/onboarding/actions.ts` - Server Action para atualizar estado

## Data Tour Attributes Adicionados

- `[data-tour="workspace-selector"]` - WorkspaceSelector
- `[data-tour="overview-metrics"]` - OverviewMetrics
- `[data-tour="dashboard-kpis"]` - Dashboard KPIs
- `[data-tour="offers-link"]` - Link de Ofertas na Sidebar
- `[data-tour="create-offer-button"]` - Formulário de criar oferta
- `[data-tour="daily-performance-form"]` - Formulário de performance diária
- `[data-tour="cashflow-link"]` - Link de Cashflow na Sidebar
