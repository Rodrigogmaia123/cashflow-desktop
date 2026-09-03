# Sistema de Billing - Guia Rápido

## 📚 Arquivos

| Arquivo | Propósito | Import em |
|---------|-----------|-----------|
| `plans.ts` | **Sistema canônico** (fonte de verdade) | Server-side code |
| `config.ts` | Configuração de UI/apresentação | Frontend + Server |
| `stripe.ts` | Integração Stripe (SERVER ONLY) | Server Actions + Webhooks |
| `types.ts` | Tipos compartilhados | Qualquer lugar |

## 🎯 Uso Rápido

### Obter tipo de plano

```typescript
import type { Plan } from "@/lib/billing/plans";

const plan: Plan = "PRO"; // "FREE" | "PRO" | "BUSINESS"
```

### Verificar se é plano pago

```typescript
import { isPaidPlan } from "@/lib/billing/plans";

if (isPaidPlan(user.plan)) {
  // Plano PRO ou BUSINESS
}
```

### Validar plano

```typescript
import { isValidPlan } from "@/lib/billing/plans";

if (isValidPlan(input)) {
  // input é Plan válido
}
```

### Obter config de UI

```typescript
import { getPlanConfig } from "@/lib/billing/config";

const config = getPlanConfig("PRO");
// { name: "Pro", description: "...", features: [...], ... }
```

### Converter Stripe Price ID → Plano

```typescript
import { stripePriceIdToPlan } from "@/lib/billing/plans";

const plan = stripePriceIdToPlan("price_xxx123");
// Retorna: "PRO" | "BUSINESS" | null
```

## 🔐 Regras de Uso

### ✅ FAÇA

```typescript
// ✅ Use tipo canônico
import type { Plan } from "@/lib/billing/plans";

// ✅ Use constantes
import { DEFAULT_PLAN } from "@/lib/billing/plans";

// ✅ Use helpers
if (isPaidPlan(user.plan)) { ... }

// ✅ Confie no plano interno
const userPlan = user.plan; // Fonte de verdade
```

### ❌ NÃO FAÇA

```typescript
// ❌ Não hardcode planos
const plan = "PRO"; // Use Plan type

// ❌ Não use price_id para lógica
if (stripePriceId === "price_xxx") { ... } // ERRADO

// ❌ Não confie no gateway
if (stripeSubscription.plan === "pro") { ... } // ERRADO

// ❌ Não crie novos tipos de plano
type MyPlan = "free" | "pro"; // Use Plan canônico
```

## 🔄 Fluxos Comuns

### Novo checkout

```typescript
import { createCheckout } from "@/app/app/billing/actions";

// Usuario seleciona plano
await createCheckout("PRO");
// Sistema mapeia PRO → price_id automaticamente
```

### Webhook recebe evento

```typescript
import { syncSubscriptionFromStripe } from "@/lib/billing/stripe";

// Stripe envia subscription
const subscription = event.data.object;

// Sistema converte price_id → plano interno automaticamente
await syncSubscriptionFromStripe(subscription);
```

### Verificar permissões

```typescript
import { isPaidPlan } from "@/lib/billing/plans";

function canAccessFeature(user: AuthUser): boolean {
  // Lifetime tem acesso total
  if (user.isLifetime) return true;
  
  // Planos pagos têm acesso
  return isPaidPlan(user.plan);
}
```

## 📖 Documentação Completa

- **ARCHITECTURE.md** - Arquitetura completa do sistema
- **Código fonte** - Todos os arquivos estão documentados

## 🚀 Quick Start

```typescript
// 1. Importar tipos
import type { Plan } from "@/lib/billing/plans";
import { isPaidPlan, DEFAULT_PLAN } from "@/lib/billing/plans";

// 2. Usar em componentes
function MyComponent({ user }: { user: { plan: Plan } }) {
  if (isPaidPlan(user.plan)) {
    return <PremiumFeature />;
  }
  return <FreeFeature />;
}

// 3. Usar em actions
export async function myAction() {
  const user = await getCurrentUser();
  
  if (!isPaidPlan(user.plan)) {
    return { error: "Plano pago necessário" };
  }
  
  // ...
}
```

## ❓ FAQ

**Q: Onde está definido o tipo Plan?**  
A: `lib/billing/plans.ts` - Sistema canônico

**Q: Onde está a configuração de UI dos planos?**  
A: `lib/billing/config.ts` - Nome, descrição, features

**Q: Como adicionar novo plano?**  
A:
1. Adicionar ao tipo `Plan` em `plans.ts`
2. Adicionar ao `PLANS` em `config.ts`
3. Adicionar ao `STRIPE_PLAN_MAP` em `plans.ts`

**Q: Posso usar price_id do Stripe na lógica?**  
A: ❌ NÃO! Use sempre o plano interno (`user.plan`)

**Q: Como trocar de gateway?**  
A: Crie novo mapa (ex: `paddlePlanMap`) seguindo o padrão do Stripe

