# Cashflow Pro — Análise Técnica Completa (para equipe de desenvolvimento)

**Objetivo:** orientar atualizações com segurança — arquitetura, lógica de negócio, conexões entre módulos, convenções e riscos.  
**Stack atual:** Next.js 16.0.10 · React 19.2 · Prisma 5.20 · PostgreSQL · NextAuth 4 · Stripe 17 · Zod · Tailwind 3.4 · Node 20  
**Data de referência:** alinhada ao código em produção/local (branch com feature de bandeiras em ofertas).

> **Regra de ouro:** confiar no **código + `prisma/schema.prisma`**. Vários `.md` na raiz do repo estão desatualizados (ainda citam SQLite, pastas `(app)/` vazias, etc.).

---

## 1. Visão do produto

SaaS multi-tenant para negócios digitais:

- Controle de **ofertas** (ads → receita → fees → ROI)
- **Fluxo de caixa** (receitas manuais, despesas, investimentos/reservas)
- **Orçamentos** e alertas
- **Relatórios**, billing por plano e time (Business)

Tenant = **Workspace**. Plano comercial = **User.plan** (não Workspace).

---

## 2. Arquitetura em uma página

```
Browser
  │
  ▼
middleware.ts  ── JWT NextAuth; protege /app/* e /api/*
  │                 exceção: /api/webhooks/*
  ▼
app/layout.tsx (root)
  │
  ├─ Marketing / Auth  →  app/page.tsx, (marketing)/, login|register|...
  │
  └─ App autenticado   →  app/app/*  (URL /app/...)
        │
        ├─ Server Components  → Prisma + lib/analytics|domain
        ├─ Server Actions     → mutações principais (offers, cashflow, billing…)
        └─ API Routes         → budgets, notifications, reports, Stripe, NextAuth
              │
              ▼
         PostgreSQL (Prisma singleton em lib/db.ts)
```

**Não há** backend Express separado, monorepo, Redux/Zustand nem React Query. Estado de mutação = Server Actions + `revalidatePath`, ou hooks `fetch` (budgets/notifications).

---

## 3. Mapa de pastas (o que editar onde)

| Pasta | Responsabilidade |
|-------|------------------|
| `app/app/<feature>/` | Páginas autenticadas + `actions.ts` colocalizado |
| `app/api/` | Route Handlers (REST parcial) |
| `components/<feature>/` | UI client/server por domínio |
| `lib/domain/` | Regras puras (fee, ROI, budget, offer-country…) |
| `lib/analytics/` | Agregações de dashboard/cashflow/overview |
| `lib/auth/` | NextAuth options, sessão, senha |
| `lib/plans/` | Features, limites, autorização de plano |
| `lib/billing/` | Stripe + mapa canônico de planos |
| `lib/rbac/` | Roles de workspace |
| `lib/email/`, `emails/` | Envio + templates React Email |
| `prisma/` | Schema, migrations, seed |
| `types/` | Schemas Zod/TS compartilhados (budget, report…) |
| `scripts/` | Utilitários ops (reset DB, test email…) — **cuidado em prod** |

**Área autenticada real:** `app/app/` → URL `/app/...`  
Pastas `app/(app)/` e `app/actions/` estão vazias/legado — **não usar**.

---

## 4. Ciclo de uma request autenticada

1. **Middleware** (`middleware.ts`): só valida JWT; **não acessa DB**; não cria workspace.
2. **`app/app/layout.tsx`**: `getCurrentUser()`; se null → `/login`; carrega workspace ativo + lista; onboarding.
3. **Page (RSC)**: lê dados com Prisma / `lib/analytics/*` / `lib/domain/*`.
4. **Mutação**:
   - Padrão: Server Action em `app/app/**/actions.ts`
   - Budgets/Notifications/alguns reports: `fetch` → `app/api/**`
5. Após write bem-sucedido: `revalidatePath` nas rotas afetadas.

Home `/app` redireciona para `/app/overview`.

---

## 5. Autenticação

**Arquivo:** `lib/auth/options.ts`

| Item | Detalhe |
|------|---------|
| Sessão | JWT, 30 dias |
| Providers | Credentials (bcrypt), GitHub OAuth, Email magic link (Resend) |
| Adapter | PrismaAdapter (Account/Session/VerificationToken) |
| UI | `/login`, `/register`, forgot/reset password |

**`getCurrentUser()`** (`lib/auth/get-current-user.ts`):

- Deduplicado com `React.cache()` por request
- Lê sessão → User no Prisma
- Expõe: `plan`, `isLifetime`, `isAdmin`, `activeWorkspaceId`, `onboardingCompleted`

**Env OAuth (atenção):** código usa `GITHUB_ID` / `GITHUB_SECRET` — não `GITHUB_CLIENT_*` (template pode estar errado).

---

## 6. Multi-tenant (Workspace)

```
User ──< UserWorkspace (role) >── Workspace
  │                                  ├── Offer → DailyPerformance / PeriodPerformance
  │                                  ├── Expense / ManualIncome / Investment / Category
  │                                  ├── Budget → BudgetNotification
  │                                  ├── FeeProfile / WorkspaceFeeConfig
  │                                  ├── ApiKey / Invite / SavedReport
  │
  ├── plan (FREE|PRO|BUSINESS), isLifetime, isAdmin
  ├── activeWorkspaceId
  └── StripeCustomer / Subscription
```

**Helpers:** `lib/workspace.ts`

- `requireActiveWorkspaceId()` — sem workspace → `/app/workspaces?missing=1`
- Isolamento: **sempre** filtrar por `workspaceId` em queries; nunca confiar só no `id` do recurso

**Invariante:** plano e Stripe vivem no **User**. Workspace compartilha entitlements do usuário autenticado conforme checks atuais.

---

## 7. RBAC (por workspace)

**Arquivo:** `lib/rbac/permissions.ts` + `lib/rbac/workspace-permissions.ts`

| Role | Pode |
|------|------|
| OWNER | tudo (`*`) |
| ADMIN | CRUD + users + settings + api keys |
| MEMBER | read, create, edit |
| VIEWER | somente read |

Uso típico nas actions:

```ts
await requireWorkspacePermission(workspaceId, "edit");
```

**Risco para updaters:** offers/team estão bem checados; algumas actions de cashflow/expenses podem depender mais da UI. Em writes novas, **sempre** chamar RBAC no server.

Team/multi-user exige plano **BUSINESS** (`multi_user`, `permissions_control`).

---

## 8. Planos, features e billing

### 8.1 Fontes de verdade

| Arquivo | Função |
|---------|--------|
| `lib/billing/plans.ts` | Planos canônicos + mapeamento Stripe price → plan |
| `lib/billing/config.ts` | Preços/labels UI |
| `lib/plans/features.ts` | Feature flags por plano |
| `lib/plans/limits.ts` | Limites quantitativos |
| `lib/plans/authorization.ts` | Checks em runtime |
| `lib/plans/feature-status.ts` | `coming_soon` (ex.: `api_access`) |

### 8.2 Limites (resumo)

| | FREE | PRO | BUSINESS |
|--|------|-----|----------|
| Workspaces | 1 | ∞ | ∞ |
| Lançamentos/mês* | 100 | ∞ | ∞ |
| Categorias custom | 0 | ∞ | ∞ |
| Users/workspace | 1 | 1 | ∞ |
| Histórico | ~30 dias | full | full |

\*Conta: expenses + manualIncomes + dailyPerformances no mês (por `createdAt`).

### 8.3 Features premium (amostra)

- PRO: exports, categorias, reports avançados, historical, workspaces ilimitados  
- BUSINESS: + multi_user, permissions, custom_reports, automations, priority_support  
- **`api_access`**: desativado / em breve (`coming_soon`)

### 8.4 Stripe

- Checkout/portal: `app/app/billing/actions.ts` + `lib/billing/stripe.ts`
- Webhook: `app/api/webhooks/stripe/route.ts` (passa no middleware **sem** JWT)
- Sync atualiza `User.plan` + tabelas `Subscription` / `StripeCustomer`
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_BUSINESS`
- `isLifetime = true` bypassa cobrança

**Ao mudar planos:** atualizar features + limits + billing/plans + UI; nunca hardcodar price IDs na UI.

---

## 9. Lógica financeira (núcleo)

**Arquivo obrigatório:** `lib/domain/finance.ts`

```
fee = (revenue × checkout%) + (sales × gatewayFee) + (revenue × tax%)
ROI = revenue / (investment + fee)     // 0 se custo = 0
profit = revenue − (investment + fee)
ticketAverage = revenue / sales
```

### Snapshots de taxa (crítico)

Em `DailyPerformance`, no momento do lançamento, grava-se:

- `checkoutPercentageSnapshot`
- `gatewayFeePerSaleSnapshot`
- `taxPercentageSnapshot`

Ordem de resolução típica: **FeeProfile da oferta** → senão **WorkspaceFeeConfig** → defaults.

**Invariante:** mudar FeeProfile **não reescreve** histórico automaticamente. Relatórios devem usar snapshots, não a taxa “ao vivo”.

### Ofertas — métricas

`lib/domain/offer-metrics.ts` agrega ROI 7d / 30d / geral + sparkline a partir dos diários.

Status: `ACTIVE | PAUSED | DEAD`  
País opcional: `OfferCountry` = `AR | BR | US | MX | CO` (`lib/domain/offer-country.ts`)

Unique: `(offerId, date)` em DailyPerformance → upsert, não duplicar dia.

### Cashflow agregado

`lib/analytics/cashflow.ts` (`getWorkspaceCashflow`):

- **Entradas:** receita de ofertas + ManualIncome  
- **Saídas:** investimento em ads + fees + Expense + Investment (reservas)  
- Série diária + saldo acumulado; FREE pode clamp de histórico (~30d)

---

## 10. Módulos funcionais e conexões

```
                    ┌─────────────┐
                    │   User      │◄──── Stripe / Plan
                    └──────┬──────┘
                           │ activeWorkspaceId
                    ┌──────▼──────┐
                    │  Workspace  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        Offers          Cashflow        Budgets
      (ROI/fees)     (E/S/Invest)    (limites cat.)
           │               │               │
           ▼               ▼               ▼
   DailyPerformance    Category      Notifications
   PeriodPerformance                  (API + alerts)
```

| Módulo | Rotas UI | Mutação | Lógica |
|--------|----------|---------|--------|
| Overview | `/app/overview` | — | `lib/analytics/*` health/alerts |
| Dashboard | `/app/dashboard` | — | `lib/analytics/dashboard.ts` |
| Ofertas | `/app/offers`, `/[offerId]` | Server Actions | `offer-metrics`, finance |
| Cashflow | `/app/cashflow` | Server Actions | `lib/analytics/cashflow.ts` |
| Budgets | `/app/budgets` | **API REST** | `lib/domain/budget*.ts` |
| Notifications | `/app/notifications` | **API REST** | `lib/domain/notification.ts` |
| Settings | fees, categories, team, api | Server Actions | plans + rbac |
| Billing | `/app/billing` | Actions + webhook | `lib/billing/*` |
| Admin | `/app/admin` | Actions | `User.isAdmin` |
| Workspaces | `/app/workspaces` | Actions | `lib/workspace.ts` |

`/app/expenses` redireciona para cashflow.

---

## 11. API Routes existentes

| Path | Papel |
|------|-------|
| `/api/auth/[...nextauth]` | NextAuth |
| `/api/webhooks/stripe` | Sync assinatura |
| `/api/budgets` (+ `[id]`, `status`, `check-impact`, `renew`) | Orçamentos |
| `/api/notifications` (+ `[id]`, `stats`, `mark-all-read`) | Alertas |
| `/api/reports/period` | Relatório de período |
| `/api/[...path]` | **403** — API pública “em desenvolvimento” |

Qualquer path `/api/*` não listado cai no catch-all 403 (rotas específicas têm precedência).

---

## 12. Modelos Prisma (inventário)

**Auth/conta:** User, Account, Session, VerificationToken  
**Tenant:** Workspace, UserWorkspace, WorkspaceInvite  
**Negócio:** Offer (+ country), DailyPerformance, PeriodPerformance, Expense, ManualIncome, Investment, Category, PersonalExpense  
**Fees:** WorkspaceFeeConfig, FeeProfile  
**Billing:** StripeCustomer, Subscription  
**Produtos:** Budget, BudgetNotification, SavedReport, ApiKey  
**Ops:** MetricEvent  

Enums relevantes: `UserPlan`, `OfferStatus`, `OfferCountry`, `WorkspaceRole`, `ExpenseType`, `CategoryType`, `BudgetPeriodType`, `NotificationType/Status`, `SubscriptionStatus`.

Migrations em `prisma/migrations/` — em deploy usar **`prisma migrate deploy`**, nunca `migrate reset` em produção.

---

## 13. Padrões de dados e UI

1. **Server Components** carregam dados.
2. Filtros de período via **`searchParams`** (URL).
3. Páginas analíticas: `export const dynamic = "force-dynamic"`.
4. Client components: dialogs, charts, menus, onboarding.
5. Budgets/notifications: hooks manuais (`use-budgets.ts`, `use-notifications.ts`) + JSON API.
6. Alias `@/*` → raiz (`tsconfig.json`).
7. Validação Zod nas actions/API.
8. Dinheiro: `Decimal` Prisma; cálculos em `lib/domain/finance.ts`.

### Datas / timezone (cuidado)

- Analytics tende a tratar dias em **UTC midnight** (`T00:00:00.000Z`).
- Helpers locais em `lib/utils/date-local.ts`.
- Há risco de off-by-one se misturar `setHours` local com UTC — validar filtros de período ao mexer.

---

## 14. Email, onboarding, observabilidade

- **Email:** Resend (`lib/email/*`) + templates em `emails/`. Falha de e-mail não deve abortar checkout/auth crítico.
- **Onboarding:** `User.onboardingCompleted` + Driver.js (`lib/onboarding/*`).
- **Observability:** `measure()` em actions; persistência opcional em `MetricEvent` se `OBS_METRICS_PERSIST=true`.

---

## 15. Variáveis de ambiente (código real)

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | PostgreSQL |
| `NEXTAUTH_SECRET` | JWT NextAuth |
| `GITHUB_ID` / `GITHUB_SECRET` | OAuth |
| `EMAIL_FROM` / `RESEND_API_KEY` | E-mails |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe |
| `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_BUSINESS` | Planos |
| `NEXT_PUBLIC_APP_URL` | Callbacks, links, return URLs |
| `OBS_METRICS_PERSIST` | Persist metrics |
| `NODE_ENV` / `VERCEL` | comportamento de logs/envio |

Deploy: `Dockerfile` (node:20-slim + openssl), `Dockerfile.alpine`, `nixpacks.toml`. Prisma `binaryTargets`: `native` + `debian-openssl-3.0.x`.

---

## 16. Como fazer atualizações com segurança

### Checklist para qualquer feature nova

1. Definir se o dado é **por workspace** (quase tudo) ou por user (plano, personal).
2. Schema Prisma + migration versionada.
3. Domínio puro em `lib/domain` ou agregação em `lib/analytics` — **UI não recalcula ROI**.
4. Mutação: Server Action (padrão) **ou** API se seguir o padrão budgets.
5. Em toda write: `requireActiveWorkspaceId` + filtro `workspaceId` + RBAC + (se aplicável) `checkFeatureAccess` / limits.
6. Zod no input; `revalidatePath` no sucesso.
7. Testar isolamento entre workspaces e planos FREE vs PRO.

### Onde mexer por tipo de mudança

| Tipo de mudança | Onde |
|-----------------|------|
| Fórmula financeira | `lib/domain/finance.ts` (+ impacto em snapshots) |
| Nova tela analítica | `app/app/.../page.tsx` + `lib/analytics/` |
| CRUD clássico | `app/app/<feature>/actions.ts` + components |
| Feature paga | `features.ts` + `limits.ts` + `authorization.ts` + UI gating |
| Billing / preço | `lib/billing/plans.ts` + `config.ts` + Stripe Dashboard |
| Budget/alerta | `lib/domain/budget*` + `app/api/budgets|notifications` |
| Bandeira/país oferta | `lib/domain/offer-country.ts` + enum Prisma |

### O que **nunca** fazer em produção

- `prisma migrate reset` / `db:reset` / apagar volume sem backup  
- `db push` destrutivo sem migration  
- Confiar só em hide de botão na UI para permissão  
- Recalcular histórico com fee “live” ignorando snapshots  
- Commitar `.env` / secrets  

---

## 17. Riscos e dívida técnica (para quem for atualizar)

1. Docs `.md` antigos na raiz ≠ código atual.  
2. ENV GitHub inconsistente (template vs código).  
3. RBAC uneven entre módulos.  
4. Timezone local vs UTC em filtros de data.  
5. Agregação de ROI pode usar snapshot da “primeira” performance do set em alguns caminhos — validar ao mexer métricas.  
6. `api_access` e UI de API keys existem, mas API pública está bloqueada.  
7. `PersonalExpense` no schema sem fluxo principal de app.  
8. Catch-all `/api/[...path]` 403 — não confundir com “middleware bloqueia toda API”.  
9. Poucos testes automatizados (há `scripts/test-budgets`, `test:email`).  
10. Preços fallback em `config.ts` podem divergir do Stripe real.  

---

## 18. Invariantes (não quebrar)

1. Dados de negócio isolados por `workspaceId`.  
2. Entitlements vêm de `User.plan` / `isLifetime`.  
3. Stripe sincroniza plano; app não “inventa” assinatura sem webhook/checkout.  
4. Fees históricos = snapshots no daily.  
5. Dias de performance únicos por oferta.  
6. Middleware sem DB.  
7. FREE: 100 lançamentos/mês + histórico curto.  
8. Webhooks Stripe sem sessão JWT.  
9. Falha de e-mail ≠ falha de billing/auth.  

---

## 19. Comandos úteis (dev)

```bash
npm install
npx prisma migrate dev          # local
npx prisma migrate deploy       # prod/VPS
npx prisma generate
npm run db:seed                 # opcional
npm run dev                     # localhost:3000
npm run build && npm start
```

---

## 20. Resumo para a equipe

O Cashflow Pro é um **monolito Next.js App Router** com:

- **Prisma/PostgreSQL** multi-tenant por Workspace  
- **Plano no User** + Stripe  
- **Server Actions** como padrão de escrita  
- **REST** só em budgets/notifications/reports/webhooks  
- **Núcleo financeiro** centralizado em `lib/domain/finance.ts` com **snapshots**  

Melhor forma de atualizar: respeitar camadas (domain → actions → UI), isolamento de workspace, gates de plano/RBAC, migrations versionadas e nunca recalcular histórico ignorando snapshots.

---

*Documento gerado a partir da análise do código-fonte. Em caso de divergência com READMEs antigos, prevalece o código.*
