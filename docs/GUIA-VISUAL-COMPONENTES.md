# 🎨 Guia Visual - Componentes de Orçamentos

## 📦 Componentes Disponíveis

### 1. BudgetWidget (Dashboard Principal)

**Onde usar:** Dashboard principal, sidebar, resumo executivo

**Características:**
- 📊 Resumo financeiro compacto
- 🔄 Auto-refresh (1 minuto)
- ⚠️ Alertas visuais
- 📈 Barra de progresso geral
- 🔗 Links para gerenciamento

**Exemplo de uso:**
```typescript
import { BudgetWidget } from '@/components/budgets/budget-widget';

<BudgetWidget />
```

**Visual:**
```
┌──────────────────────────────┐
│ 📈 Orçamentos [3]     Ver →  │
├──────────────────────────────┤
│ ⚠️ 1 estourado • 2 alertas   │
├──────────────────────────────┤
│ Total Orçado    R$ 50.000    │
│ Total Gasto     R$ 42.500    │
│ Restante        R$  7.500    │
├──────────────────────────────┤
│ Uso Total                    │
│ ████████████████░░░░░   85%  │
├──────────────────────────────┤
│ ✓ 1 OK          [Gerenciar]  │
└──────────────────────────────┘
```

---

### 2. BudgetList (Página de Orçamentos)

**Onde usar:** Página principal de orçamentos

**Características:**
- 📋 Lista completa de orçamentos
- 📊 Cards detalhados
- ✏️ Botões de editar/excluir
- 🎨 Cores semafóricas
- ⚠️ Alertas contextuais

**Visual por Estado:**

#### Estado Normal (0-74%)
```
┌────────────────────────────────────────┐
│ Marketing Fevereiro 2026      [✏️][🗑️] │
│ [Marketing] • 01/02 - 28/02 • Mensal  │
├────────────────────────────────────────┤
│ Orçado      │ Gasto       │ Restante  │
│ R$ 10.000   │ R$ 6.500    │ R$ 3.500  │
├────────────────────────────────────────┤
│ Uso do orçamento              65.0%    │
│ █████████████░░░░░░░░░░░░              │
└────────────────────────────────────────┘
```

#### Estado Crítico (90%+)
```
┌────────────────────────────────────────┐
│ Marketing Fevereiro 2026 [🔴 Ativo]   │
│ [Marketing] • 01/02 - 28/02 • Mensal  │
├────────────────────────────────────────┤
│ Orçado      │ Gasto       │ Restante  │
│ R$ 10.000   │ R$ 9.200    │ R$   800  │
├────────────────────────────────────────┤
│ Uso do orçamento              92.0%    │
│ ██████████████████████░░               │
├────────────────────────────────────────┤
│ ⚠️ Você já usou 92% do orçamento      │
└────────────────────────────────────────┘
```

#### Estado Estourado (100%+)
```
┌────────────────────────────────────────┐
│ Marketing Fevereiro [🔴 ESTOURADO]    │
│ [Marketing] • 01/02 - 28/02 • Mensal  │
├────────────────────────────────────────┤
│ Orçado      │ Gasto       │ Excedido  │
│ R$ 10.000   │ R$ 11.500   │ R$ 1.500  │
├────────────────────────────────────────┤
│ Uso do orçamento             115.0%    │
│ ████████████████████████████           │
└────────────────────────────────────────┘
```

---

### 3. BudgetStatusDashboard (Status em Tempo Real)

**Onde usar:** Página de orçamentos (topo)

**Características:**
- 🔄 Auto-refresh (30 segundos)
- 📊 4 cards de métricas
- 📈 Barra de progresso geral
- ⚠️ Lista de alertas
- 🔄 Botão atualizar manual

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ Status dos Orçamentos         [🔄 Atualizar]           │
│ Última atualização: 23:30:45                           │
├─────────────────────────────────────────────────────────┤
│ ⚠️ Você tem 1 orçamento estourado e 2 com alertas     │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ Ativos   │ │ Orçado   │ │ Gasto    │ │ Uso      │  │
│ │   3      │ │ R$ 50K   │ │ R$ 42K   │ │  85%     │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────┤
│ Progresso Geral dos Orçamentos                         │
│ Uso total                                      85.0%   │
│ ████████████████████████░░░░░░░░░░░░                   │
│ R$ 0                                    R$ 50.000      │
├─────────────────────────────────────────────────────────┤
│ Alertas (2)                                            │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ⚠️ Marketing - 92.5% usado. R$ 750 restantes     │ │
│ └───────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ⚠️ Ferramentas - 88.0% usado. R$ 1.200 restantes│ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### 4. CategoryBudgetIndicator (Categorias)

**Onde usar:** Listas, dropdowns, formulários

**Visual:**

#### Categoria Normal
```
Categoria: Marketing [📈 65%]
                      ↑
                   Verde
```

#### Categoria em Atenção
```
Categoria: Hospedagem [📈 78%]
                        ↑
                     Amarelo
```

#### Categoria Crítica
```
Categoria: Ferramentas [⚠️ 92%]
                         ↑
                      Laranja
```

#### Categoria Estourada
```
Categoria: Publicidade [⚠️ 105%]
                         ↑
                      Vermelho
```

**Tooltip ao Hover:**
```
┌─────────────────────────┐
│ Marketing               │
│ Orçado:   R$ 10.000,00  │
│ Gasto:    R$  6.500,00  │
│ Restante: R$  3.500,00  │
│ ████████████░░░░░       │
└─────────────────────────┘
```

---

### 5. BudgetComparisonCard (Análise Detalhada)

**Onde usar:** Relatórios, comparações, análises

**Modo Normal:**
```
┌──────────────────────────────────────────┐
│ Orçamento Marketing Q1 2026   [Estourado]│
│ [Marketing]                               │
├──────────────────────────────────────────┤
│                                           │
│    92.5%                                  │
│ █████████████████████████████░░░          │
│                                           │
│ R$ 0                        R$ 10.000    │
├──────────────────────────────────────────┤
│ Orçado       │ Gasto        │ Excedido  │
│ R$ 10.000    │ R$ 11.250    │ R$ 1.250  │
├──────────────────────────────────────────┤
│ ⚠️ Você já usou 92% do orçamento        │
└──────────────────────────────────────────┘
```

**Modo Compacto:**
```
┌──────────────────────────────┐
│ Marketing Q1        92.5%    │
│ Marketing          R$ 11.250 │
│ ███████████████████░         │
└──────────────────────────────┘
```

---

## 🎯 Hierarquia de Informação

### Prioridade Visual (Ordem)
1. **Percentual de uso** - Maior e mais visível
2. **Valores monetários** - Destaque para gasto e restante
3. **Barra de progresso** - Rápida compreensão visual
4. **Detalhes** - Datas, tipo, categoria

### Cores por Importância
1. 🔴 **Vermelho** - Ação urgente necessária
2. 🟠 **Laranja** - Atenção imediata
3. 🟡 **Amarelo** - Monitoramento próximo
4. 🟢 **Verde** - Situação normal

---

## 📱 Exemplos de Integração

### Dashboard Principal
```typescript
export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      {/* Outras métricas */}
      <MetricCard />
      <ChartPanel />
      
      {/* Widget de Orçamentos */}
      <BudgetWidget />
      
      {/* Mais conteúdo */}
    </div>
  );
}
```

### Formulário de Despesa
```typescript
export default function ExpenseForm() {
  return (
    <form>
      <select name="category">
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
            {/* Indicador inline */}
            <CategoryBudgetBadge categoryId={cat.id} />
          </option>
        ))}
      </select>
      
      {/* Preview de impacto */}
      <BudgetImpactPreview 
        categoryId={categoryId}
        amount={amount}
        date={date}
      />
    </form>
  );
}
```

### Página de Análise
```typescript
export default function AnalysisPage() {
  return (
    <div>
      <h1>Análise de Orçamentos</h1>
      
      {/* Comparação visual detalhada */}
      <BudgetComparisonList 
        budgets={budgets}
        compact={false}
      />
    </div>
  );
}
```

---

## 🎨 Paleta de Cores

### Verde (Saudável)
```css
bg-green-500    /* Barra */
text-green-600  /* Texto */
bg-green-50     /* Fundo claro */
bg-green-950    /* Fundo dark */
border-green-200 /* Borda */
```

### Amarelo (Atenção)
```css
bg-yellow-500
text-yellow-600
bg-yellow-50
bg-yellow-950
border-yellow-200
```

### Laranja (Crítico)
```css
bg-orange-500
text-orange-600
bg-orange-50
bg-orange-950
border-orange-200
```

### Vermelho (Estourado)
```css
bg-red-500
text-red-600
bg-red-50
bg-red-950
border-red-200
```

---

## ✨ Animações

### Transições
```css
transition-all /* Mudanças suaves de width, cor, etc */
```

### Tooltips
```css
animate-in fade-in-0 zoom-in-95  /* Entrada */
animate-out fade-out-0 zoom-out-95 /* Saída */
```

### Spinners
```css
animate-spin /* Loading states */
```

---

## 💡 Dicas de UX

### 1. Feedback Imediato
- Sempre mostre loading states
- Use cores para comunicar severidade
- Animações suaves, não abruptas

### 2. Hierarquia Visual
- Informação mais importante = maior e mais visível
- Use cores apenas para destacar problemas
- Agrupe informações relacionadas

### 3. Progressive Disclosure
- Widget: Informação básica
- Card normal: Detalhes completos
- Tooltip: Informação extra ao hover
- Página completa: Análise profunda

### 4. Consistência
- Mesmas cores para mesmos estados
- Mesmo estilo de barras de progresso
- Mesma formatação de valores

---

## 🚀 Performance

### Otimizações
- ✅ Debounce em previews (500ms)
- ✅ Polling inteligente (não sobrecarga)
- ✅ Lazy loading de componentes
- ✅ Memoização de cálculos

### Boas Práticas
```typescript
// ✅ Bom: Auto-refresh moderado
refreshInterval: 60000 // 1 minuto

// ❌ Ruim: Auto-refresh muito frequente
refreshInterval: 1000 // 1 segundo
```

---

## 🎯 Checklist de Implementação

Ao adicionar componentes de orçamento:

- [ ] Importar componente correto
- [ ] Passar props necessárias
- [ ] Verificar autenticação
- [ ] Testar estados vazios
- [ ] Testar estados de erro
- [ ] Verificar responsividade
- [ ] Testar dark mode
- [ ] Verificar performance
- [ ] Adicionar loading states
- [ ] Documentar uso

---

**Última atualização:** 16 de Fevereiro de 2026
