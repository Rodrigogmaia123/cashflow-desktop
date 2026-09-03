# 🔗 Guia de Integração - Componentes de Orçamentos

## 🎯 Como Integrar em Suas Páginas

Este guia mostra como adicionar os componentes de orçamentos em diferentes partes do sistema.

---

## 1. Widget no Dashboard Principal

### Adicionar ao Dashboard

**Arquivo:** `app/app/dashboard/page.tsx`

```typescript
import { DashboardBudgetWidget } from '@/components/budgets/dashboard-budget-widget';

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      {/* Métricas existentes */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="ROI" value="2.5x" />
        <MetricCard title="Lucro" value="R$ 50.000" />
        
        {/* NOVO: Widget de Orçamentos */}
        <DashboardBudgetWidget />
      </div>
      
      {/* Resto do dashboard */}
    </section>
  );
}
```

**Resultado:** Widget aparece junto com outras métricas, atualiza automaticamente a cada 1 minuto.

---

## 2. Indicadores nas Categorias

### A. Em Listas de Categorias

**Arquivo:** `app/app/settings/categories/page.tsx`

```typescript
import { CategoryBudgetIndicator } from '@/components/budgets/category-budget-indicator';

{categories.map((category) => (
  <div key={category.id} className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span>{category.name}</span>
      {/* NOVO: Indicador de orçamento */}
      <CategoryBudgetIndicator 
        categoryId={category.id}
        categoryName={category.name}
      />
    </div>
    <Button>Editar</Button>
  </div>
))}
```

### B. Em Formulários de Despesa

**Arquivo:** `components/cashflow/expense-dialogs.tsx` (exemplo)

```typescript
import { CategoryBudgetIndicator } from '@/components/budgets/category-budget-indicator';
import { BudgetImpactPreview } from '@/components/budgets/budget-impact-preview';

<select onChange={(e) => setCategoryId(e.target.value)}>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
  ))}
</select>

{/* NOVO: Preview de impacto */}
<BudgetImpactPreview 
  categoryId={categoryId}
  amount={parseFloat(amount)}
  date={date}
/>
```

### C. Em Dropdowns/Seletores

```typescript
import { CategoryBudgetBadge } from '@/components/budgets/category-budget-indicator';

<Popover>
  <PopoverTrigger>Selecionar Categoria</PopoverTrigger>
  <PopoverContent>
    {categories.map(cat => (
      <button key={cat.id}>
        {cat.name}
        {/* Badge minimalista */}
        <CategoryBudgetBadge categoryId={cat.id} />
      </button>
    ))}
  </PopoverContent>
</Popover>
```

---

## 3. Dashboard de Status Completo

### Já Integrado na Página de Orçamentos

**Arquivo:** `components/budgets/budgets-client-page.tsx`

```typescript
import { BudgetStatusDashboard } from './budget-status-dashboard';

export function BudgetsClientPage() {
  return (
    <div className="space-y-6">
      {/* Dashboard no topo */}
      <BudgetStatusDashboard />
      
      {/* Estatísticas */}
      {/* Filtros */}
      {/* Lista */}
    </div>
  );
}
```

**Já está funcionando!** ✅

---

## 4. Comparações Visuais

### Em Relatórios ou Análises

```typescript
import { BudgetComparisonList } from '@/components/budgets/budget-comparison-card';

export function BudgetReportPage() {
  const budgets = await fetchBudgets();
  
  return (
    <div>
      <h1>Relatório de Orçamentos</h1>
      
      {/* Lista detalhada */}
      <BudgetComparisonList 
        budgets={budgets}
        compact={false}  // Modo completo
      />
    </div>
  );
}
```

### Em Sidebar

```typescript
// Sidebar ou painel lateral
<aside className="w-64">
  <h3>Top 5 Orçamentos</h3>
  
  <BudgetComparisonList 
    budgets={topBudgets}
    compact={true}     // Modo compacto
    maxItems={5}       // Limitar a 5
  />
</aside>
```

---

## 5. Notificações Globais

### Em Layout Principal

**Arquivo:** `app/app/layout.tsx`

```typescript
import { BudgetNotifications } from '@/components/budgets/budget-notifications';

export default function AppLayout({ children }) {
  const user = await getCurrentUser();
  
  return (
    <div>
      {/* Header */}
      <Header />
      
      {/* NOVO: Notificações globais */}
      <div className="fixed top-20 right-4 w-96 z-50">
        <BudgetNotifications 
          workspaceId={user?.activeWorkspaceId}
          autoCheck={true}
          checkInterval={60000}
        />
      </div>
      
      {/* Conteúdo */}
      {children}
    </div>
  );
}
```

---

## 🎨 Personalizações

### Alterar Intervalos de Refresh

```typescript
// Mais frequente (atenção: mais requests)
<BudgetWidget />
// Usa useBudgetStatus({ refreshInterval: 60000 })

// Para mudar:
useBudgetStatus({
  autoRefresh: true,
  refreshInterval: 30000  // 30 segundos
})
```

### Alterar Cores

```typescript
// Em tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Personalizar cores dos alertas
        'budget-ok': '#10b981',      // Verde
        'budget-warning': '#f59e0b',  // Amarelo
        'budget-critical': '#f97316', // Laranja
        'budget-exceeded': '#ef4444', // Vermelho
      }
    }
  }
}
```

### Modo Dark

Todos os componentes já suportam dark mode:
```typescript
// Usa classes do Tailwind
bg-red-50 dark:bg-red-950
text-red-900 dark:text-red-100
```

---

## 🔌 Props dos Componentes

### BudgetWidget
```typescript
// Sem props - usa contexto automático
<BudgetWidget />
```

### BudgetStatusDashboard
```typescript
// Sem props - busca dados automaticamente
<BudgetStatusDashboard />
```

### BudgetComparisonCard
```typescript
interface Props {
  budget: BudgetWithUsage;  // Dados do orçamento
  compact?: boolean;         // Modo compacto (padrão: false)
}

<BudgetComparisonCard budget={budget} compact={true} />
```

### BudgetComparisonList
```typescript
interface Props {
  budgets: BudgetWithUsage[];  // Array de orçamentos
  compact?: boolean;            // Modo compacto (padrão: false)
  maxItems?: number;            // Limitar quantidade (opcional)
}

<BudgetComparisonList budgets={budgets} compact={false} maxItems={10} />
```

### CategoryBudgetIndicator
```typescript
interface Props {
  categoryId: string;      // ID da categoria
  categoryName: string;    // Nome para tooltip
}

<CategoryBudgetIndicator 
  categoryId="clx123abc"
  categoryName="Marketing"
/>
```

### CategoryBudgetBadge
```typescript
interface Props {
  categoryId: string;  // ID da categoria
}

<CategoryBudgetBadge categoryId="clx123abc" />
```

### BudgetImpactPreview
```typescript
interface Props {
  categoryId: string | null;  // ID da categoria (pode ser null)
  amount: number;              // Valor da despesa
  date: Date | string | null;  // Data da despesa (pode ser null)
}

<BudgetImpactPreview 
  categoryId={categoryId}
  amount={parseFloat(amount)}
  date={date}
/>
```

### BudgetNotifications
```typescript
interface Props {
  workspaceId?: string;     // ID do workspace (opcional)
  autoCheck?: boolean;      // Auto-refresh (padrão: false)
  checkInterval?: number;   // Intervalo em ms (padrão: 60000)
}

<BudgetNotifications 
  workspaceId={workspaceId}
  autoCheck={true}
  checkInterval={60000}
/>
```

---

## 🎯 Exemplos Completos

### Exemplo 1: Dashboard com Widget

```typescript
// app/app/dashboard/page.tsx
import { DashboardBudgetWidget } from '@/components/budgets/dashboard-budget-widget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      
      {/* Grid de métricas */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard title="ROI" value="2.5x" />
        <MetricCard title="Lucro" value="R$ 50K" />
        <MetricCard title="Vendas" value="325" />
        
        {/* Widget de Orçamentos */}
        <DashboardBudgetWidget />
      </div>
      
      {/* Gráficos */}
      <ChartSection />
    </div>
  );
}
```

### Exemplo 2: Formulário com Preview

```typescript
// components/cashflow/expense-dialog.tsx
import { BudgetImpactPreview } from '@/components/budgets/budget-impact-preview';

export function ExpenseDialog() {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());

  return (
    <Dialog>
      <DialogContent>
        {/* Campos do formulário */}
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        
        {/* Preview de impacto */}
        <BudgetImpactPreview 
          categoryId={categoryId}
          amount={parseFloat(amount) || 0}
          date={date}
        />
        
        <Button type="submit">Salvar</Button>
      </DialogContent>
    </Dialog>
  );
}
```

### Exemplo 3: Lista com Indicadores

```typescript
// app/app/settings/categories/page.tsx
import { CategoryBudgetIndicator } from '@/components/budgets/category-budget-indicator';

export default function CategoriesPage() {
  const categories = await getCategories();
  
  return (
    <div>
      <h1>Categorias</h1>
      
      <div className="space-y-2">
        {categories.map(cat => (
          <Card key={cat.id}>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">{cat.name}</span>
                
                {/* Indicador de orçamento */}
                <CategoryBudgetIndicator 
                  categoryId={cat.id}
                  categoryName={cat.name}
                />
              </div>
              
              <Button>Editar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚨 Erros Comuns e Soluções

### Erro: "workspaceId is undefined"
**Causa:** Usuário não tem workspace ativo

**Solução:**
```typescript
const user = await getCurrentUser();
if (!user?.activeWorkspaceId) {
  return <div>Configure um workspace primeiro</div>;
}
```

### Erro: Componente não atualiza
**Causa:** Auto-refresh não ativado

**Solução:**
```typescript
// Ativar auto-refresh
useBudgetStatus({
  autoRefresh: true,  // ← Importante
  refreshInterval: 60000
})
```

### Erro: Tooltip não aparece
**Causa:** TooltipProvider faltando

**Solução:**
```typescript
import { TooltipProvider } from '@/components/ui/tooltip';

<TooltipProvider>
  <CategoryBudgetIndicator {...props} />
</TooltipProvider>
```

---

## 📋 Checklist de Integração

### Antes de Integrar
- [ ] Importar componente correto
- [ ] Verificar props necessárias
- [ ] Garantir autenticação
- [ ] Verificar workspace ativo

### Durante Integração
- [ ] Testar estados vazios
- [ ] Testar com dados reais
- [ ] Verificar loading states
- [ ] Testar em mobile

### Após Integração
- [ ] Build sem erros
- [ ] Lint sem avisos
- [ ] Performance OK
- [ ] Documentar uso

---

## 🎯 Padrões Recomendados

### 1. Sempre Tratar Estados Vazios

```typescript
// ✅ Bom
if (!budgets || budgets.length === 0) {
  return <EmptyState />;
}

// ❌ Ruim
return <BudgetList budgets={budgets} />; // Pode quebrar
```

### 2. Loading States Claros

```typescript
// ✅ Bom
{loading && <Spinner />}
{!loading && data && <Content />}

// ❌ Ruim
{data && <Content />} // Usuário não sabe se está carregando
```

### 3. Error Boundaries

```typescript
// ✅ Bom
try {
  const data = await fetchBudgets();
  setData(data);
} catch (error) {
  setError(error.message);
}

// ❌ Ruim
const data = await fetchBudgets(); // Pode quebrar tudo
setData(data);
```

---

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ Interage
       ↓
┌─────────────┐
│ Componente  │
│   React     │
└──────┬──────┘
       │ usa Hook
       ↓
┌─────────────┐
│  use-budgets│
│  ou similar │
└──────┬──────┘
       │ fetch API
       ↓
┌─────────────┐
│ API Route   │
│ /api/budgets│
└──────┬──────┘
       │ chama Service
       ↓
┌─────────────┐
│ budget.ts   │
│ Service     │
└──────┬──────┘
       │ query DB
       ↓
┌─────────────┐
│  Database   │
│ PostgreSQL  │
└─────────────┘
```

---

## 💡 Dicas Avançadas

### 1. Otimizar Polling

```typescript
// Usar diferentes intervalos por importância
const widgetInterval = 60000;  // 1 min - menos crítico
const dashInterval = 30000;    // 30s - mais crítico
const notifInterval = 120000;  // 2 min - background
```

### 2. Debounce em Previews

```typescript
// Já implementado, mas se precisar customizar:
useEffect(() => {
  const timeoutId = setTimeout(() => {
    checkImpact();
  }, 500);  // Ajustar conforme necessário
  
  return () => clearTimeout(timeoutId);
}, [categoryId, amount, date]);
```

### 3. Cache Local

```typescript
// Para evitar requests desnecessários
const [cache, setCache] = useState<Map<string, any>>(new Map());

async function fetchWithCache(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetch(...);
  cache.set(key, data);
  return data;
}
```

---

## 🧪 Testes Manuais

### Widget no Dashboard
1. Acesse `/app/dashboard`
2. Verifique se widget aparece
3. Aguarde 1 minuto, deve atualizar
4. Clique em "Ver todos", deve navegar

### Indicador na Categoria
1. Acesse página com categorias
2. Passe mouse sobre badge
3. Tooltip deve aparecer
4. Verifique cores corretas

### Preview de Impacto
1. Abra formulário de despesa
2. Digite valores
3. Aguarde 500ms
4. Preview deve aparecer

---

## 📚 Recursos Úteis

### Documentação
- [RESUMO-CONSOLIDADO-ORCAMENTOS.md](./RESUMO-CONSOLIDADO-ORCAMENTOS.md) - Visão geral
- [API-BUDGETS-SPRINT3.md](./API-BUDGETS-SPRINT3.md) - API completa
- [GUIA-VISUAL-COMPONENTES.md](./GUIA-VISUAL-COMPONENTES.md) - Guia visual

### Exemplos no Código
- `components/budgets/budgets-client-page.tsx` - Uso completo
- `scripts/test-budgets.ts` - Testes de API
- `app/app/budgets/page.tsx` - Página server-side

---

**Última atualização:** 16 de Fevereiro de 2026
