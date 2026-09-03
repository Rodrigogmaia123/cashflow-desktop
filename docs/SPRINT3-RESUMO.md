# Sprint 3 - Visualização Modo Planilha ✅

## Status: IMPLEMENTADO

Data de Conclusão: 12/02/2026

---

## 📋 Objetivos da Sprint

- [x] Criar layout tipo planilha/tabela
- [x] Implementar toggle entre modo atual (cards/gráfico) e modo planilha
- [x] Adicionar visualização por oferta/todas
- [x] Implementar visualização por dias/meses
- [x] Garantir responsividade do novo modo

---

## 🔧 Mudanças Técnicas

### Novos Arquivos Criados

#### 1. `components/cashflow/cashflow-view-toggle.tsx`
Componente de toggle para alternar entre modos de visualização.

**Características:**
- Toggle estilo "segmented control"
- 2 modos: Cards e Planilha
- Ícones visuais para cada modo
- Persistência via URL (`?view=spreadsheet`)
- Transição sem refresh (scroll: false)

```typescript
type ViewMode = "cards" | "spreadsheet";
```

#### 2. `components/cashflow/cashflow-spreadsheet-view.tsx`
Componente principal da visualização em planilha.

**Características:**
- Tabela completa em desktop
- Cards compactos em mobile
- Filtro por oferta (todas ou específica)
- Agrupamento por dia ou mês
- Linha de totais destacada
- Cores consistentes com o tema

**Colunas da Planilha:**
1. Data / Mês
2. Entrada (Receita)
3. Saída (Total)
4. Saldo Diário
5. Saldo Acumulado
6. Investimento em Ads
7. Fees
8. Despesas

---

## ✨ Funcionalidades Implementadas

### 1. **Toggle de Visualização**

Interface moderna com 2 botões:

```
┌────────────────────────────────┐
│ [📊 Cards] [📋 Planilha]      │
└────────────────────────────────┘
```

- **Modo Cards:** Visualização atual (KPIs + gráfico)
- **Modo Planilha:** Nova visualização tabular

### 2. **Visualização em Planilha**

**Desktop:**
- Tabela completa com 8 colunas
- Header fixo ao rolar
- Linha de totais no footer
- Hover em linhas
- Cores por tipo de dado

**Mobile:**
- Cards compactos por período
- Layout responsivo 2 colunas
- Informações principais em destaque

### 3. **Filtro por Oferta**

```
┌─────────────────────────────┐
│ 🏷️ Todas as Ofertas ▼      │
├─────────────────────────────┤
│ Todas as Ofertas            │
│ Oferta A                    │
│ Oferta B                    │
│ Oferta C                    │
└─────────────────────────────┘
```

- Lista todas as ofertas do workspace
- Opção "Todas as Ofertas" (padrão)
- Seleção única
- Persistência via URL

### 4. **Agrupamento Temporal**

```
┌─────────────────────────┐
│ 📅 Por Dia ▼           │
├─────────────────────────┤
│ Por Dia                 │
│ Por Mês                 │
└─────────────────────────┘
```

- **Por Dia:** Uma linha por dia com dados
- **Por Mês:** Agrupa e soma valores do mês

### 5. **Cores Consistentes**

- 🟢 **Verde (#7CFF6B):** Entrada/Receita
- 🔴 **Vermelho (#FF5C5C):** Saída/Despesas
- 💚 **Verde Claro (#4DFF88):** Saldo positivo
- 🔴 **Vermelho (#FF5C5C):** Saldo negativo
- 💜 **Roxo (#A855F7):** Saldo acumulado

---

## 📊 Exemplos de Uso

### Cenário 1: Visualizar dados em formato planilha

1. Acessar página de Cashflow
2. Clicar no botão "Planilha" no toggle
3. Ver dados em formato tabular

**Resultado:**
- Tabela completa com todos os dias
- Fácil leitura e comparação
- Exportável mentalmente (formato familiar)

### Cenário 2: Analisar apenas uma oferta

1. No modo planilha, clicar em "Todas as Ofertas"
2. Selecionar oferta específica
3. Tabela filtra dados apenas daquela oferta

**Resultado:**
- Foco em performance de uma oferta
- Comparação temporal facilitada

### Cenário 3: Visão mensal

1. No modo planilha, clicar em "Por Dia"
2. Selecionar "Por Mês"
3. Ver dados agrupados mensalmente

**Resultado:**
- Visão macro do período
- Totais mensais calculados
- Menos linhas, mais insights

### Cenário 4: Voltar ao modo cards

1. Clicar no botão "Cards" no toggle
2. Retornar à visualização com gráficos

**Resultado:**
- Gráficos voltam a aparecer
- KPIs principais em destaque
- Preferência mantida na URL

---

## 🎨 Design e UX

### Toggle de Visualização

**Estado Inativo:**
```
┌──────────┬─────────────┐
│ 📊 Cards │ 📋 Planilha │
└──────────┴─────────────┘
```

**Estado Ativo (Planilha):**
```
┌──────────┬─────────────┐
│ 📊 Cards │ 📋 Planilha │ ← Azul/Primary
└──────────┴─────────────┘
```

### Tabela Desktop

```
┌────────┬─────────┬─────────┬──────────┬───────────┬──────┬──────┬──────────┐
│ Data   │ Entrada │ Saída   │ Saldo    │ Saldo     │ Ads  │ Fees │ Despesas │
│        │         │         │ Diário   │ Acumulado │      │      │          │
├────────┼─────────┼─────────┼──────────┼───────────┼──────┼──────┼──────────┤
│ 01/02  │ R$ 500  │ R$ 300  │ R$ 200   │ R$ 200    │ R$100│ R$50 │ R$ 150   │
│ 02/02  │ R$ 800  │ R$ 400  │ R$ 400   │ R$ 600    │ R$150│ R$70 │ R$ 180   │
├────────┼─────────┼─────────┼──────────┼───────────┼──────┼──────┼──────────┤
│ TOTAL  │ R$ 1300 │ R$ 700  │ R$ 600   │ R$ 600    │ R$250│ R$120│ R$ 330   │
└────────┴─────────┴─────────┴──────────┴───────────┴──────┴──────┴──────────┘
```

### Cards Mobile

```
┌─────────────────────────────┐
│ 01/02/2026     R$ 200       │
│                              │
│ Entrada       Saída          │
│ R$ 500        R$ 300         │
│                              │
│ Saldo Acum.   Investimento   │
│ R$ 200        R$ 100         │
└─────────────────────────────┘
```

---

## 🔍 Detalhes Técnicos

### Agrupamento por Mês

Função `groupByMonth()`:
- Agrupa dados por YYYY-MM
- Soma valores de entrada, saída e breakdown
- Mantém último saldo do mês
- Ordena cronologicamente

```typescript
function groupByMonth(data: CashflowDataPoint[]): CashflowDataPoint[]
```

### Formatação

**Datas:**
- Dia: `01/02/2026`
- Mês: `fevereiro de 2026`

**Valores:**
- Formato: `R$ 1.234,56`
- Locale: `pt-BR`
- Moeda: `BRL`

### Persistência

**Parâmetros de URL:**
- `view`: "cards" ou "spreadsheet"
- `groupBy`: "day" ou "month"
- `spreadsheetOffer`: ID da oferta ou "all"

**Exemplo:**
```
?view=spreadsheet&groupBy=month&spreadsheetOffer=offer123
```

---

## 📱 Responsividade

### Desktop (≥768px)
- Tabela completa com 8 colunas
- Header fixo ao scroll
- Largura automática das colunas
- Hover effects em linhas

### Mobile (<768px)
- Cards compactos empilhados
- Grid 2 colunas para métricas
- Scroll vertical suave
- Touch-friendly

---

## ✅ Validação de Qualidade

### Funcionalidade
- [x] Toggle entre modos funciona
- [x] Planilha renderiza corretamente
- [x] Filtro por oferta implementado
- [x] Agrupamento por dia/mês funciona
- [x] Totais calculados corretamente

### Interface
- [x] Design consistente com o app
- [x] Cores adequadas (verde/vermelho/roxo)
- [x] Responsiva (mobile e desktop)
- [x] Header fixo na tabela
- [x] Popover dos filtros funcionais

### Persistência
- [x] URL atualiza corretamente
- [x] Filtros persistem ao navegar
- [x] Modo selecionado mantido
- [x] Transição sem refresh

### Performance
- [x] Agrupamento eficiente
- [x] Renderização rápida
- [x] Sem lag ao alternar modos
- [x] Scroll suave

---

## 🚀 Próxima Sprint

### Sprint 4: Feature Investimentos
- Modelo de dados para investimentos
- Interface para adicionar investimentos
- Direcionar dinheiro para investimentos
- Dashboard de investimentos
- Integração com fluxo de caixa
- Referência: coluna de investir do Nubank

---

## 📝 Notas Técnicas

### Compatibilidade
- ✅ Next.js 16.0.10
- ✅ React 19.2.1
- ✅ TypeScript 5.4.5
- ✅ Tailwind CSS 3.4.4

### Dependências Utilizadas
- `next/navigation`
- `@/components/ui/card`
- `@/components/ui/button`
- `@/components/ui/popover`

### Performance
- Agrupamento otimizado com Map
- Renderização condicional (cards vs planilha)
- Lazy loading de ofertas
- Memoização implícita do React

---

## 📊 Estatísticas da Sprint

- **Componentes criados:** 2
- **Arquivos modificados:** 1
- **Linhas de código:** ~650
- **Features principais:** 5
- **Modos de visualização:** 2
- **Opções de agrupamento:** 2

---

## ✅ Sprint 3 - CONCLUÍDA

Modo Planilha implementado com sucesso! 🎉

**Funcionalidades:**
- ✅ Toggle entre Cards e Planilha
- ✅ Visualização tabular completa
- ✅ Filtro por oferta
- ✅ Agrupamento por dia/mês
- ✅ Responsivo (mobile + desktop)
- ✅ Persistência via URL

**Pronto para validação do usuário e Sprint 4!** 🚀
