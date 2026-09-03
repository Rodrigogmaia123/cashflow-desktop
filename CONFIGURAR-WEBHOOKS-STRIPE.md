# 🎯 CONFIGURAR WEBHOOKS STRIPE - PASSO A PASSO

## ✅ STATUS ATUAL
- [x] Stripe CLI instalado
- [x] Login feito com sucesso
- [ ] Webhooks configurados
- [ ] Teste realizado

---

## 📋 PASSO 1: INICIAR STRIPE CLI PARA ENCAMINHAR WEBHOOKS

### Abra um novo terminal PowerShell no diretório do projeto

```powershell
cd "C:\Users\Usuário\Desktop\Cashflow Pro"
```

### Execute o comando para escutar webhooks:

```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### O que acontece:
- O Stripe CLI criará um túnel temporário
- Todos os webhooks do Stripe serão encaminhados para seu localhost
- Você verá logs em tempo real no terminal

### Output esperado:
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

⚠️ **IMPORTANTE: NÃO FECHE ESTE TERMINAL!** Deixe rodando enquanto desenvolve.

---

## 🔑 PASSO 2: COPIAR O WEBHOOK SECRET

### Após executar o comando acima, você verá algo como:

```
> Ready! Your webhook signing secret is whsec_...
```

### Copie esse secret completo (começa com `whsec_`)

📝 **Cole em um bloco de notas temporário** enquanto configuramos o .env

---

## ⚙️ PASSO 3: ATUALIZAR .env.local

### Verifique se você tem um arquivo `.env.local` na raiz do projeto

Se não tiver, crie um baseado no `.env` existente.

### Adicione ou atualize as seguintes variáveis:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (você copiou quando criou os produtos)
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_BUSINESS=price_xxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL (para redirecionamento do Stripe)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### IMPORTANTE:
- **STRIPE_WEBHOOK_SECRET**: Use o secret que apareceu no terminal do `stripe listen` (não o do dashboard!)
- **STRIPE_SECRET_KEY**: Copie do dashboard em https://dashboard.stripe.com/test/apikeys
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Também está na mesma página da Secret Key
- **STRIPE_PRICE_ID_PRO e STRIPE_PRICE_ID_BUSINESS**: Os que você copiou quando criou os produtos

### Salve o arquivo

---

## 🧪 PASSO 4: TESTAR OS WEBHOOKS

### Você precisará de 2 terminais abertos:

**Terminal 1 - Stripe CLI (já deve estar rodando):**
```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Terminal 2 - Next.js (abra um novo terminal):**
```powershell
cd "C:\Users\Usuário\Desktop\Cashflow Pro"
npm run dev
```

### Terminal 3 - Testar evento (opcional, para teste rápido):

```powershell
# Testar checkout completado
stripe trigger checkout.session.completed

# Testar subscription criada
stripe trigger customer.subscription.created

# Testar pagamento bem-sucedido
stripe trigger invoice.payment_succeeded
```

### Verificar se está funcionando:

1. **No Terminal 1 (Stripe CLI)**, você deve ver:
   ```
   2024-12-20 10:30:00 --> checkout.session.completed [evt_xxxxx]
   2024-12-20 10:30:01 <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
   ```

2. **Status 200** = Webhook recebido com sucesso! ✅
3. **Status 500** = Erro no código, verifique o Terminal 2 (Next.js) para ver os logs

---

## 🔄 WORKFLOW COMPLETO DE DESENVOLVIMENTO

### Todo dia de desenvolvimento, você precisa:

1. **Terminal 1 - Iniciar Stripe CLI:**
   ```powershell
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

2. **Terminal 2 - Iniciar Next.js:**
   ```powershell
   npm run dev
   ```

3. **Deixe ambos rodando** enquanto desenvolve!

---

## 🎯 COMANDOS ÚTEIS DO STRIPE CLI

### Ver eventos recentes:
```powershell
stripe events list --limit 10
```

### Disparar eventos específicos para testar:
```powershell
# Checkout completado
stripe trigger checkout.session.completed

# Subscription criada
stripe trigger customer.subscription.created

# Subscription atualizada
stripe trigger customer.subscription.updated

# Subscription deletada
stripe trigger customer.subscription.deleted

# Pagamento bem-sucedido
stripe trigger invoice.payment_succeeded

# Pagamento falhou
stripe trigger invoice.payment_failed
```

### Ver detalhes de um evento específico:
```powershell
stripe events retrieve evt_xxxxxxxxxxxxx
```

### Ver logs detalhados (JSON):
```powershell
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe --print-json
```

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### Configuração Inicial:
- [ ] Stripe CLI instalado e funcionando
- [ ] Login feito (`stripe login`)
- [ ] Comando `stripe --version` funciona

### Webhooks:
- [ ] Terminal com `stripe listen` rodando
- [ ] Webhook secret copiado (do terminal, formato `whsec_...`)
- [ ] `.env.local` atualizado com `STRIPE_WEBHOOK_SECRET`
- [ ] `.env.local` tem `STRIPE_SECRET_KEY` configurada
- [ ] `.env.local` tem `STRIPE_PRICE_ID_PRO` configurado
- [ ] `.env.local` tem `STRIPE_PRICE_ID_BUSINESS` configurado
- [ ] `.env.local` tem `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurada
- [ ] `.env.local` tem `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Teste:
- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Teste: `stripe trigger checkout.session.completed`
- [ ] Verificado status 200 nos logs do Stripe CLI
- [ ] Verificado logs no terminal do Next.js

---

## 🆘 TROUBLESHOOTING

### ❌ "STRIPE_WEBHOOK_SECRET não configurada"

**Solução:**
- Verifique se o arquivo `.env.local` existe
- Certifique-se que a variável está escrita corretamente (sem espaços extras)
- Reinicie o servidor Next.js após atualizar o .env

### ❌ Webhook retorna 500

**Debug:**
1. Olhe os logs do Next.js (Terminal 2)
2. Verifique se a rota `/api/webhooks/stripe` está acessível
3. Verifique se o webhook secret está correto

### ❌ "Assinatura inválida" (Signature verification failed)

**Solução:**
- Certifique-se que está usando o webhook secret do `stripe listen`, não do dashboard
- Verifique se não há espaços extras no secret
- Reinicie o Stripe CLI e copie o novo secret

### ❌ Stripe CLI não encontra o servidor

**Solução:**
- Certifique-se que o Next.js está rodando na porta 3000
- Verifique se a URL está correta: `http://localhost:3000/api/webhooks/stripe`
- Tente acessar manualmente: http://localhost:3000/api/webhooks/stripe (deve dar erro 405 Method Not Allowed, mas isso confirma que a rota existe)

---

## 📝 NOTAS IMPORTANTES

### Quando usar qual webhook secret?

- **Desenvolvimento local**: Use o secret do `stripe listen` (formato `whsec_...`)
- **Produção**: Use o secret do dashboard Stripe (também formato `whsec_...`, mas diferente)

### Quando mudar de desenvolvimento para produção:

1. Configure webhook no dashboard Stripe apontando para sua URL pública
2. Copie o webhook secret do dashboard
3. Atualize `STRIPE_WEBHOOK_SECRET` no ambiente de produção
4. NÃO use mais o Stripe CLI em produção

---

## 🎉 PRÓXIMOS PASSOS

Após configurar os webhooks:

1. ✅ Teste criar uma assinatura através da interface
2. ✅ Verifique se os eventos aparecem no Stripe CLI
3. ✅ Confirme que o plano do usuário está sendo atualizado no banco
4. ✅ Teste cancelamento de assinatura
5. ✅ Teste atualização de plano

---

## 📚 RECURSOS ÚTEIS

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Webhooks Locally](https://stripe.com/docs/webhooks/test)

---

**Agora você está pronto para testar webhooks localmente! 🚀**

