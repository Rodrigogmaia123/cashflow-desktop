# Checklist de Configuração do Billing

Use este checklist para garantir que tudo está configurado corretamente.

## ✅ Configuração Inicial

- [ ] **npm install executado** com sucesso
- [ ] **Migration aplicada** (`npm run prisma:migrate`)
- [ ] **Prisma Client gerado** (`npm run prisma:generate`)

## ✅ Variáveis de Ambiente

- [ ] Arquivo `.env` criado na raiz
- [ ] `STRIPE_SECRET_KEY` configurada (começa com `sk_test_` ou `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` configurada (começa com `whsec_`)
- [ ] `STRIPE_PRICE_ID_PRO` configurada (começa com `price_`)
- [ ] `STRIPE_PRICE_ID_BUSINESS` configurada (começa com `price_`)
- [ ] `NEXT_PUBLIC_APP_URL` configurada

## ✅ Stripe Dashboard

### Produtos Criados
- [ ] Produto "PRO" criado
  - [ ] Preço: R$ 49,00/mês
  - [ ] Tipo: Recorrente (mensal)
  - [ ] Price ID copiado
- [ ] Produto "BUSINESS" criado
  - [ ] Preço: R$ 99,00/mês
  - [ ] Tipo: Recorrente (mensal)
  - [ ] Price ID copiado

### Webhook Configurado
- [ ] Webhook endpoint criado
- [ ] URL configurada: `https://seu-dominio.com/api/webhooks/stripe`
- [ ] Eventos selecionados:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Webhook Secret copiado

## ✅ Banco de Dados

- [ ] Tabelas criadas:
  - [ ] `StripeCustomer`
  - [ ] `Subscription`
- [ ] Campo `stripeCustomerId` adicionado em `User`
- [ ] Relações configuradas corretamente

## ✅ Testes de Funcionalidade

### Área de Billing (`/app/billing`)
- [ ] Página carrega sem erros
- [ ] Plano atual é exibido corretamente
- [ ] Botão "Assinar" funciona nos planos PRO/BUSINESS
- [ ] Redirect para checkout do Stripe funciona
- [ ] Checkout completo atualiza plano do usuário
- [ ] Botão "Gerenciar assinatura" funciona (para usuários com subscription)

### Webhook
- [ ] Webhook recebe eventos do Stripe
- [ ] Logs aparecem no console do servidor
- [ ] Subscription é criada/atualizada no banco
- [ ] Plano do usuário é atualizado automaticamente
- [ ] Cancelamento volta usuário para plano FREE

### Área Admin (`/app/admin`)
- [ ] Usuário admin criado (via SQL ou seed)
- [ ] Página admin carrega para usuários admin
- [ ] Redirect acontece para não-admins
- [ ] Métricas exibidas corretamente:
  - [ ] Total de usuários
  - [ ] MRR calculado
  - [ ] Distribuição por plano
  - [ ] Usuários lifetime
- [ ] Ações admin funcionam:
  - [ ] Alterar plano de usuário
  - [ ] Tornar usuário Lifetime
  - [ ] Remover status Lifetime

## ✅ Segurança

- [ ] Stripe SDK usado apenas no servidor
- [ ] Nenhum import de Stripe em componentes client
- [ ] Webhook valida assinatura
- [ ] Server Actions retornam estados tipados
- [ ] Verificação de ownership implementada

## ✅ UI/UX

- [ ] Links "Assinatura" e "Admin" aparecem na sidebar
- [ ] Link "Admin" só aparece para admins
- [ ] Estados de loading funcionam
- [ ] Mensagens de erro são exibidas
- [ ] UI responsiva em mobile

## 🧪 Cartões de Teste Stripe

Use estes cartões para testar (modo test):

- **Sucesso**: `4242 4242 4242 4242`
- **Requer autenticação**: `4000 0025 0000 3155`
- **Decline**: `4000 0000 0000 9995`

CVV: qualquer 3 dígitos
Data: qualquer data futura
CEP: qualquer código postal

## 📝 Criar Usuário Admin

Execute no banco de dados ou via Prisma Studio:

```sql
UPDATE User 
SET isAdmin = true 
WHERE email = 'seu-email@example.com';
```

Ou via Prisma:

```typescript
await prisma.user.update({
  where: { email: 'seu-email@example.com' },
  data: { isAdmin: true }
});
```

## 🚀 Deploy em Produção

Quando for para produção:

- [ ] Trocar chaves test por chaves live do Stripe
- [ ] Atualizar URL do webhook para produção
- [ ] Configurar `NEXT_PUBLIC_APP_URL` para domínio de produção
- [ ] Testar fluxo completo em produção
- [ ] Monitorar logs do webhook

## ❓ Problemas Comuns

### Checkout não funciona
- Verificar se Price IDs estão corretos
- Confirmar que `NEXT_PUBLIC_APP_URL` está configurado
- Checar logs do servidor

### Webhook não atualiza plano
- Verificar se webhook está recebendo eventos (Dashboard Stripe)
- Confirmar assinatura do webhook
- Verificar se metadata contém `userId` e `plan`
- Checar logs do servidor

### Área admin não aparece
- Confirmar que usuário tem `isAdmin = true`
- Verificar se link aparece na sidebar
- Checar redirect no código

## 📚 Documentação

- `BILLING-SETUP.md` - Guia completo de configuração
- `IMPLEMENTACAO-BILLING.md` - Resumo da implementação
- `ENV-TEMPLATE.md` - Template de variáveis de ambiente
- Código fonte - Todos os arquivos estão documentados

