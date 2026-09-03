## Cashflow Pro - FASE 0 (Fundação)

Plataforma SaaS para controle de caixa, performance de ofertas digitais e acompanhamento de ROI, construída com:

- Next.js (App Router, React Server Components)
- TypeScript
- Tailwind CSS + shadcn-style components
- PostgreSQL + Prisma ORM

### Stack / comandos principais

- `npm install` — instala dependências
- `npm run dev` — sobe o servidor de desenvolvimento
- `npm run prisma:migrate` — cria/aplica migrations
- `npm run db:seed` — popula o banco com dados de exemplo

Configure a variável de ambiente `DATABASE_URL` em um arquivo `.env`, por exemplo:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/cashflow_pro?schema=public"
```

### Estrutura de pastas (SaaS / App Router)

- `app/` — rotas App Router
  - `layout.tsx` — layout raiz (RSC)
  - `page.tsx` — landing / marketing simples
  - `(app)/` — área autenticada (multi-tenant)
    - `layout.tsx` — layout com Sidebar + Main
    - `page.tsx` — dashboard placeholder
    - `offers/`
      - `page.tsx` — listagem simples de ofertas (server component)
      - `actions.ts` — Server Actions (`createOffer`, `createDailyPerformance`)
- `components/`
  - `layout/sidebar.tsx` — sidebar base da área autenticada
  - `ui/button.tsx` — botão baseado em shadcn/ui
- `lib/`
  - `db.ts` — cliente Prisma singleton
  - `utils.ts` — utilitário `cn` (clsx + tailwind-merge)
  - `auth/`
    - `types.ts` — tipos genéricos de usuário/autenticação
    - `get-current-user.ts` — ponto único para integrar NextAuth/Clerk
  - `domain/finance.ts` — regras financeiras (ROI, fee, profit)
- `prisma/`
  - `schema.prisma` — modelagem inicial do banco
  - `seed.ts` — seed básico com usuário, workspace, oferta e métricas
- `styles/globals.css` — Tailwind base + design tokens iniciais


