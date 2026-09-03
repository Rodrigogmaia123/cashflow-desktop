# 📚 Exemplos Práticos de Expansão de Receita

## 🎯 Como Usar os Componentes de Expansão

### 1. **Detectar e Mostrar Gatilhos em Dashboard**

```tsx
// app/app/dashboard/page.tsx
import { detectBusinessTriggers, shouldSuggestBusiness, getStrongestTrigger } from "@/lib/expansion/triggers";
import { BusinessUpgradeHint } from "@/components/expansion/business-upgrade-hint";
import { BusinessUpgradeModal } from "@/components/expansion/business-upgrade-modal";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { useState } from "react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (user.plan === "PRO") {
    const triggers = await detectBusinessTriggers(user.id, user.plan);
    const shouldShow = shouldSuggestBusiness(triggers);
    const strongest = getStrongestTrigger(triggers);
    
    return (
      <div>
        {/* Conteúdo do dashboard */}
        
        {shouldShow && strongest && (
          <>
            {strongest.recommendation === "show_modal" ? (
              <BusinessUpgradeModal
                isOpen={true}
                onClose={() => {}}
                trigger={strongest.trigger}
                context={strongest.context}
              />
            ) : (
              <BusinessUpgradeHint
                trigger={strongest.trigger}
                context={strongest.context}
                strength={strongest.strength}
                recommendation={strongest.recommendation}
              />
            )}
          </>
        )}
      </div>
    );
  }
}
```

### 2. **Mostrar Hint em Página de Workspaces**

```tsx
// app/app/workspaces/page.tsx
import { detectBusinessTriggers } from "@/lib/expansion/triggers";
import { BusinessUpgradeHint } from "@/components/expansion/business-upgrade-hint";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function WorkspacesPage() {
  const user = await getCurrentUser();
  
  if (user.plan === "PRO") {
    const triggers = await detectBusinessTriggers(user.id, user.plan);
    const workspaceTrigger = triggers.find(t => t.trigger === "multiple_workspaces");
    
    return (
      <div>
        {workspaceTrigger && workspaceTrigger.recommendation !== "show_modal" && (
          <BusinessUpgradeHint
            trigger={workspaceTrigger.trigger}
            context={workspaceTrigger.context}
            strength={workspaceTrigger.strength}
            recommendation={workspaceTrigger.recommendation}
          />
        )}
        
        {/* Lista de workspaces */}
      </div>
    );
  }
}
```

### 3. **Adicionar Toggle Anual/Mensal no Plan Selector**

```tsx
// components/billing/plan-selector.tsx (atualização)
"use client";

import { useState } from "react";
import { BillingIntervalToggle } from "./billing-interval-toggle";
import { getAnnualPlanConfig, formatMonthlyEquivalent } from "@/lib/billing/annual";

export function PlanSelector({ ... }) {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("year"); // Default anual
  
  // Calcular preços baseado no intervalo
  const getDisplayPrice = (plan: PlanConfig) => {
    if (plan.id === "FREE") return "Gratuito";
    
    if (billingInterval === "year") {
      const annualConfig = getAnnualPlanConfig(plan.id);
      return formatMonthlyEquivalent(annualConfig.monthlyEquivalent);
    }
    
    return formatPrice(plan.amount);
  };
  
  return (
    <div>
      {/* Toggle de intervalo */}
      <BillingIntervalToggle
        plan={currentPlan}
        interval={billingInterval}
        onIntervalChange={setBillingInterval}
      />
      
      {/* Cards de planos com preços atualizados */}
      {plans.map(plan => (
        <Card>
          <div>
            {getDisplayPrice(plan)}
            {billingInterval === "year" && plan.id !== "FREE" && (
              <span className="text-xs text-primary">
                (2 meses grátis)
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### 4. **Tracking de Expansão**

```typescript
import { trackBusinessTriggerDetected, trackAnnualCheckoutStarted } from "@/lib/analytics/expansion";

// Quando gatilho é detectado
trackBusinessTriggerDetected({
  trigger: "multiple_workspaces",
  strength: "strong",
  plan: "PRO",
  userId: user.id,
  context: {
    workspacesCount: 5,
  },
});

// Quando checkout anual é iniciado
trackAnnualCheckoutStarted({
  plan: "PRO",
  billingInterval: "year",
  savingsAmount: 9800, // R$ 98
  userId: user.id,
});
```

---

## 🎨 Casos de Uso por Gatilho

### Múltiplos Workspaces

**Onde mostrar:**
- Página de workspaces
- Ao tentar criar 4º workspace
- Dashboard quando tem 3+ workspaces

**Mensagem:**
```
"Você está gerenciando vários projetos"
"Colabore com sua equipe compartilhando workspaces..."
```

### Alto Volume de Transações

**Onde mostrar:**
- Dashboard quando próximo de 500/mês
- Relatório mensal
- Página de cashflow

**Mensagem:**
```
"Você está processando muitos dados"
"Automatize tarefas repetitivas..."
```

### Exportações Frequentes

**Onde mostrar:**
- Após exportar 3+ vezes no mês
- Página de exports

**Mensagem:**
```
"Você exporta relatórios frequentemente"
"Configure exportações automáticas..."
```

---

## 💰 Estratégia de Planos Anuais

### 1. Default Anual Selecionado

Sempre mostrar anual como opção padrão no checkout:

```tsx
const [billingInterval, setBillingInterval] = useState<"month" | "year">("year");
```

### 2. Destaque Visual

```tsx
{billingInterval === "year" && (
  <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
    2 meses grátis
  </div>
)}
```

### 3. Comparação Clara

```
Mensal: R$ 99/mês
Anual:  R$ 82,50/mês (R$ 990/ano)
        Economize R$ 198/ano
```

### 4. Social Proof (Opcional)

```tsx
<p className="text-xs text-muted-foreground">
  ⭐ 70% dos nossos clientes escolhem o plano anual
</p>
```

---

## 📊 Dashboard de Métricas (Futuro)

### Métricas de Expansão

```typescript
// Métricas para acompanhar
interface ExpansionMetrics {
  // Taxa de conversão PRO → BUSINESS
  proToBusinessRate: number;
  
  // Taxa de adoção anual
  annualAdoptionRate: number;
  
  // LTV por plano
  ltvFree: number;
  ltvProMonthly: number;
  ltvProAnnual: number;
  ltvBusinessMonthly: number;
  ltvBusinessAnnual: number;
  
  // Churn por plano
  churnFree: number;
  churnProMonthly: number;
  churnProAnnual: number;
  churnBusinessMonthly: number;
  churnBusinessAnnual: number;
  
  // Gatilhos mais eficazes
  topTriggers: {
    trigger: ExpansionTrigger;
    conversionRate: number;
  }[];
}
```

---

## ✅ Checklist de Implementação

### Backend
- [x] Sistema de detecção de gatilhos
- [x] Copy específico por gatilho
- [x] Estrutura de planos anuais
- [x] Tracking de expansão
- [ ] Integração Stripe para checkout anual

### Frontend
- [x] Componente BusinessUpgradeHint
- [x] Componente BusinessUpgradeModal
- [x] Toggle anual/mensal
- [ ] Atualizar plan-selector com anual
- [ ] Adicionar hints em páginas relevantes

### Analytics
- [x] Tracking de gatilhos
- [x] Tracking de upgrade BUSINESS
- [x] Tracking de escolha anual
- [ ] Dashboard de métricas de expansão

---

## 🚀 Próximos Passos

1. **Criar Price IDs Anuais no Stripe**
   - PRO Annual: Criar price no Stripe
   - BUSINESS Annual: Criar price no Stripe
   - Atualizar variáveis de ambiente

2. **Atualizar createCheckout**
   - Suportar parâmetro `billingInterval`
   - Usar price ID correto (mensal vs anual)

3. **Adicionar Hints em Páginas**
   - Dashboard
   - Workspaces
   - Exports
   - Settings

4. **Email Marketing**
   - Email para PRO com gatilhos sugerindo BUSINESS
   - Campanha de upgrade para anual

---

**Use estes exemplos para implementar expansão de receita em todo o sistema! 🎉**

