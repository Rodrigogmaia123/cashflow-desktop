# Arquitetura de Billing - Sistema Canônico de Planos

## 🎯 Conceito Principal

O sistema de billing foi projetado com **separação clara** entre:
- **Planos Internos** (fonte de verdade)
- **Gateway de Pagamento** (meio de processamento)

```
┌─────────────────────────────────────┐
│   PLANOS INTERNOS (Canônico)       │
│   FREE | PRO | BUSINESS            │
│   → Fonte de verdade                │
│   → Definem funcionalidades         │
│   → Independentes de gateway        │
└──────────────┬──────────────────────┘
               │
               │ MAPEAMENTO
               ↓
┌─────────────────────────────────────┐
│   STRIPE (Gateway)                  │
│   price_xxx123 → PRO                │
│   price_xxx456 → BUSINESS           │
│   → Apenas processa pagamentos      │
│   → Pode ser trocado facilmente     │
└─────────────────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
lib/billing/
├── plans.ts          ← SISTEMA CANÔNICO (fonte de verdade)
│   ├── Plan type
│   ├── DEFAULT_PLAN
│   ├── isPaidPlan()
│   ├── getStripePlanMap()
│   └── stripePriceIdToPlan()
│
├── config.ts         ← Configuração de UI/apresentação
│   ├── PlanConfig (nome, descrição, features)
│   └── PLANS (visual para frontend)
│
├── stripe.ts         ← Integração com gateway (SERVER ONLY)
│   ├── getOrCreateStripeCustomer()
│   ├── createCheckoutSession()
│   └── syncSubscriptionFromStripe() ← USA MAPA CANÔNICO
│
└── types.ts          ← Tipos compartilhados
```

## 🔄 Fluxo de Dados

### 1. Checkout (User → Stripe)

```typescript
// 1. Usuário seleciona plano interno
const selectedPlan: Plan = "PRO";

// 2. Sistema obtém price_id do Stripe via mapa
const priceId = planToStripePriceId(selectedPlan); // "price_xxx123"

// 3. Cria checkout session no Stripe
createCheckoutSession(customerId, priceId, userId, selectedPlan);

// 4. Stripe processa pagamento
```

### 2. Webhook (Stripe → Internal Plan)

```typescript
// 1. Stripe envia evento com subscription
const subscription = {
  items: [{ price: { id: "price_xxx123" } }],
  metadata: { userId: "user_123" }
};

// 2. Sistema converte price_id → plano interno
const plan = stripePriceIdToPlan("price_xxx123"); // "PRO"

// 3. Atualiza plano do usuário
await prisma.user.update({
  where: { id: userId },
  data: { plan } // Salva plano interno, não price_id
});
```

## 🔐 Estratégia de Resolução de Plano

A função `syncSubscriptionFromStripe()` usa **estratégia em camadas**:

```typescript
// PRIORIDADE 1: Metadata (compatibilidade retroativa)
if (subscription.metadata?.plan) {
  plan = subscription.metadata.plan;
}

// PRIORIDADE 2: Mapa canônico (sistema novo)
if (!plan) {
  const priceId = subscription.items.data[0]?.price.id;
  plan = stripePriceIdToPlan(priceId); // USA MAPA
}

// FAIL-SAFE: Price ID desconhecido
if (!plan) {
  throw new Error("Price ID não mapeado");
}
```

### Por que esta estratégia?

1. **Compatibilidade**: Subscriptions antigas com metadata continuam funcionando
2. **Robustez**: Subscriptions sem metadata funcionam via mapa
3. **Segurança**: Price IDs desconhecidos não quebram o sistema
4. **Flexibilidade**: Fácil adicionar novos gateways

## 💾 Persistência no Banco

```prisma
model Subscription {
  plan            String  // ← PLANO INTERNO (fonte de verdade)
  stripePriceId   String? // ← Referência ao gateway (auditoria)
  status          String
  // ...
}

model User {
  plan       String  // ← PLANO INTERNO (FREE | PRO | BUSINESS)
  isLifetime Boolean // ← Override: ignora billing
  // ...
}
```

### Regras de Persistência

- ✅ **SEMPRE** salve o plano interno (`plan`)
- ✅ **SEMPRE** salve o `stripePriceId` (referência)
- ✅ **NUNCA** use `stripePriceId` para lógica de negócio
- ✅ **NUNCA** confie em dados do gateway como fonte de verdade

## 🔄 Como Trocar de Gateway

Se você quiser trocar Stripe por outro gateway (ex: Paddle, Mercado Pago):

### 1. Crie novo mapa

```typescript
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
```

### 2. Crie função de sincronização

```typescript
// lib/billing/paddle.ts

export async function syncSubscriptionFromPaddle(
  paddleSubscription: PaddleSubscription
): Promise<void> {
  const userId = paddleSubscription.userId;
  const paddlePlanId = paddleSubscription.planId;
  
  // USA MAPA CANÔNICO
  const plan = paddlePlanIdToPlan(paddlePlanId);
  
  if (!plan) {
    throw new Error(`Paddle plan ID "${paddlePlanId}" não mapeado`);
  }
  
  // Atualiza usuário com PLANO INTERNO
  await prisma.user.update({
    where: { id: userId },
    data: { plan }
  });
}
```

### 3. O resto do sistema continua igual!

- ✅ Planos internos não mudam
- ✅ UI não muda
- ✅ Lógica de negócio não muda
- ✅ Apenas troca o gateway

## 🛡️ Fail-Safe

O sistema tem proteções contra erros:

```typescript
// 1. Price ID desconhecido?
const plan = stripePriceIdToPlan(unknownPriceId);
// → Retorna null, loga warning, não quebra

// 2. Variáveis de ambiente faltando?
getStripePlanMap();
// → Throw claro na inicialização, fácil de debugar

// 3. Plano inválido em subscription?
if (plan !== "PRO" && plan !== "BUSINESS") {
  throw new Error("Plano inválido para subscription");
}
// → Não atualiza usuário, mantém estado consistente
```

## 📊 Exemplo Completo

### Cenário: Novo usuário assina plano PRO

```typescript
// 1. Frontend: Usuário clica em "Assinar PRO"
await createCheckout("PRO");

// 2. Server Action: Cria checkout no Stripe
const priceId = getPlanConfig("PRO").priceId; // "price_xxx123"
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: priceId, quantity: 1 }],
  metadata: { userId, plan: "PRO" }
});

// 3. Usuário completa pagamento no Stripe

// 4. Stripe envia webhook
POST /api/webhooks/stripe
{
  type: "customer.subscription.created",
  data: {
    object: {
      id: "sub_xxx",
      items: [{ price: { id: "price_xxx123" } }],
      metadata: { userId: "user_123", plan: "PRO" }
    }
  }
}

// 5. Webhook handler processa
const subscription = event.data.object;

// 6. Sistema resolve plano interno
const plan = stripePriceIdToPlan("price_xxx123"); // "PRO"

// 7. Atualiza banco de dados
await prisma.subscription.create({
  data: {
    userId: "user_123",
    plan: "PRO",           // ← Plano interno
    stripePriceId: "price_xxx123", // ← Referência
    status: "active"
  }
});

await prisma.user.update({
  where: { id: "user_123" },
  data: { plan: "PRO" }    // ← Fonte de verdade
});

// 8. Usuário agora tem acesso ao plano PRO!
```

## ✅ Checklist de Validação

Ao implementar novos recursos:

- [ ] Usa `Plan` de `lib/billing/plans.ts` (não hardcode)
- [ ] Nunca usa `stripePriceId` para lógica de negócio
- [ ] Sempre mapeia gateway → plano interno
- [ ] Trata caso de price ID desconhecido
- [ ] Loga conversões para auditoria
- [ ] Testa com/sem metadata
- [ ] Documenta mapeamento

## 🎓 Conceitos Chave

### Fonte de Verdade
- **Planos Internos** definem o que o usuário pode fazer
- **Gateway** apenas processa pagamentos
- Banco de dados armazena **planos internos**

### Desacoplamento
- Gateway pode ser trocado sem afetar o sistema
- Mapeamento centralizado em um lugar
- Lógica de negócio independente de gateway

### Fail-Safe
- Price IDs desconhecidos não quebram o sistema
- Logs claros para debug
- Estados sempre consistentes

---

**💡 Regra de Ouro**: 
> Se você precisa saber qual plano o usuário tem, use `user.plan` (Plan interno).
> Se você precisa processar pagamento, use o gateway apropriado e mapeie para Plan interno.

