# Sprint 4 - Feature Investimentos ✅

## Status: IMPLEMENTADO

Data de Conclusão: 12/02/2026

---

## 📋 Objetivos da Sprint

- [x] Modelo de dados para investimentos
- [x] Interface para adicionar investimentos
- [x] Direcionar dinheiro para investimentos (entra como saída no fluxo de caixa)
- [x] Dashboard/visualização de investimentos
- [x] Integração com fluxo de caixa principal

---

## 🔧 Implementação

### 1. Modelo de Dados (Prisma)

**Novo model `Investment`:**
```prisma
model Investment {
  id          String    @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(...)

  description String   // ex: "Reserva de emergência", "CDB", "Tesouro Selic"
  amount      Decimal
  date        DateTime

  createdAt   DateTime  @default(now())

  @@index([workspaceId, date])
}
```

- **Migration:** `20260212180117_add_investment_model`
- Investimentos são por workspace e data
- Sem categoria (descrição livre)

### 2. Actions (CRUD)

**Arquivo:** `app/app/cashflow/investments/actions.ts`

- `createInvestment(formData)` – criar investimento
- `updateInvestment(formData)` – editar
- `deleteInvestment(formData)` – excluir
- Validação com Zod
- Permissão: apenas ADMIN/OWNER
- Respeita limite de transações do plano
- `revalidatePath("/app/cashflow")` após cada ação

### 3. Interface

**Componentes:** `components/cashflow/investment-dialogs.tsx`

- **CreateInvestmentDialog** – botão "Adicionar investimento", formulário (data, valor, descrição)
- **EditInvestmentDialog** – editar registro
- **DeleteInvestmentDialog** – excluir com confirmação
- Estilo em azul (#3B82F6) para diferenciar de despesas/entradas

**Página Cashflow:**

- Nova seção **"Investimentos do período"** (após Entradas manuais)
- Tabela: Data, Descrição, Valor, Ações (Editar/Excluir)
- Total do período no rodapé
- Layout responsivo (desktop = tabela, mobile = cards)
- Empty state com texto explicativo

### 4. Integração com Fluxo de Caixa

**Arquivo:** `lib/analytics/cashflow.ts`

- Busca de investimentos no período junto com expenses e manualIncomes
- **Totais:** `totals.investments` e inclusão em `totalOutflow`
- **Por dia:** `byDay` passa a ter `investments` no breakdown
- **Série:** cada `CashflowSeriesPoint.breakdown` tem `investments`
- **KPIs:** `totalInvestments` em `CashflowKpis`
- **OutflowBreakdown:** `bySource.investments` para gráfico "Para onde o dinheiro está indo"

**Fórmula de saída:**
```text
totalOutflow = adInvestment + fees + expenses + investments
```

### 5. Visualização

- **Seção Investimentos:** lista + total no período
- **Breakdown de saídas:** donut com fatia "Investimentos / reserva" (azul #3B82F6)
- **Modo planilha:** coluna "Investimentos" na tabela de cashflow + total
- **Export CSV:** coluna "Investimentos" e total no pé do arquivo

### 6. Export CSV

**Arquivo:** `app/app/exports/actions.ts`

- Cabeçalho atualizado: "Investimentos" como última coluna
- Cada linha de dia inclui `point.breakdown.investments`
- Linha de TOTAL inclui `kpis.totalInvestments`

---

## 📊 Fluxo do Usuário

1. **Registrar investimento**
   - Cashflow → seção "Investimentos do período" → "Adicionar investimento"
   - Preenche: Data, Valor, Descrição (ex: "Reserva de emergência", "CDB")
   - Salvar → valor entra como saída no fluxo de caixa

2. **Ver impacto**
   - Saídas totais aumentam
   - Lucro líquido diminui (investimento = saída)
   - Gráfico "Para onde o dinheiro está indo" mostra fatia Investimentos
   - Modo planilha e CSV mostram coluna Investimentos

3. **Editar / Excluir**
   - Na mesma tabela, ações Editar e Excluir por linha
   - Apenas ADMIN/OWNER pode alterar

---

## 🎨 Design

- **Cor dos investimentos:** #3B82F6 (azul)
- **Card da seção:** borda `border-[#3B82F6]/20`
- **Botão adicionar:** `bg-[#3B82F6]/20 text-[#3B82F6]`
- **Valores na tabela:** `text-[#3B82F6]`
- Consistente com o restante do app (cards, tabelas, breakdown)

---

## 📁 Arquivos Criados

1. `prisma/schema.prisma` – model Investment + relação em Workspace
2. `prisma/migrations/20260212180117_add_investment_model/migration.sql`
3. `app/app/cashflow/investments/actions.ts`
4. `components/cashflow/investment-dialogs.tsx`
5. `docs/SPRINT4-RESUMO.md`

## 📁 Arquivos Modificados

1. `lib/analytics/cashflow.ts` – tipos, queries, totais, série, KPIs, outflowBreakdown
2. `app/app/cashflow/page.tsx` – fetch investments, seção Investimentos, kpis.totalInvestments na planilha
3. `components/cashflow/cashflow-spreadsheet-view.tsx` – coluna e total Investimentos
4. `components/cashflow/outflow-breakdown-panel.tsx` – fatia Investimentos no donut
5. `app/app/exports/actions.ts` – coluna e total Investimentos no CSV

---

## ✅ Referência “Caixinha Nubank”

- **Ideia:** separar dinheiro para um objetivo (reserva, CDB, etc.).
- **No Cashflow Pro:** cada registro de investimento é um “direcionamento” de valor em uma data, com descrição livre.
- O valor sai do fluxo de caixa (reduz saldo/lucro do período) e fica visível em lista, breakdown e export.

---

## 🧪 Como Testar

1. **Criar:** Cashflow → Investimentos do período → Adicionar investimento (data, valor, descrição).
2. **Lista:** conferir linha na tabela e total no rodapé.
3. **Fluxo de caixa:** conferir que Saídas totais e Lucro líquido refletem o valor.
4. **Breakdown:** "Para onde o dinheiro está indo" com fatia "Investimentos / reserva".
5. **Planilha:** modo planilha com coluna Investimentos e total.
6. **Export CSV:** coluna Investimentos e linha de TOTAL.
7. **Editar/Excluir:** alterar valor/descrição e excluir; conferir atualização em lista e totais.

---

## 🚀 Sprint 4 - Concluída

Sistema de investimentos implementado de ponta a ponta: modelo, CRUD, UI, integração no fluxo de caixa, breakdown, planilha e export CSV.
