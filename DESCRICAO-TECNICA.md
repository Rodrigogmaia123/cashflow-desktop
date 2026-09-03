# Descrição Técnica - Cashflow Pro

## 1. Visão Geral do Projeto

**Cashflow Pro** é uma plataforma SaaS multi-tenant para controle financeiro, gestão de fluxo de caixa, análise de performance de ofertas digitais e acompanhamento de ROI (Return on Investment). A aplicação foi construída utilizando tecnologias modernas do ecossistema React/Next.js.

### Stack Tecnológica Principal
- **Framework**: Next.js 16.0.10 (App Router, React Server Components)
- **Linguagem**: TypeScript 5.4.5
- **Estilização**: Tailwind CSS 3.4.4 + Componentes estilo shadcn/ui
- **Banco de Dados**: SQLite (com Prisma ORM 5.20.0)
- **Autenticação**: NextAuth.js 4.24.5
- **Visualização de Dados**: Recharts 2.15.4
- **Validação**: Zod 3.23.8

---

## 2. Arquitetura e Estrutura de Pastas

### 2.1. Estrutura de Rotas (App Router)

O projeto utiliza o **App Router** do Next.js 16, que permite Server Components por padrão e uma estrutura de roteamento baseada em pastas.

```
app/
├── layout.tsx                    # Layout raiz da aplicação
├── page.tsx                      # Landing page / Marketing
├── globals.css                   # Estilos globais
├── login/                        # Página de login
├── register/                     # Página de registro
├── forgot-password/              # Recuperação de senha
├── reset-password/               # Redefinição de senha
├── (app)/                        # Grupo de rotas autenticadas (multi-tenant)
│   ├── layout.tsx                # Layout com Sidebar + Main
│   ├── page.tsx                  # Dashboard principal
│   ├── dashboard/                # Dashboard com métricas e gráficos
│   ├── overview/                 # Visão geral do negócio
│   ├── offers/                   # Gestão de ofertas digitais
│   ├── cashflow/                 # Análise de fluxo de caixa
│   ├── expenses/                 # Gestão de despesas
│   ├── workspaces/               # Gestão de workspaces
│   ├── settings/                 # Configurações (taxas, categorias, perfis)
│   ├── profile/                  # Perfil do usuário
│   └── exports/                  # Exportação de dados
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts          # API route do NextAuth
```

**Características do App Router:**
- **Server Components por padrão**: Componentes são renderizados no servidor, reduzindo JavaScript no cliente
- **Server Actions**: Funções assíncronas que executam no servidor (substituem API routes em muitos casos)
- **Layouts aninhados**: Permite layouts compartilhados entre rotas
- **Grupos de rotas**: `(app)` é um grupo que não afeta a URL mas organiza rotas protegidas

---

## 3. Camada de Dados (Prisma ORM)

### 3.1. Schema do Banco de Dados

O banco utiliza **SQLite** com Prisma ORM. O schema define os seguintes modelos principais:

#### **User** (Usuário)
- Gerencia autenticação e perfil do usuário
- Suporta múltiplos workspaces (multi-tenant)
- Campos: `id`, `email`, `password` (hash bcrypt), `plan` (FREE/PRO/BUSINESS), `onboardingCompleted`
- Relacionamentos: `workspaces`, `activeWorkspace`, `personalExpenses`

#### **Workspace** (Espaço de Trabalho)
- Unidade de isolamento multi-tenant
- Cada workspace possui: ofertas, despesas, categorias, receitas manuais
- Configurações de taxas por workspace (`WorkspaceFeeConfig`)
- Relacionamentos: `users`, `offers`, `expenses`, `categories`, `manualIncomes`

#### **Offer** (Oferta Digital)
- Representa uma oferta/produto digital
- Possui performances diárias e por período
- Pode ter um perfil de taxas associado (`FeeProfile`)
- Status: ACTIVE/INACTIVE

#### **DailyPerformance** (Performance Diária)
- Métricas diárias de uma oferta: `investment`, `revenue`, `sales`
- Snapshots de configurações de taxas no momento do registro
- Constraint único: `[offerId, date]` (uma performance por oferta por dia)

#### **PeriodPerformance** (Performance por Período)
- Agregações de performance em períodos específicos
- Calcula: `fee`, `roi`, `profit` automaticamente
- Indexado por `[offerId, startDate, endDate]`

#### **Expense** (Despesa)
- Despesas do workspace
- Tipos: VARIABLE/FIXED
- Categorização opcional via `Category`
- Indexado por `[workspaceId, date]`

#### **ManualIncome** (Receita Manual)
- Receitas não relacionadas a ofertas
- Permite categorização
- Indexado por `[workspaceId, date]`

#### **Category** (Categoria)
- Categorias para despesas e receitas
- Tipos: INCOME/EXPENSE/BOTH
- Único por workspace: `[workspaceId, name, type]`

#### **FeeProfile** (Perfil de Taxas)
- Perfis reutilizáveis de configuração de taxas
- Campos: `checkoutPercentage`, `gatewayFeePerSale`, `taxPercentage`
- Pode ser associado a múltiplas ofertas

#### **WorkspaceFeeConfig** (Configuração de Taxas do Workspace)
- Configuração padrão de taxas para o workspace
- Relação 1:1 com Workspace

#### **MetricEvent** (Evento de Métrica)
- Sistema de observabilidade e monitoramento
- Registra: `name`, `durationMs`, `level` (INFO/WARN/ERROR), `success`
- Contexto: `workspaceId`, `offerId`, `action`
- Metadata JSON opcional

#### **NextAuth Models**
- `Account`: Contas OAuth (GitHub, etc.)
- `Session`: Sessões de usuário
- `VerificationToken`: Tokens de verificação

### 3.2. Cliente Prisma (`lib/db.ts`)

Implementa o padrão **Singleton** para o Prisma Client:
- Evita múltiplas instâncias em desenvolvimento (hot reload)
- Configuração de logs por ambiente
- Reutilização global em produção

---

## 4. Autenticação e Autorização

### 4.1. NextAuth.js

**Arquivo**: `app/api/auth/[...nextauth]/route.ts`

- **Estratégia**: JWT (JSON Web Tokens)
- **Providers**: Credentials (email/senha) + OAuth (GitHub)
- **Adapter**: Prisma Adapter para persistência de sessões
- **Callbacks**: Personalizados para incluir dados do usuário no token

### 4.2. Middleware (`middleware.ts`)

**Função**: Proteção de rotas autenticadas

- **Matcher**: `/app/:path*` (todas as rotas dentro de `/app`)
- **Validação**: Verifica token JWT válido
- **Redirecionamento**: Não autenticado → `/login`
- **Característica**: Não acessa banco de dados (apenas valida token)

### 4.3. Helpers de Autenticação (`lib/auth/`)

- **`get-current-user.ts`**: Função centralizada para obter usuário atual
- **`password.ts`**: Utilitários de hash/verificação (bcryptjs)
- **`rate-limit.ts`**: Rate limiting para ações sensíveis
- **`actions.ts`**: Server Actions para login/registro
- **`types.ts`**: Tipos TypeScript para autenticação

---

## 5. Camada de Negócio (Domain Logic)

### 5.1. Cálculos Financeiros (`lib/domain/finance.ts`)

**Funções principais:**

#### `calculateFee()`
Calcula a taxa total baseada em:
- **Checkout**: `revenue * checkoutPercentage`
- **Gateway**: `sales * gatewayFeePerSale`
- **Imposto**: `revenue * taxPercentage`

#### `calculateRoiAndProfit()`
- **ROI**: `revenue / (investment + fee)`
- **Profit**: `revenue - (investment + fee)`

#### `calculateDailyMetrics()`
Inclui também:
- **Ticket Médio**: `revenue / sales`

**Características:**
- Usa `Decimal` do Prisma para precisão monetária
- Suporta múltiplos formatos de entrada (`MoneyLike`)
- Tratamento de divisão por zero

### 5.2. Analytics (`lib/analytics/`)

#### **`cashflow.ts`**
- Cálculo de fluxo de caixa por período
- Agrega receitas (de ofertas + manuais) e despesas
- Gera séries temporais para gráficos

#### **`dashboard.ts`**
- Métricas agregadas do dashboard
- Performance de ofertas
- Comparações entre períodos

#### **`cashflow-insights.ts`**
- Insights automáticos sobre o fluxo de caixa
- Identifica tendências, alertas e recomendações

#### **`business-health-score.ts`**
- Score de saúde do negócio (0-100)
- Baseado em múltiplos indicadores financeiros

#### **`business-alerts.ts`**
- Sistema de alertas de negócio
- Detecta problemas financeiros, quedas de performance, etc.

#### **`period-comparison.ts`**
- Comparação entre períodos (mês atual vs anterior, etc.)
- Cálculo de variações percentuais

#### **`weekly-snapshot.ts`**
- Snapshot semanal de métricas
- Resumo executivo da semana

#### **`date-range.ts` e `date-range-utils.ts`**
- Utilitários para manipulação de intervalos de datas
- Presets: hoje, semana, mês, trimestre, ano, customizado

#### **`ranges.ts`**
- Definição de ranges de datas padrão
- Helpers para formatação e validação

#### **`finance-health.ts`**
- Análise de saúde financeira geral
- Indicadores compostos

---

## 6. Workspace e Multi-tenancy

### 6.1. Gerenciamento de Workspaces (`lib/workspace.ts`)

**Funções principais:**

- **`getActiveWorkspace()`**: Obtém workspace ativo do usuário
- **`requireActiveWorkspaceId()`**: Garante workspace ativo (redireciona se não houver)
- **`listUserWorkspaces()`**: Lista todos os workspaces do usuário

**Modelo de Multi-tenancy:**
- Cada usuário pode pertencer a múltiplos workspaces
- Workspace ativo armazenado em `User.activeWorkspaceId`
- Isolamento de dados por `workspaceId` em todas as queries

### 6.2. Workspace Selector (`components/workspace/workspace-selector.tsx`)

Componente para trocar workspace ativo:
- Dropdown com lista de workspaces
- Atualiza `activeWorkspaceId` do usuário
- Recarrega a aplicação após troca

---

## 7. Componentes da Interface

### 7.1. Layout (`components/layout/`)

#### **`sidebar.tsx`**
- Sidebar fixa com navegação principal
- Exibe nome do workspace e usuário
- Links organizados por seções (Navegação, Configurações)
- Integração com onboarding (Driver.js)

#### **`sidebar-link.tsx`**
- Link reutilizável da sidebar
- Estado ativo baseado em rota atual
- Ícones e estilos consistentes

### 7.2. Dashboard (`components/dashboard/`)

#### **`metric-card.tsx`**
- Card de métrica individual
- Suporta variação percentual, tendência, formatação monetária

#### **`dashboard-filters.tsx`**
- Filtros de período e workspace
- Integração com date range picker

#### **`dashboard-section.tsx`**
- Container de seção do dashboard
- Header com título e ações

#### **`offer-dashboard-chart-panel.tsx`**
- Painel de gráficos de performance de ofertas
- Gráficos de linha e área (Recharts)

#### **`workspace-dashboard-chart-panel.tsx`**
- Gráficos agregados do workspace
- Comparação entre ofertas

#### **`segmented-control.tsx`**
- Controle de segmentação (ex: visualização por dia/semana/mês)

#### **`soft-badge.tsx`**
- Badge com estilo suave para status/tags

### 7.3. Cashflow (`components/cashflow/`)

#### **`cashflow-chart-panel.tsx`**
- Painel principal de gráficos de fluxo de caixa
- Gráfico de área temporal

#### **`cashflow-filters.tsx`**
- Filtros específicos de cashflow
- Período, categorias, tipos

#### **`cashflow-insights.tsx`**
- Exibição de insights automáticos
- Alertas e recomendações

#### **`income-breakdown-panel.tsx`**
- Breakdown de receitas por categoria/fonte
- Gráfico de rosca (donut)

#### **`outflow-breakdown-panel.tsx`**
- Breakdown de despesas por categoria
- Visualização de saídas

#### **`expense-dialogs.tsx`**
- Diálogos para criar/editar despesas
- Formulários com validação Zod

#### **`manual-income-dialogs.tsx`**
- Diálogos para criar/editar receitas manuais

### 7.4. Charts (`components/charts/`)

#### **`cashflow-chart.tsx`**
- Gráfico de linha temporal de fluxo de caixa
- Biblioteca: Recharts

#### **`area-timeseries.tsx`**
- Gráfico de área temporal genérico
- Reutilizável para diferentes métricas

#### **`donut-breakdown.tsx`**
- Gráfico de rosca para breakdowns
- Customizável (cores, labels)

#### **`offer-performance-chart.tsx`**
- Gráfico específico de performance de ofertas
- Múltiplas séries (investment, revenue, profit)

#### **`workspace-comparison-chart.tsx`**
- Comparação entre workspaces ou períodos
- Gráfico de barras ou linha

### 7.5. Overview (`components/overview/`)

#### **`business-health-score.tsx`**
- Componente de score de saúde do negócio
- Visualização circular (0-100)

#### **`business-health.tsx`**
- Painel completo de saúde do negócio
- Múltiplos indicadores

#### **`highlights.tsx`**
- Destaques do período
- Principais métricas e eventos

#### **`next-actions.tsx`**
- Próximas ações recomendadas
- Lista de tarefas sugeridas

#### **`overview-metrics.tsx`**
- Métricas principais da visão geral
- Cards agregados

#### **`period-summary.tsx`**
- Resumo do período atual
- Comparação com período anterior

#### **`weekly-snapshot.tsx`**
- Snapshot semanal
- Resumo executivo

### 7.6. Comparison (`components/comparison/`)

Componentes para comparação entre períodos:
- **`period-comparison-controls.tsx`**: Controles de seleção de períodos
- **`period-comparison-panel.tsx`**: Painel de comparação
- **`period-comparison-section.tsx`**: Seção de comparação
- **`period-comparison-toggle.tsx`**: Toggle para ativar/desativar comparação
- **`period-comparison-wrapper.tsx`**: Wrapper que gerencia estado de comparação

### 7.7. Alerts (`components/alerts/`)

#### **`business-alerts.tsx`**
- Lista de alertas de negócio
- Diferentes níveis de severidade

#### **`business-alerts-section.tsx`**
- Seção de alertas no dashboard
- Agrupamento e filtros

### 7.8. Auth (`components/auth/`)

Componentes de autenticação:
- **`credentials-login-form.tsx`**: Formulário de login com email/senha
- **`email-login-form.tsx`**: Formulário de login apenas com email
- **`register-form.tsx`**: Formulário de registro
- **`forgot-password-form.tsx`**: Recuperação de senha
- **`reset-password-form.tsx`**: Redefinição de senha
- **`change-password-form.tsx`**: Alteração de senha (perfil)
- **`github-login-button.tsx`**: Botão de login com GitHub
- **`profile-form.tsx`**: Formulário de perfil do usuário

### 7.9. UI Base (`components/ui/`)

Componentes base estilo shadcn/ui:
- **`button.tsx`**: Botão com variantes (primary, secondary, ghost, etc.)
- **`card.tsx`**: Card container
- **`dialog.tsx`**: Diálogo modal (Radix UI)
- **`input.tsx`**: Input de formulário
- **`skeleton.tsx`**: Skeleton loader
- **`tooltip.tsx`**: Tooltip (Radix UI)

**Características:**
- Baseados em Radix UI (acessibilidade)
- Estilizados com Tailwind CSS
- Usam `class-variance-authority` para variantes
- Utilitário `cn()` para merge de classes (clsx + tailwind-merge)

### 7.10. Onboarding (`components/onboarding/`)

#### **`onboarding-provider.tsx`**
- Provider React para gerenciar estado de onboarding
- Integração com Driver.js (tour guiado)

#### **`onboarding-trigger.tsx`**
- Trigger para iniciar onboarding
- Verifica se usuário completou onboarding

---

## 8. Server Actions

Server Actions são funções assíncronas que executam no servidor, substituindo muitas API routes tradicionais.

**Localização**: `app/actions/` e dentro de arquivos `actions.ts` nas rotas

**Exemplos de uso:**
- Criar/editar ofertas
- Registrar performances diárias
- Criar/editar despesas
- Criar/editar receitas manuais
- Gerenciar categorias
- Configurar taxas

**Vantagens:**
- Type-safe (TypeScript)
- Sem necessidade de criar API routes
- Validação com Zod
- Execução no servidor (segurança)

---

## 9. Observabilidade (`lib/observability/`)

Sistema de métricas e monitoramento:

#### **`metrics.ts`**
- Definição de métricas do sistema
- Tipos e interfaces

#### **`metric-writer.ts`**
- Escrita de métricas no banco (`MetricEvent`)
- Formatação e persistência

#### **`measure.ts`**
- Wrapper para medir duração de operações
- Registra automaticamente em `MetricEvent`

#### **`alerts.ts`**
- Sistema de alertas técnicos (não de negócio)
- Monitoramento de erros e performance

#### **`cleanup.ts`**
- Limpeza de métricas antigas
- Scripts de manutenção

---

## 10. Estilização

### 10.1. Tailwind CSS

**Configuração**: `tailwind.config.ts`

- **Design System**: Cores, espaçamentos, tipografia customizados
- **Temas**: Suporte a dark mode (preparado)
- **Utilities**: Classes utilitárias customizadas

### 10.2. Globals CSS

**Arquivos**: `app/globals.css` e `styles/globals.css`

- Reset CSS
- Variáveis CSS para design tokens
- Classes base do Tailwind
- Scrollbar customizada (`scrollbar-thin`)

### 10.3. Utilitários

**`lib/utils.ts`**: Função `cn()`
- Combina `clsx` e `tailwind-merge`
- Merge inteligente de classes Tailwind
- Remove conflitos de classes

---

## 11. TypeScript

### 11.1. Configuração (`tsconfig.json`)

- **Target**: ESNext
- **Module**: ESNext
- **JSX**: react-jsx
- **Strict**: true
- **Paths**: `@/*` → raiz do projeto
- **Incremental**: true (builds mais rápidos)

### 11.2. Tipos Customizados

- **`lib/types/`**: Tipos compartilhados
- **`lib/auth/types.ts`**: Tipos de autenticação
- **`lib/domain/finance.ts`**: Tipos financeiros (`MoneyLike`, `FeeConfig`)

---

## 12. Scripts e Ferramentas

### 12.1. Scripts NPM (`package.json`)

- **`dev`**: Servidor de desenvolvimento (Next.js)
- **`build`**: Build de produção
- **`start`**: Servidor de produção
- **`lint`**: ESLint
- **`prisma:generate`**: Gera Prisma Client
- **`prisma:migrate`**: Aplica migrations
- **`prisma:studio`**: Abre Prisma Studio (GUI do banco)
- **`db:seed`**: Popula banco com dados de exemplo

### 12.2. Scripts Customizados

- **`scripts/cleanup-metrics.ts`**: Limpeza de métricas antigas
- **`aplicar-migration.js`**: Script para aplicar migrations manualmente
- **`fix-migration.ps1`**: Script PowerShell para correção de migrations

---

## 13. Migrations e Banco de Dados

### 13.1. Migrations (`prisma/migrations/`)

- Histórico de mudanças no schema
- Versionamento do banco de dados
- Aplicação incremental

### 13.2. Seed (`prisma/seed.ts`)

- Popula banco com dados de exemplo
- Cria usuário, workspace, ofertas, performances
- Útil para desenvolvimento e testes

---

## 14. Segurança

### 14.1. Autenticação
- Senhas hasheadas com bcryptjs
- JWT tokens para sessões
- Rate limiting em ações sensíveis

### 14.2. Autorização
- Middleware protege rotas `/app/*`
- Validação de workspace em todas as queries
- Isolamento multi-tenant

### 14.3. Validação
- Zod para validação de schemas
- Server Actions validam entrada
- TypeScript para type safety

---

## 15. Performance

### 15.1. Server Components
- Renderização no servidor reduz JavaScript no cliente
- Melhor SEO e performance inicial

### 15.2. Otimizações
- Prisma Client singleton (evita múltiplas conexões)
- Indexes no banco de dados
- Lazy loading de componentes pesados

### 15.3. Observabilidade
- Sistema de métricas para monitorar performance
- Logs estruturados
- Medição de duração de operações

---

## 16. Extensibilidade

### 16.1. Arquitetura Modular
- Separação clara de responsabilidades
- Componentes reutilizáveis
- Funções de domínio isoladas

### 16.2. Configuração
- Variáveis de ambiente para configuração
- Design system extensível
- Perfis de taxas reutilizáveis

### 16.3. Integrações Futuras
- Estrutura preparada para webhooks
- Sistema de métricas permite tracking de integrações
- OAuth já configurado (GitHub como exemplo)

---

## 17. Documentação Adicional

O projeto inclui vários documentos markdown:
- **`ANALISE-COMPLETA-SISTEMA.md`**: Análise completa do sistema
- **`APLICAR-MIGRATION.md`**: Guia para aplicar migrations
- **`DIAGNOSTICO-U0.md`**: Diagnósticos e soluções
- **`ONBOARDING-SETUP.md`**: Configuração de onboarding
- **`SOLUCAO-FINAL.md`**: Soluções para problemas comuns
- **`README.md`**: Documentação básica do projeto

---

## 18. Fluxo de Dados Típico

### 18.1. Autenticação
1. Usuário acessa `/login`
2. Submete credenciais → Server Action
3. Validação com bcrypt → NextAuth
4. Criação de sessão JWT
5. Redirecionamento para `/app/dashboard`

### 18.2. Visualização de Dashboard
1. Usuário acessa `/app/dashboard`
2. Layout verifica autenticação
3. Server Component busca dados (Prisma)
4. Cálculos de analytics executados
5. Renderização no servidor
6. Envio de HTML ao cliente

### 18.3. Criação de Performance
1. Usuário preenche formulário
2. Server Action recebe dados
3. Validação com Zod
4. Cálculo de fee/ROI/profit (`lib/domain/finance.ts`)
5. Persistência no banco (Prisma)
6. Revalidação de cache (Next.js)
7. Atualização da UI

---

## 19. Dependências Principais

### Runtime
- `next`: Framework React
- `react` / `react-dom`: Biblioteca React
- `@prisma/client`: ORM
- `next-auth`: Autenticação
- `recharts`: Gráficos
- `zod`: Validação
- `bcryptjs`: Hash de senhas
- `nodemailer`: Envio de emails

### Dev
- `typescript`: TypeScript
- `prisma`: CLI do Prisma
- `tailwindcss`: CSS framework
- `eslint`: Linter
- `tsx`: Executor TypeScript

### UI
- `@radix-ui/*`: Componentes acessíveis
- `class-variance-authority`: Variantes de componentes
- `clsx` / `tailwind-merge`: Utilitários de classes
- `driver.js`: Tour guiado (onboarding)

---

## 20. Considerações Finais

### Pontos Fortes
- Arquitetura moderna (App Router, Server Components)
- Type-safe end-to-end (TypeScript + Zod)
- Multi-tenancy bem implementado
- Cálculos financeiros precisos (Decimal)
- Sistema de observabilidade
- Componentes reutilizáveis
- Design system consistente

### Melhorias Futuras
- Migração para PostgreSQL (produção)
- Testes automatizados (Jest/Vitest)
- CI/CD pipeline
- Monitoramento em produção (Sentry, etc.)
- Cache de queries (Redis)
- Webhooks para integrações
- API REST pública (opcional)

---

**Versão do Documento**: 1.0  
**Última Atualização**: 2024  
**Autor**: Documentação Técnica - Cashflow Pro

