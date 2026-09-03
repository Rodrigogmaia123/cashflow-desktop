# 🚀 PRÓXIMOS PASSOS: Após Configurar .env.local

## ✅ O QUE JÁ FOI FEITO

- [x] Stripe CLI instalado
- [x] Login realizado
- [x] Webhook secret gerado
- [x] .env.local configurado com todas as variáveis

---

## 📋 PASSO 1: VERIFICAR CONFIGURAÇÃO

### 1.1 Verificar se o Stripe CLI está rodando

Você precisa ter um terminal com o Stripe CLI rodando:

```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

⚠️ **IMPORTANTE:** Mantenha este terminal aberto enquanto desenvolve!

### 1.2 Iniciar o servidor Next.js

Em um **novo terminal**, inicie o servidor:

```powershell
cd "C:\Users\Usuário\Desktop\Cashflow Pro"
npm run dev
```

### 1.3 Verificar se não há erros

No terminal do Next.js, você **NÃO** deve ver erros como:

❌ **ERRADOS:**
- "STRIPE_SECRET_KEY não configurada"
- "STRIPE_WEBHOOK_SECRET não configurada"
- "STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS devem estar configurados"

✅ **CORRETO:**
- Servidor iniciando normalmente
- "Ready" ou "compiled successfully"
- Porta 3000 rodando

---

## 🧪 PASSO 2: TESTAR WEBHOOKS

### 2.1 Testar evento de checkout

Em um **novo terminal PowerShell**:

```powershell
# Adicionar Stripe CLI ao PATH (se necessário)
$env:Path += ";$env:USERPROFILE\scoop\shims"

# Testar checkout completado
stripe trigger checkout.session.completed
```

### 2.2 Verificar logs

**No terminal do Stripe CLI (`stripe listen`)**, você deve ver:

```
2024-12-20 XX:XX:XX --> checkout.session.completed [evt_xxxxx]
2024-12-20 XX:XX:XX <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

✅ **Status 200** = Webhook funcionando perfeitamente!
❌ **Status 500** = Erro no código, verifique o terminal do Next.js

**No terminal do Next.js**, você deve ver logs como:

```
[webhook/stripe] Checkout session completed para subscription: cs_test_xxxxx
```

### 2.3 Testar outros eventos

```powershell
# Subscription criada
stripe trigger customer.subscription.created

# Subscription atualizada
stripe trigger customer.subscription.updated

# Pagamento bem-sucedido
stripe trigger invoice.payment_succeeded
```

---

## 🎯 PASSO 3: VALIDAR CONFIGURAÇÃO DO STRIPE

### 3.1 Verificar se as variáveis estão sendo lidas

Crie um arquivo de teste rápido para verificar (opcional):

No terminal do Next.js, quando iniciar, você deve ver que:
- ✅ Servidor inicia sem erros relacionados ao Stripe
- ✅ Não há mensagens de erro sobre variáveis faltando

### 3.2 Verificar no código (se necessário)

Se quiser verificar manualmente, você pode temporariamente adicionar um console.log em `lib/billing/stripe.ts`:

```typescript
console.log('Stripe configurado:', {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  hasProPrice: !!process.env.STRIPE_PRICE_ID_PRO,
  hasBusinessPrice: !!process.env.STRIPE_PRICE_ID_BUSINESS,
});
```

⚠️ **Remova este log depois de testar!**

---

## 🌐 PASSO 4: TESTAR INTERFACE DE BILLING (Se existir)

### 4.1 Acessar página de billing

Se o sistema tiver uma página de billing, acesse:

```
http://localhost:3000/app/billing
```

### 4.2 Verificar se os planos aparecem

- ✅ Deve ver os planos PRO e BUSINESS
- ✅ Preços devem estar corretos (R$ 49 e R$ 99)
- ✅ Botões de assinatura devem funcionar

### 4.3 Testar checkout (com cartão de teste)

**Cartões de teste do Stripe:**

✅ **Sucesso:**
- Número: `4242 4242 4242 4242`
- Data: Qualquer data futura (ex: 12/25)
- CVC: Qualquer 3 dígitos (ex: 123)
- CEP: Qualquer CEP válido

❌ **Falha:**
- Número: `4000 0000 0000 0002`

🔒 **Requer autenticação 3D Secure:**
- Número: `4000 0025 0000 3155`

---

## 🔄 PASSO 5: WORKFLOW COMPLETO DE TESTE

### 5.1 Criar assinatura

1. Faça login no sistema
2. Acesse a página de billing
3. Escolha um plano (PRO ou BUSINESS)
4. Clique em "Assinar" ou "Upgrade"
5. Complete o checkout com cartão de teste

### 5.2 Verificar webhook

1. No terminal do Stripe CLI, veja os eventos chegando
2. Verifique status 200
3. No terminal do Next.js, veja os logs do processamento

### 5.3 Verificar no banco de dados

O plano do usuário deve ser atualizado:
- De `FREE` para `PRO` ou `BUSINESS`
- Subscription deve ser criada no banco

### 5.4 Verificar interface

- Interface deve refletir o novo plano
- Features do plano devem estar desbloqueadas

---

## 📊 PASSO 6: MONITORAR LOGS

### 6.1 Logs importantes

**Terminal Stripe CLI:**
- Eventos sendo encaminhados
- Status das requisições (200 = OK, 500 = erro)

**Terminal Next.js:**
- Logs do webhook sendo processado
- Erros (se houver)
- Subscription sendo sincronizada

### 6.2 Logs do webhook handler

Você deve ver logs como:
```
[webhook/stripe] Checkout session completed para subscription: cs_test_xxxxx
[webhook/stripe] Subscription created: sub_xxxxx
[stripe] Plano resolvido via mapa canônico: price_xxxxx → PRO
[stripe] Usuário xxxxx atualizado para plano PRO
```

---

## ✅ CHECKLIST FINAL DE VALIDAÇÃO

Antes de considerar tudo pronto, verifique:

- [ ] Servidor Next.js inicia sem erros relacionados ao Stripe
- [ ] Stripe CLI está rodando em modo listen
- [ ] Teste `stripe trigger checkout.session.completed` retorna status 200
- [ ] Logs aparecem no terminal do Next.js
- [ ] Página de billing acessível (se existir)
- [ ] Planos aparecem corretamente
- [ ] Checkout funciona com cartão de teste
- [ ] Webhook processa eventos corretamente
- [ ] Plano do usuário é atualizado no banco
- [ ] Interface reflete o plano ativo

---

## 🆘 PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Servidor não inicia

**Erro:** "STRIPE_SECRET_KEY não configurada"

**Solução:**
1. Verifique se o arquivo é `.env.local` (não `.env`)
2. Verifique se a variável está escrita corretamente
3. Reinicie o servidor Next.js

### ❌ Webhook retorna 500

**Solução:**
1. Verifique os logs do Next.js para detalhes do erro
2. Confirme que o `STRIPE_WEBHOOK_SECRET` está correto
3. Verifique se está usando o secret do `stripe listen`, não do dashboard

### ❌ "Assinatura inválida" no webhook

**Solução:**
1. Certifique-se que está usando o webhook secret do `stripe listen`
2. Reinicie o Stripe CLI e copie o novo secret
3. Atualize o `.env.local` e reinicie o Next.js

### ❌ Price ID não encontrado

**Solução:**
1. Verifique se copiou o **Price ID** (`price_...`), não o Product ID (`prod_...`)
2. Confirme que os Price IDs estão no `.env.local`
3. Verifique se está usando os IDs do modo TEST

---

## 🎉 PRONTO PARA DESENVOLVER!

Após completar todos os passos acima, você está pronto para:

1. ✅ Desenvolver funcionalidades de billing
2. ✅ Testar fluxos de assinatura
3. ✅ Testar atualização de plano
4. ✅ Testar cancelamento
5. ✅ Implementar features específicas de cada plano

---

## 📚 RECURSOS ÚTEIS

- **Stripe Dashboard:** https://dashboard.stripe.com/test
- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Test Cards:** https://stripe.com/docs/testing

---

**Boa sorte com os testes! 🚀**

