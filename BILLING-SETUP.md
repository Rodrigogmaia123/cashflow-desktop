# Configuração do Sistema de Billing

Este documento descreve como configurar e usar o sistema de billing integrado com Stripe.

## 📋 Pré-requisitos

1. Conta no Stripe (https://stripe.com)
2. Chaves de API do Stripe (Secret Key e Publishable Key)
3. Webhook Secret do Stripe

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# App URL (para callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Criar Products e Prices no Stripe

1. Acesse o Dashboard do Stripe: https://dashboard.stripe.com
2. Vá em **Products** → **Add product**
3. Crie dois produtos:
   - **PRO**: R$ 49,00/mês
   - **BUSINESS**: R$ 99,00/mês
4. Copie os **Price IDs** e adicione às variáveis de ambiente:
   - `STRIPE_PRICE_ID_PRO`
   - `STRIPE_PRICE_ID_BUSINESS`

### 3. Configurar Webhook

1. No Dashboard do Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/webhooks/stripe`
4. Selecione os seguintes eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Signing secret** e adicione à variável `STRIPE_WEBHOOK_SECRET`

### 4. Aplicar Migration do Banco de Dados

Execute a migration do Prisma para criar as tabelas de billing:

```bash
npm run prisma:migrate
```

## 📦 Estrutura do Sistema

### Arquivos Principais

- `lib/billing/config.ts` - Configuração centralizada de planos
- `lib/billing/stripe.ts` - Integração isolada com Stripe (SERVER ONLY)
- `app/app/billing/actions.ts` - Server Actions para checkout e portal
- `app/api/webhooks/stripe/route.ts` - Handler de webhooks
- `app/app/billing/page.tsx` - Página de billing
- `app/app/admin/page.tsx` - Área administrativa

### Modelos do Banco de Dados

- **StripeCustomer**: Armazena relação User ↔ Stripe Customer
- **Subscription**: Espelha dados essenciais da assinatura

## 🚀 Uso

### Para Usuários

1. Acesse `/app/billing`
2. Visualize seu plano atual
3. Clique em "Assinar" para upgrade
4. Use "Gerenciar assinatura" para acessar o portal do Stripe

### Para Administradores

1. Acesse `/app/admin` (apenas usuários com `isAdmin = true`)
2. Visualize métricas:
   - Total de usuários
   - MRR (Monthly Recurring Revenue)
   - Distribuição por plano
3. Gerencie usuários:
   - Alterar plano manualmente
   - Tornar usuário Lifetime
   - Visualizar status de assinaturas

## 🔒 Segurança

- ✅ Webhooks validados com assinatura
- ✅ Lógica de billing apenas no servidor
- ✅ Nenhum dado sensível exposto no client
- ✅ Idempotência nos eventos
- ✅ Verificação de ownership

## 📝 Notas Importantes

1. **isLifetime**: Usuários com `isLifetime = true` não são cobrados, independente do plano
2. **Plan no User**: O plano é armazenado no modelo `User`, não no `Workspace`
3. **Valores no Servidor**: Preços nunca são hardcoded no frontend
4. **Gateway Desacoplado**: Arquitetura preparada para múltiplos gateways

## 🐛 Troubleshooting

### Webhook não está funcionando

1. Verifique se `STRIPE_WEBHOOK_SECRET` está correto
2. Confirme que a URL do webhook está acessível publicamente
3. Use o Stripe CLI para testar localmente:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Checkout não redireciona

1. Verifique se `NEXT_PUBLIC_APP_URL` está configurado
2. Confirme que os Price IDs estão corretos
3. Verifique os logs do servidor

### Subscription não atualiza

1. Verifique se o webhook está recebendo eventos
2. Confirme que o metadata contém `userId` e `plan`
3. Verifique os logs do webhook handler

## 🔄 Próximos Passos

- [ ] Adicionar suporte a múltiplos gateways
- [ ] Implementar trial periods
- [ ] Adicionar métricas avançadas no admin
- [ ] Implementar notificações de eventos de billing

