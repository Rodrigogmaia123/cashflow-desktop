# 📚 Exemplos Práticos de Conversão

## 🎯 Como Usar os Componentes de Conversão

### 1. **Adicionar Preview Premium em Dashboard**

```tsx
// app/app/dashboard/page.tsx
import { PreviewPremium, PreviewSummary } from "@/components/plans/preview-premium";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasFeature } from "@/lib/plans/features";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const canViewAdvancedReports = hasFeature(user.plan, "advanced_reports");

  return (
    <div>
      {canViewAdvancedReports ? (
        <AdvancedReportsChart data={data} />
      ) : (
        <PreviewPremium
          feature="advanced_reports"
          requiredPlan="PRO"
          previewType="blur"
          source="dashboard"
          currentPlan={user.plan}
        >
          <AdvancedReportsChart data={data} />
        </PreviewPremium>
      )}
    </div>
  );
}
```

### 2. **Mostrar Resumo Bloqueado**

```tsx
// Componente de resumo mensal
import { PreviewSummary } from "@/components/plans/preview-premium";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function MonthlySummary() {
  const user = await getCurrentUser();
  const summary = [
    { label: "Receita Total", value: "R$ 45.000" },
    { label: "Lucro Líquido", value: "R$ 12.500" },
    { label: "ROI Médio", value: "127%" },
  ];

  return (
    <PreviewSummary
      feature="advanced_reports"
      requiredPlan="PRO"
      summary={summary}
      currentPlan={user.plan}
      source="monthly_summary"
    />
  );
}
```

### 3. **Bloquear Exportação com Preview**

```tsx
// components/exports/export-button.tsx
"use client";

import { ExportButton } from "./export-button";
import { FeatureLock } from "@/components/plans/feature-lock";
import { hasFeature } from "@/lib/plans/features";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function ExportButtonWithLock() {
  const user = await getCurrentUser();
  const canExport = hasFeature(user.plan, "exports_excel");

  if (canExport) {
    return <ExportButton />;
  }

  return (
    <FeatureLock
      feature="exports_excel"
      requiredPlan="PRO"
      source="export_button"
      currentPlan={user.plan}
    >
      <ExportButton />
    </FeatureLock>
  );
}
```

### 4. **Aviso de Limite Próximo**

```tsx
// app/app/cashflow/page.tsx
import { LimitWarning } from "@/components/plans/limit-warning";
import { getUserUsage, getCurrentUser } from "@/lib/plans/authorization";

export default async function CashflowPage() {
  const user = await getCurrentUser();
  const usage = await getUserUsage();

  return (
    <div>
      {user.plan === "FREE" && usage.maxTransactionsPerMonth && (
        <LimitWarning
          currentValue={usage.transactionsThisMonth}
          limit={usage.maxTransactionsPerMonth}
          limitType="transactions"
          requiredPlan="PRO"
          source="cashflow_page"
          currentPlan={user.plan}
          userId={user.id}
        />
      )}
      {/* Resto da página */}
    </div>
  );
}
```

### 5. **Modal Contextual de Upgrade**

```tsx
"use client";

import { useState } from "react";
import { UpgradeModal } from "@/components/plans/upgrade-modal";
import { Button } from "@/components/ui/button";

export function UpgradeButton({ feature, currentPlan }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Fazer Upgrade
      </Button>
      <UpgradeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        feature={feature}
        requiredPlan="PRO"
        source="upgrade_button"
        currentPlan={currentPlan}
      />
    </>
  );
}
```

---

## 🎨 Exemplos de Copy Contextual

### Limite de Transações Atingido

```tsx
import { getLimitCopy } from "@/lib/conversion/copy";

const copy = getLimitCopy("transactions");
// copy.title = "Limite de lançamentos atingido"
// copy.description = "Você já registrou 100 lançamentos este mês..."
// copy.cta = "Desbloquear Lançamentos Ilimitados"
// copy.benefit = "Continue trabalhando sem limites"
```

### Feature Bloqueada

```tsx
import { getFeatureCopy } from "@/lib/conversion/copy";

const copy = getFeatureCopy("exports_excel");
// copy.title = "Exporte seus dados"
// copy.description = "Baixe tudo em Excel/CSV..."
// copy.cta = "Desbloquear Exportação Excel"
// copy.benefit = "Análise seus dados onde quiser"
```

---

## 📊 Tracking de Eventos

### Client-Side (React Components)

```tsx
"use client";

import { trackFeatureLocked, trackPreviewViewed } from "@/lib/analytics/conversion";

function MyComponent() {
  const handleExportClick = () => {
    trackFeatureLocked({
      feature: "exports_excel",
      source: "export_button",
      plan: "FREE",
      requiredPlan: "PRO",
    });
  };

  return <Button onClick={handleExportClick}>Exportar</Button>;
}
```

### Server-Side (Actions)

```typescript
import { trackLimitReached } from "@/lib/analytics/conversion";

export async function createExpense(formData: FormData) {
  const check = await checkTransactionLimit();
  
  if (!check.allowed) {
    // Tracking já é feito automaticamente pelo componente
    // Mas você pode adicionar aqui também se necessário
    throw new Error(check.reason);
  }
  
  // Criar despesa...
}
```

---

## 🚀 Implementações Recomendadas

### 1. Dashboard com Previews

Adicione preview premium nos gráficos avançados:

```tsx
<PreviewPremium
  feature="advanced_reports"
  requiredPlan="PRO"
  previewType="blur"
>
  <ComplexChart />
</PreviewPremium>
```

### 2. Página de Relatórios

Mostre resumo bloqueado:

```tsx
<PreviewSummary
  feature="historical_analysis"
  requiredPlan="PRO"
  summary={[
    { label: "Comparação Mensal", value: "+23%" },
    { label: "Tendência", value: "Crescimento" },
  ]}
/>
```

### 3. Lista de Workspaces

Bloqueie visualmente workspaces extras:

```tsx
{workspaces.map((ws, idx) => (
  idx >= 1 && user.plan === "FREE" ? (
    <FeatureLock feature="workspaces_unlimited" requiredPlan="PRO">
      <WorkspaceCard workspace={ws} />
    </FeatureLock>
  ) : (
    <WorkspaceCard workspace={ws} />
  )
))}
```

---

## 🎯 Checklist de Conversão

- [ ] Preview premium em gráficos avançados
- [ ] Resumo bloqueado em relatórios
- [ ] Aviso de limite próximo (80%)
- [ ] Modal contextual ao atingir limite
- [ ] Tracking em todos os pontos de conversão
- [ ] Copy específico por contexto
- [ ] CTAs claros e acionáveis
- [ ] Progress visual de uso

---

**Use estes exemplos como base para implementar conversão em todo o sistema! 🎉**

