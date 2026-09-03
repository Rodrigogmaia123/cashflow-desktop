# ✅ Sistema Canônico de Planos Implementado

## 🎯 Objetivo Alcançado

Sistema de planos internos **desacoplado do Stripe**, mantendo 100% de compatibilidade com o billing existente.

## 📦 O Que Foi Implementado

### 1️⃣ Arquivo Canônico: `lib/billing/plans.ts`

```typescript
// ✅ Tipo canônico de planos
export type Plan = "FREE" | "PRO" | "BUSINESS";

// ✅ Plano padrão
export const DEFAULT_PLAN: Plan = "FREE";

// ✅ Helper: verifica se é plano pago
export function isPaidPlan(plan: Plan): boolean;

// ✅ Mapa Stripe → Plano Interno
export function getStripePlanMap(): Record<string, Plan>;

// ✅ Conversão: Price ID → Plano
export function stripePriceIdToPlan(stripePriceId: string): Plan | null;

// ✅ Conversão: Plano → Price ID
export function planToStripePriceId(plan: Plan): string | null;

// ✅ Validação de Price ID
export function isValidStripePriceId(stripePriceId: string): boolean;
```

### 2️⃣ Mapa Stripe → Plano Interno

```typescript
// Configurado via variáveis de ambiente
{
  [STRIPE_PRICE_ID_PRO]: "PRO",
  [STRIPE_PRICE_ID_BUSINESS]: "BUSINESS"
}
```

**Validação automática**: Throw claro se variáveis não estiverem configuradas.

### 3️⃣ Webhook Atualizado

**Antes** (acoplado ao Stripe):
```typescript
// ❌ Confiava no metadata ou falhava
const plan = subscription.metadata?.plan;
if (!plan) throw new Error("...");
```

**Depois** (desacoplado):
```typescript
// ✅ Usa sistema canônico
const stripePriceId = subscription.items.data[0]?.price.id;
const plan = stripePriceIdToPlan(stripePriceId);

if (!plan) {
  // Fail-safe: loga warning e ignora
  console.warn(`Price ID "${stripePriceId}" não reconhecido`);
  return;
}
```

### 4️⃣ Sincronização Robusta

Estratégia em camadas em `syncSubscriptionFromStripe()`:

```typescript
// PRIORIDADE 1: Metadata (compatibilidade retroativa)
if (subscription.metadata?.plan) {
  plan = subscription.metadata.plan;
}

// PRIORIDADE 2: Mapa canônico (sistema novo)
if (!plan) {
  plan = stripePriceIdToPlan(stripePriceId);
}

// FAIL-SAFE: Price ID desconhecido
if (!plan) {
  throw new Error("Price ID não mapeado");
}
```

### 5️⃣ Persistência Correta

```prisma
model Subscription {
  plan          String  // ← PLANO INTERNO (fonte de verdade)
  stripePriceId String? // ← Referência ao gateway (auditoria)
  status        String
  // ...
}
```

**Regras implementadas**:
- ✅ SEMPRE salva plano interno
- ✅ SEMPRE salva stripePriceId (referência)
- ✅ NUNCA usa stripePriceId para lógica
- ✅ Logs claros de conversão

### 6️⃣ Imports Atualizados

Todos os arquivos agora importam do sistema canônico:

```typescript
// ✅ CORRETO
import type { Plan } from "@/lib/billing/plans";
import { isPaidPlan, DEFAULT_PLAN } from "@/lib/billing/plans";

// ❌ EVITAR (deprecated)
import type { Plan } from "@/lib/billing/config";
```

**Arquivos atualizados**:
- ✅ `lib/billing/stripe.ts`
- ✅ `lib/billing/config.ts`
- ✅ `lib/auth/types.ts`
- ✅ `app/app/billing/actions.ts`
- ✅ `app/app/admin/actions.ts`
- ✅ `app/api/webhooks/stripe/route.ts`
- ✅ `components/billing/*.tsx`
- ✅ `components/admin/*.tsx`

### 7️⃣ Documentação Completa

```
lib/billing/
├── plans.ts              ← Sistema canônico
├── config.ts             ← Config de UI
├── stripe.ts             ← Gateway (usa canônico)
├── types.ts              ← Tipos compartilhados
├── ARCHITECTURE.md       ← Arquitetura completa
└── README.md             ← Guia rápido
```

## ✅ Critérios de Sucesso Atendidos

| Critério | Status |
|----------|--------|
| Billing continua funcionando | ✅ |
| Webhook tipado e seguro | ✅ |
| Fácil trocar gateway | ✅ |
| Nenhuma regressão | ✅ |
| Sem uso de `any` | ✅ |
| Sem `@ts-ignore` | ✅ |
| Código server-only | ✅ |
| UI não alterada | ✅ |
| Fluxos não alterados | ✅ |
| Webhooks não quebrados | ✅ |

## 🔄 Como Funciona

### Fluxo de Checkout

```
Usuário seleciona "PRO"
    ↓
planToStripePriceId("PRO") → "price_xxx123"
    ↓
Stripe processa pagamento
    ↓
Webhook recebe price_xxx123
    ↓
stripePriceIdToPlan("price_xxx123") → "PRO"
    ↓
Salva "PRO" no user.plan
```

### Fluxo de Verificação

```typescript
// Lógica de negócio usa APENAS plano interno
if (isPaidPlan(user.plan)) {
  // Usuário tem PRO ou BUSINESS
}

// NUNCA usa price_id do Stripe
if (subscription.stripePriceId === "price_xxx") { // ❌ ERRADO
```

## 🛡️ Fail-Safe Implementado

```typescript
// 1. Price ID desconhecido
const plan = stripePriceIdToPlan("price_unknown");
// → Retorna null
// → Loga warning
// → Não quebra sistema

// 2. Variáveis faltando
getStripePlanMap();
// → Throw claro na inicialização
// → Fácil identificar problema

// 3. Plano inválido
if (plan !== "PRO" && plan !== "BUSINESS") {
  throw new Error("Plano inválido");
}
// → Não atualiza usuário
// → Estado consistente
```

## 🔄 Como Trocar de Gateway

Exemplo: Trocar Stripe por Paddle

```typescript
// 1. Criar novo mapa
// lib/billing/paddle.ts
export function getPaddlePlanMap(): Record<string, Plan> {
  return {
    [process.env.PADDLE_PLAN_ID_PRO!]: "PRO",
    [process.env.PADDLE_PLAN_ID_BUSINESS!]: "BUSINESS",
  };
}

export function paddlePlanIdToPlan(planId: string): Plan | null {
  const map = getPaddlePlanMap();
  return map[planId] || null;
}

// 2. Criar sync function
export async function syncSubscriptionFromPaddle(
  paddleSubscription: PaddleSubscription
): Promise<void> {
  const plan = paddlePlanIdToPlan(paddleSubscription.planId);
  
  if (!plan) {
    throw new Error(`Paddle plan ID não mapeado`);
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { plan } // Usa plano interno
  });
}

// 3. O resto continua igual!
// - UI não muda
// - Lógica de negócio não muda
// - Apenas troca o gateway
```

## 📊 Exemplo Completo

### Cenário: Webhook recebe subscription

```typescript
// 1. Stripe envia evento
{
  type: "customer.subscription.created",
  data: {
    object: {
      items: [{ price: { id: "price_xxx123" } }],
      metadata: { userId: "user_123" }
    }
  }
}

// 2. Webhook handler
const subscription = event.data.object;
await syncSubscriptionFromStripe(subscription);

// 3. Dentro de syncSubscriptionFromStripe
const stripePriceId = subscription.items.data[0]?.price.id;
// → "price_xxx123"

const plan = stripePriceIdToPlan(stripePriceId);
// → "PRO" (via mapa canônico)

// 4. Salva no banco
await prisma.subscription.create({
  data: {
    plan: "PRO",              // ← Plano interno
    stripePriceId: "price_xxx123", // ← Referência
    status: "active"
  }
});

await prisma.user.update({
  where: { id: "user_123" },
  data: { plan: "PRO" }       // ← Fonte de verdade
});

// 5. Usuário tem acesso ao plano PRO!
```

## 🎓 Conceitos Chave

### Fonte de Verdade
- **Planos Internos** (`Plan`) definem funcionalidades
- **Gateway** (Stripe) apenas processa pagamentos
- Banco armazena **planos internos**, não IDs do gateway

### Desacoplamento
- Gateway pode ser trocado sem afetar sistema
- Mapeamento centralizado em `plans.ts`
- Lógica de negócio independente de gateway

### Robustez
- Price IDs desconhecidos não quebram sistema
- Logs claros para debug
- Estados sempre consistentes
- Compatibilidade retroativa

## 📚 Documentação

- **lib/billing/ARCHITECTURE.md** - Arquitetura completa
- **lib/billing/README.md** - Guia rápido de uso
- **lib/billing/plans.ts** - Código documentado
- **SISTEMA-CANONICO-PLANOS.md** - Este arquivo

## ✅ Resultado Final

Sistema de planos **profissional e escalável**:

✅ **Desacoplado**: Gateway é apenas um detalhe de implementação  
✅ **Robusto**: Fail-safe em todos os pontos críticos  
✅ **Tipado**: TypeScript sem `any` ou `@ts-ignore`  
✅ **Documentado**: Arquitetura e uso bem explicados  
✅ **Compatível**: Zero breaking changes  
✅ **Testável**: Fácil simular diferentes cenários  
✅ **Escalável**: Fácil adicionar novos gateways  

---

**💡 Regra de Ouro**:
> Planos Internos (FREE | PRO | BUSINESS) são a fonte de verdade.  
> Gateway de pagamento é apenas um meio de processar pagamentos.  
> Sempre converta: Gateway ID → Plano Interno → Lógica de Negócio.

